const Daren = require('../models/daren');
const axios = require('axios');
const cheerio = require('cheerio');

async function routes(fastify, options) {
  // Get all darens
  fastify.get('/api/darens', async (request, reply) => {
    try {
      const darens = await Daren.find();
      reply.send(darens);
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
}

module.exports = routes; 