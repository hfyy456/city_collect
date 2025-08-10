const Daren = require('../models/daren');
const axios = require('axios');
const cheerio = require('cheerio');

async function routes(fastify, options) {
  // Get all darens with advanced search
  fastify.get('/api/darens', async (request, reply) => {
    try {
      const { 
        period, 
        page = 1, 
        limit = 10,
        nickname,
        periods,
        contactPerson,
        hasConnection,
        arrivedAtStore,
        reviewed,
        published,
        feeMin,
        feeMax,
        likesMin,
        likesMax,
        startDate,
        endDate,
        ipLocations,
        cooperationMethod,
        sortBy = 'createdAt_desc'
      } = request.query;

      const query = {};
      
      // Legacy period support
      if (period) {
        query.period = { $regex: period, $options: 'i' };
      }
      
      // Advanced search filters
      if (nickname) {
        query.nickname = { $regex: nickname, $options: 'i' };
      }
      
      if (periods && periods.length > 0) {
        const periodArray = Array.isArray(periods) ? periods : [periods];
        query.period = { $in: periodArray };
      }
      
      if (contactPerson) {
        query.contactPerson = { $regex: contactPerson, $options: 'i' };
      }
      
      if (hasConnection !== undefined && hasConnection !== null) {
        query.hasConnection = hasConnection === 'true';
      }
      
      if (arrivedAtStore !== undefined && arrivedAtStore !== null) {
        query.arrivedAtStore = arrivedAtStore === 'true';
      }
      
      if (reviewed !== undefined && reviewed !== null) {
        query.reviewed = reviewed === 'true';
      }
      
      if (published !== undefined && published !== null) {
        query.published = published === 'true';
      }
      
      // Numeric range filters
      if (feeMin !== undefined || feeMax !== undefined) {
        query.fee = {};
        if (feeMin !== undefined) query.fee.$gte = parseFloat(feeMin);
        if (feeMax !== undefined) query.fee.$lte = parseFloat(feeMax);
      }
      
      if (likesMin !== undefined || likesMax !== undefined) {
        query.likes = {};
        if (likesMin !== undefined) query.likes.$gte = parseInt(likesMin);
        if (likesMax !== undefined) query.likes.$lte = parseInt(likesMax);
      }
      
      // Date range filter
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }
      
      // Array filters
      if (ipLocations && ipLocations.length > 0) {
        const locationArray = Array.isArray(ipLocations) ? ipLocations : [ipLocations];
        query.ipLocation = { $in: locationArray };
      }
      
      if (cooperationMethod) {
        query.cooperationMethod = { $regex: cooperationMethod, $options: 'i' };
      }
      
      // Sorting
      const sortOptions = {};
      const [field, direction] = sortBy.split('_');
      sortOptions[field] = direction === 'desc' ? -1 : 1;
      
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;
      
      const [darens, total] = await Promise.all([
        Daren.find(query).sort(sortOptions).skip(skip).limit(limitNum),
        Daren.countDocuments(query)
      ]);
      
      reply.send({ items: darens, total });
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

  // Get distinct IP locations
  fastify.get('/api/ip-locations', async (request, reply) => {
    try {
      const locations = await Daren.find().distinct('ipLocation');
      reply.send(locations.filter(l => l));
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

  // Parse user profile from Xiaohongshu user page
  fastify.post('/api/parse-xhs-user', async (request, reply) => {
    const { url, cookie } = request.body;
    if (!url) {
      return reply.code(400).send({ message: 'URL is required' });
    }

    try {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      };
      if (cookie) {
        headers['Cookie'] = cookie;
      }

      const { data } = await axios.get(url, { headers });
      const $ = cheerio.load(data);
      const pageHtml = $.html();

      let parsedInfo = {};

      // 尝试解析页面中的初始状态数据
      const initialStateMatch = pageHtml.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/);
      if (initialStateMatch && initialStateMatch[1]) {
        try {
          const initialState = JSON.parse(initialStateMatch[1]);
          const userPageData = initialState.user?.userPageData;
          if (userPageData) {
            parsedInfo = {
              type: 'user',
              nickname: userPageData.nickname,
              xiaohongshuId: userPageData.redId,
              followers: userPageData.fans,
              likesAndCollections: userPageData.liked,
              ipLocation: userPageData.ipLocation,
            };
          }
        } catch (parseError) {
          console.log('JSON解析失败，尝试HTML解析:', parseError.message);
        }
      }

      // 如果JSON解析失败，尝试HTML解析
      if (Object.keys(parsedInfo).length === 0) {
        parsedInfo.type = 'user';
        parsedInfo.nickname = $('.user-name').text().trim();

        const redIdText = $('.user-redId').text().trim();
        if (redIdText) {
          parsedInfo.xiaohongshuId = redIdText.replace('小红书号：', '').trim();
        }

        const ipLocationText = $('.user-IP').text().trim();
        if (ipLocationText) {
          parsedInfo.ipLocation = ipLocationText.replace('IP属地：', '').trim();
        }

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

      if (Object.keys(parsedInfo).length > 1) { // > 1 because we always have 'type'
        reply.send(parsedInfo);
      } else {
        reply.code(404).send({
          message: '无法解析用户信息。页面结构可能已更改，或Cookie无效/过期。'
        });
      }
    } catch (err) {
      console.error('解析用户页面时出错:', err);
      reply.code(500).send({ message: '解析用户页面时出错' });
    }
  });


  // Analytics endpoint
  fastify.get('/api/analytics', async (request, reply) => {
    try {
      const { startDate, endDate } = request.query;
      const dateFilter = {};
      
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Get all darens for analysis
      const darens = await Daren.find(dateFilter);
      const total = darens.length;

      // Calculate overview metrics
      const totalInvestment = darens.reduce((sum, d) => sum + (d.fee || 0), 0);
      const totalEngagement = darens.reduce((sum, d) => 
        sum + (d.likes || 0) + (d.comments || 0) + (d.collections || 0), 0);

      // Progress distribution
      const progressData = [
        {
          label: '已建联',
          count: darens.filter(d => d.hasConnection).length,
          percentage: 0,
          color: '#67C23A'
        },
        {
          label: '已到店',
          count: darens.filter(d => d.arrivedAtStore).length,
          percentage: 0,
          color: '#E6A23C'
        },
        {
          label: '已审稿',
          count: darens.filter(d => d.reviewed).length,
          percentage: 0,
          color: '#409EFF'
        },
        {
          label: '已发布',
          count: darens.filter(d => d.published).length,
          percentage: 0,
          color: '#F56C6C'
        }
      ];

      // Calculate percentages
      progressData.forEach(item => {
        item.percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
      });

      // Period comparison
      const periodGroups = {};
      darens.forEach(daren => {
        const period = daren.period || '未设置';
        if (!periodGroups[period]) {
          periodGroups[period] = {
            name: period,
            influencers: [],
            totalFee: 0,
            completedCount: 0
          };
        }
        periodGroups[period].influencers.push(daren);
        periodGroups[period].totalFee += daren.fee || 0;
        if (daren.published) {
          periodGroups[period].completedCount++;
        }
      });

      const periodComparison = Object.values(periodGroups).map(group => ({
        name: group.name,
        influencerCount: group.influencers.length,
        totalFee: group.totalFee,
        completionRate: group.influencers.length > 0 
          ? Math.round((group.completedCount / group.influencers.length) * 100) 
          : 0,
        status: group.completedCount === group.influencers.length ? 'completed' : 'active'
      }));

      // Top performers
      const topPerformers = darens
        .filter(d => d.published && (d.likes || d.comments || d.collections))
        .map(d => {
          const totalEng = (d.likes || 0) + (d.comments || 0) + (d.collections || 0);
          const followers = parseFloat(d.followers?.replace(/[万k]/g, '')) || 1;
          const engagementRate = followers > 0 ? ((totalEng / followers) * 100).toFixed(2) : 0;
          const roi = d.fee > 0 ? ((totalEng / d.fee) * 100).toFixed(2) : 0;
          
          return {
            nickname: d.nickname,
            period: d.period,
            totalEngagement: totalEng,
            engagementRate: parseFloat(engagementRate),
            roi: parseFloat(roi),
            fee: d.fee || 0,
            published: d.published
          };
        })
        .sort((a, b) => b.totalEngagement - a.totalEngagement)
        .slice(0, 10);

      // Calculate growth rates (mock data for now)
      const overview = {
        totalInfluencers: total,
        influencerGrowth: 12.5,
        totalInvestment,
        investmentGrowth: 8.3,
        totalEngagement,
        engagementGrowth: 15.7,
        avgROI: topPerformers.length > 0 
          ? Math.round(topPerformers.reduce((sum, p) => sum + p.roi, 0) / topPerformers.length)
          : 0,
        roiGrowth: 5.2
      };

      reply.send({
        overview,
        progressData,
        periodComparison,
        topPerformers
      });
    } catch (err) {
      reply.code(500).send({ message: '获取分析数据失败', error: err.message });
    }
  });

  // Batch operations endpoint
  fastify.post('/api/darens/batch', async (request, reply) => {
    try {
      const { operation, ids, data } = request.body;
      
      switch (operation) {
        case 'delete':
          await Daren.deleteMany({ _id: { $in: ids } });
          reply.send({ message: `成功删除 ${ids.length} 条记录` });
          break;
          
        case 'update':
          await Daren.updateMany(
            { _id: { $in: ids } },
            { $set: data }
          );
          reply.send({ message: `成功更新 ${ids.length} 条记录` });
          break;
          
        case 'export':
          const darens = await Daren.find({ _id: { $in: ids } });
          reply.send({ data: darens });
          break;
          
        default:
          reply.code(400).send({ message: '不支持的批量操作' });
      }
    } catch (err) {
      reply.code(500).send({ message: '批量操作失败', error: err.message });
    }
  });

  // Parse note info from Xiaohongshu note page (based on analyze-xhs-page.js logic)
  fastify.post('/api/parse-xhs-note-simple', async (request, reply) => {
    const { url, cookie } = request.body;
    if (!url) {
      return reply.code(400).send({ message: 'URL is required' });
    }

    try {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
      };
      if (cookie) {
        headers['Cookie'] = cookie;
      }

      console.log('正在分析小红书笔记页面:', url);
      const { data } = await axios.get(url, { headers });
      const $ = cheerio.load(data);

      console.log('页面基本信息:');
      console.log('- 标题:', $('title').text());
      console.log('- 页面长度:', data.length);

      let parsedInfo = {
        type: 'note',
        title: '',
        likes: 0,
        collections: 0,
        comments: 0,
        shares: 0,
        parseMethod: 'unknown',
        success: false
      };

      // 1. 优先从Meta标签提取数据
      console.log('\n=== Meta标签分析 ===');
      const metaTags = $('meta').toArray();
      let metaLikes, metaCollections, metaComments;

      metaTags.forEach((meta) => {
        const $meta = $(meta);
        const name = $meta.attr('name') || $meta.attr('property');
        const content = $meta.attr('content');

        if (name && content) {
          if (name === 'og:xhs:note_like') {
            metaLikes = content;
            console.log(`找到Meta标签 - 点赞: ${content}`);
          }
          if (name === 'og:xhs:note_collect') {
            metaCollections = content;
            console.log(`找到Meta标签 - 收藏: ${content}`);
          }
          if (name === 'og:xhs:note_comment') {
            metaComments = content;
            console.log(`找到Meta标签 - 评论: ${content}`);
          }
          if (name === 'og:title') {
            parsedInfo.title = content;
          }
        }
      });

      // 如果Meta标签有数据，优先使用
      if (metaLikes || metaCollections || metaComments) {
        parsedInfo.likes = metaLikes ? parseInt(metaLikes) : 0;
        parsedInfo.collections = metaCollections ? parseInt(metaCollections) : 0;
        parsedInfo.comments = metaComments ? parseInt(metaComments) : 0;
        parsedInfo.parseMethod = 'meta-tags';
        parsedInfo.success = true;
        console.log('✅ 从Meta标签成功提取数据');
      } else {
        // 2. 从脚本中提取数据
        console.log('\n=== 脚本分析 ===');
        const scripts = $('script').toArray();
        console.log(`脚本标签数量: ${scripts.length}`);

        for (let i = 0; i < scripts.length; i++) {
          const script = $(scripts[i]);
          const content = script.html();

          if (content) {
            const hasInitialState = content.includes('__INITIAL_STATE__');
            const hasInteractInfo = content.includes('interactInfo');
            const hasLikedCount = content.includes('likedCount');
            const hasNoteData = content.includes('noteDetailMap');

            console.log(`脚本 ${i + 1}: 长度=${content.length}, __INITIAL_STATE__=${hasInitialState}, interactInfo=${hasInteractInfo}`);

            if (hasInitialState) {
              console.log('🎯 找到初始状态脚本！');
              // 提取初始状态数据
              const stateMatch = content.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/);
              if (stateMatch) {
                try {
                  const state = JSON.parse(stateMatch[1]);
                  console.log('初始状态键:', Object.keys(state));

                  // 提取笔记数据
                  if (state.note?.noteDetailMap) {
                    const noteData = state.note.noteDetailMap;
                    const noteIds = Object.keys(noteData);
                    if (noteIds.length > 0) {
                      const noteId = noteIds[0];
                      const note = noteData[noteId]?.note;
                      if (note) {
                        parsedInfo.title = note.title || note.desc || parsedInfo.title;
                        parsedInfo.likes = note.interactInfo?.likedCount || 0;
                        parsedInfo.collections = note.interactInfo?.collectedCount || 0;
                        parsedInfo.comments = note.interactInfo?.commentCount || 0;
                        parsedInfo.shares = note.interactInfo?.shareCount || 0;
                        parsedInfo.parseMethod = 'json-initial-state';
                        parsedInfo.success = true;
                        console.log('✅ 从初始状态JSON成功提取数据');
                        break;
                      }
                    }
                  }
                } catch (parseError) {
                  console.log('❌ 初始状态JSON解析失败:', parseError.message);
                }
              }
            }

            if (!parsedInfo.success && hasInteractInfo && hasLikedCount) {
              console.log('🎯 找到交互数据脚本！');
              // 尝试从脚本内容中提取数据
              const patterns = [
                { name: '点赞', regex: /"likedCount":(\d+)/g, key: 'likes' },
                { name: '收藏', regex: /"collectedCount":(\d+)/g, key: 'collections' },
                { name: '评论', regex: /"commentCount":(\d+)/g, key: 'comments' },
                { name: '分享', regex: /"shareCount":(\d+)/g, key: 'shares' }
              ];

              let foundData = false;
              patterns.forEach(pattern => {
                const matches = [...content.matchAll(pattern.regex)];
                if (matches.length > 0) {
                  const value = parseInt(matches[0][1]);
                  parsedInfo[pattern.key] = value;
                  console.log(`${pattern.name}数据匹配: ${value}`);
                  foundData = true;
                }
              });

              if (foundData) {
                parsedInfo.parseMethod = 'script-regex';
                parsedInfo.success = true;
                console.log('✅ 从脚本正则匹配成功提取数据');
                break;
              }
            }
          }
        }
      }

      // 3. 如果都没有找到数据，至少返回基本信息
      if (!parsedInfo.success) {
        parsedInfo.title = $('title').text().replace(' - 小红书', '').trim() || '';
        parsedInfo.parseMethod = 'basic-fallback';
        parsedInfo.success = parsedInfo.title ? true : false;
        console.log('⚠️ 仅提取到基本信息');
      }

      // 添加解析元数据
      parsedInfo.noteUrl = url;
      parsedInfo.parsedAt = new Date().toISOString();

      console.log(`\n✅ 解析完成 - 方法: ${parsedInfo.parseMethod}`);
      console.log(`结果: 点赞=${parsedInfo.likes}, 收藏=${parsedInfo.collections}, 评论=${parsedInfo.comments}`);

      reply.send(parsedInfo);

    } catch (err) {
      console.error('解析笔记页面时出错:', err);
      reply.code(500).send({
        message: '解析笔记页面时出错',
        error: err.message,
        success: false,
        parsedAt: new Date().toISOString()
      });
    }
  });
}

module.exports = routes;