const Daren = require('../models/daren');
const axios = require('axios');
const cheerio = require('cheerio');

async function routes(fastify, options) {
  // Get all darens
  fastify.get('/api/darens', async (request, reply) => {
    try {
      const { period } = request.query;
      const query = {};
      if (period) {
        query.period = { $regex: period, $options: 'i' }; // Use regex for fuzzy search
      }
      const darens = await Daren.find(query);
      reply.send(darens);
    } catch (err) {
      reply.code(500).send(err);
    }
  });

  // Get distinct periods
  fastify.get('/api/periods', async (request, reply) => {
    try {
      const periods = await Daren.find().distinct('period');
      // filter out null or empty periods
      reply.send(periods.filter(p => p));
    } catch (err) {
      reply.code(500).send(err);
    }
  });

  // Get single daren
  fastify.get('/api/darens/:id', async (request, reply) => {
    try {
      const daren = await Daren.findById(request.params.id);
      reply.send(daren);
    } catch (err) {
      reply.code(500).send(err);
    }
  });

  // Add a new daren
  fastify.post('/api/darens', async (request, reply) => {
    try {
      const daren = new Daren(request.body);
      const newDaren = await daren.save();
      reply.code(201).send(newDaren);
    } catch (err) {
      reply.code(500).send(err);
    }
  });

  // Update a daren
  fastify.put('/api/darens/:id', async (request, reply) => {
    try {
      const daren = await Daren.findByIdAndUpdate(request.params.id, request.body, { new: true });
      reply.send(daren);
    } catch (err) {
      reply.code(500).send(err);
    }
  });

  // Delete a daren
  fastify.delete('/api/darens/:id', async (request, reply) => {
    try {
      await Daren.findByIdAndDelete(request.params.id);
      reply.send({ message: 'Daren deleted successfully' });
    } catch (err) {
      reply.code(500).send(err);
    }
  });

  // Parse nickname and other info from Xiaohongshu URL
  fastify.post('/api/parse-xhs-page', async (request, reply) => {
    const { url, cookie } = request.body;
    if (!url) {
      return reply.code(400).send({ message: 'URL is required' });
    }

    try {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      };
      if (cookie) {
        headers['Cookie'] = cookie;
      }

      const { data } = await axios.get(url, { headers });
      const $ = cheerio.load(data);

      const pageHtml = $.html();
      const initialStateMatch = pageHtml.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/);
      let parsedInfo = {};

      if (initialStateMatch && initialStateMatch[1]) {
          const initialState = JSON.parse(initialStateMatch[1]);
          const userPageData = initialState.user?.userPageData;
          if (userPageData) {
            parsedInfo = {
                nickname: userPageData.nickname,
                xiaohongshuId: userPageData.redId,
                followers: userPageData.fans,
                likesAndCollections: userPageData.liked,
                ipLocation: userPageData.ipLocation,
            };
          }
      }

      // Fallback for basic info from HTML structure
      if (!parsedInfo.nickname) {
          parsedInfo.nickname = $('.user-name').text().trim();
      }
      if (!parsedInfo.xiaohongshuId) {
          const redIdText = $('.user-redId').text().trim();
          if (redIdText) {
              parsedInfo.xiaohongshuId = redIdText.replace('小红书号：', '').trim();
          }
      }
      if (!parsedInfo.ipLocation) {
          const ipLocationText = $('.user-IP').text().trim();
          if (ipLocationText) {
              parsedInfo.ipLocation = ipLocationText.replace('IP属地：', '').trim();
          }
      }

      // Fallback to parse interaction stats from HTML structure
      if (!parsedInfo.followers || !parsedInfo.likesAndCollections) {
          $('.user-interactions > div').each((index, element) => {
              const el = $(element);
              const count = el.find('.count').text().trim();
              const type = el.find('.shows').text().trim();

              if (type === '粉丝' && !parsedInfo.followers) {
                  parsedInfo.followers = count;
              }
              if (type === '获赞与收藏' && !parsedInfo.likesAndCollections) {
                  parsedInfo.likesAndCollections = count;
              }
          });
      }

      if (Object.keys(parsedInfo).length > 0) {
        reply.send(parsedInfo);
      } else {
        reply.code(404).send({ message: 'Could not parse user information. The page structure may have changed, or the cookie is invalid/expired.' });
      }
    } catch (err) {
      console.error(err);
      reply.code(500).send({ message: 'Error parsing URL' });
    }
  });

  // Parse note info from Xiaohongshu note URL using Puppeteer
  fastify.post('/api/parse-xhs-note', async (request, reply) => {
    const { url, cookie } = request.body;
    if (!url) {
      return reply.code(400).send({ message: 'URL is required' });
    }
    if (!cookie) {
        return reply.code(400).send({ message: 'Cookie is required for parsing notes' });
    }

    let browser = null;
    try {
      const puppeteer = require('puppeteer');
      browser = await puppeteer.launch({ 
        headless: true, // headless: true for no UI
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
      });
      const page = await browser.newPage();
      
      // Manually set cookie
      const cookieObject = {
        name: 'xhsTracker', // A common cookie name, might need adjustment
        value: cookie,
        domain: '.xiaohongshu.com',
        path: '/',
      };
      await page.setCookie(cookieObject);
      
      await page.goto(url, { waitUntil: 'networkidle2' }); // Wait until network is idle

      // Wait for the specific element that contains the stats to appear
      await page.waitForSelector('.engage-bar-style .buttons');

      const noteData = await page.evaluate(() => {
        const title = document.querySelector('#noteContainer .title')?.innerText.trim() || '';
        
        const likeEl = document.querySelector('.like-wrapper .count');
        const collectEl = document.querySelector('.collect-wrapper .count');
        const commentEl = document.querySelector('.chat-wrapper .count');

        // Note: Author selectors are best-guesses and might need adjustment.
        const authorName = document.querySelector('.author-info .name')?.innerText.trim() || '';
        const authorLink = document.querySelector('.author-info a')?.href || '';
        
        const likes = likeEl ? parseInt(likeEl.innerText.replace(/,/g, ''), 10) : 0;
        const collections = collectEl ? parseInt(collectEl.innerText.replace(/,/g, ''), 10) : 0;
        const comments = commentEl ? parseInt(commentEl.innerText.replace(/,/g, ''), 10) : 0;
        
        return {
          title,
          likes,
          collections,
          comments,
          author: {
            nickname: authorName,
            homePage: authorLink,
          },
        };
      });

      reply.send(noteData);

    } catch (err) {
      console.error('Puppeteer parsing error:', err);
      reply.code(500).send({ message: 'Failed to parse note page with Puppeteer.' });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  });
}

module.exports = routes; 