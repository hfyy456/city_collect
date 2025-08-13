const Daren = require('../models/daren');
const axios = require('axios');
const cheerio = require('cheerio');

// 数字标准化函数
function normalizeNumber(value) {
  if (!value) return 0;
  
  // 如果已经是数字，直接返回
  if (typeof value === 'number') {
    return value;
  }
  
  // 转换为字符串处理
  const str = value.toString().trim();
  
  // 处理带单位的数字
  if (str.includes('万')) {
    const num = parseFloat(str.replace('万', ''));
    return isNaN(num) ? 0 : Math.round(num * 10000);
  }
  
  if (str.includes('k') || str.includes('K')) {
    const num = parseFloat(str.replace(/[kK]/, ''));
    return isNaN(num) ? 0 : Math.round(num * 1000);
  }
  
  // 处理纯数字字符串
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num);
}

// 标准化达人数据中的数字字段
function normalizeDarenData(data) {
  const normalized = { ...data };
  
  // 标准化主要字段
  if (normalized.followers !== undefined) {
    normalized.followers = normalizeNumber(normalized.followers);
  }
  if (normalized.likesAndCollections !== undefined) {
    normalized.likesAndCollections = normalizeNumber(normalized.likesAndCollections);
  }
  if (normalized.likes !== undefined) {
    normalized.likes = normalizeNumber(normalized.likes);
  }
  if (normalized.collections !== undefined) {
    normalized.collections = normalizeNumber(normalized.collections);
  }
  if (normalized.comments !== undefined) {
    normalized.comments = normalizeNumber(normalized.comments);
  }
  if (normalized.fee !== undefined) {
    normalized.fee = normalizeNumber(normalized.fee);
  }
  if (normalized.forwards !== undefined) {
    normalized.forwards = normalizeNumber(normalized.forwards);
  }
  
  // 标准化期数数据
  if (normalized.periodData && Array.isArray(normalized.periodData)) {
    normalized.periodData = normalized.periodData.map(period => ({
      ...period,
      likes: normalizeNumber(period.likes),
      collections: normalizeNumber(period.collections),
      comments: normalizeNumber(period.comments),
      fee: normalizeNumber(period.fee),
      forwards: normalizeNumber(period.forwards)
    }));
  }
  
  return normalized;
}

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
        feeMin,
        feeMax,
        likesMin,
        likesMax,
        startDate,
        endDate,
        ipLocations,
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

  // Get distinct periods (支持新的期数维度结构)
  fastify.get('/api/periods', async (request, reply) => {
    try {
      // 获取新结构的期数
      const newPeriods = await Daren.getAllPeriods();
      const newPeriodsArray = newPeriods.map(p => p.period);
      
      // 获取旧结构的期数（向后兼容）
      const oldPeriods = await Daren.find().distinct('period');
      const filteredOldPeriods = oldPeriods.filter(p => p);
      
      // 合并并去重
      const allPeriods = [...new Set([...newPeriodsArray, ...filteredOldPeriods])];
      
      reply.send(allPeriods.sort());
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

  // 期数维度API - 获取指定期数的所有达人数据
  fastify.get('/api/periods/:period/darens', async (request, reply) => {
    try {
      const { period } = request.params;
      const { page = 1, limit = 20 } = request.query;
      
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;
      
      // 查找包含指定期数数据的达人
      const query = { 'periodData.period': period };
      
      const [darens, total] = await Promise.all([
        Daren.find(query).skip(skip).limit(limitNum),
        Daren.countDocuments(query)
      ]);
      
      // 为每个达人提取对应期数的数据
      const periodDarens = darens.map(daren => {
        const periodData = daren.getPeriodData(period);
        return {
          ...daren.toObject(),
          currentPeriodData: periodData
        };
      });
      
      reply.send({ items: periodDarens, total, period });
    } catch (err) {
      reply.code(500).send(err);
    }
  });

  // 期数维度API - 为达人添加期数数据
  fastify.post('/api/darens/:id/periods', async (request, reply) => {
    try {
      const { id } = request.params;
      const periodData = request.body;
      
      const daren = await Daren.findById(id);
      if (!daren) {
        return reply.code(404).send({ message: '达人不存在' });
      }
      
      // 标准化期数数据中的数字字段
      const normalizedPeriodData = normalizeDarenData({ periodData: [periodData] }).periodData[0];
      await daren.addPeriodData(normalizedPeriodData);
      reply.send({ message: '期数数据添加成功', daren });
    } catch (err) {
      reply.code(500).send(err);
    }
  });

  // 期数维度API - 更新达人的指定期数数据
  fastify.put('/api/darens/:id/periods/:period', async (request, reply) => {
    try {
      const { id, period } = request.params;
      const updateData = request.body;
      
      const daren = await Daren.findById(id);
      if (!daren) {
        return reply.code(404).send({ message: '达人不存在' });
      }
      
      const periodData = daren.getPeriodData(period);
      if (!periodData) {
        return reply.code(404).send({ message: '指定期数数据不存在' });
      }
      
      // 标准化更新数据中的数字字段
      const normalizedUpdateData = normalizeDarenData({ periodData: [{ ...updateData, period }] }).periodData[0];
      await daren.addPeriodData(normalizedUpdateData);
      reply.send({ message: '期数数据更新成功', daren });
    } catch (err) {
      reply.code(500).send(err);
    }
  });

  // 期数维度API - 删除达人的指定期数数据
  fastify.delete('/api/darens/:id/periods/:period', async (request, reply) => {
    try {
      const { id, period } = request.params;
      
      const daren = await Daren.findById(id);
      if (!daren) {
        return reply.code(404).send({ message: '达人不存在' });
      }
      
      await daren.removePeriodData(period);
      reply.send({ message: '期数数据删除成功' });
    } catch (err) {
      reply.code(500).send(err);
    }
  });

  // 期数维度API - 获取期数统计数据
  fastify.get('/api/periods/:period/stats', async (request, reply) => {
    try {
      const { period } = request.params;
      
      const darens = await Daren.findByPeriod(period);
      
      let totalFee = 0;
      let totalEngagement = 0;
      
      darens.forEach(daren => {
        const periodData = daren.getPeriodData(period);
        if (periodData) {
          totalFee += periodData.fee || 0;
          totalEngagement += (periodData.likes || 0) + (periodData.comments || 0) + (periodData.collections || 0);
        }
      });
      
      reply.send({
        period,
        totalDarens: darens.length,
        totalFee,
        totalEngagement,
        avgEngagement: darens.length > 0 ? Math.round(totalEngagement / darens.length) : 0
      });
    } catch (err) {
      reply.code(500).send(err);
    }
  });

  // 作品维度API - 获取作品数据
  fastify.get('/api/works', async (request, reply) => {
    try {
      const { periods, darenIds, page = 1, limit = 20 } = request.query;
      
      const query = {};
      
      // 如果指定了期数
      if (periods && periods.length > 0) {
        const periodArray = Array.isArray(periods) ? periods : [periods];
        query['periodData.period'] = { $in: periodArray };
      }
      
      // 如果指定了达人ID
      if (darenIds && darenIds.length > 0) {
        const idArray = Array.isArray(darenIds) ? darenIds : [darenIds];
        query._id = { $in: idArray };
      }
      
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;
      
      const [darens, total] = await Promise.all([
        Daren.find(query).skip(skip).limit(limitNum),
        Daren.countDocuments(query)
      ]);
      
      // 展开作品数据
      const works = [];
      darens.forEach(daren => {
        daren.periodData.forEach(periodData => {
          if (!periods || periods.includes(periodData.period)) {
            works.push({
              darenId: daren._id,
              nickname: daren.nickname,
              period: periodData.period,
              mainPublishLink: periodData.mainPublishLink,
              syncPublishLink: periodData.syncPublishLink,
              likes: periodData.likes,
              comments: periodData.comments,
              collections: periodData.collections,
              fee: periodData.fee,
              updatedAt: periodData.updatedAt
            });
          }
        });
      });
      
      reply.send({ items: works, total: works.length });
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
      // 标准化数据中的数字字段
      const normalizedData = normalizeDarenData(request.body);
      const daren = new Daren(normalizedData);
      const newDaren = await daren.save();
      reply.code(201).send(newDaren);
    } catch (err) {
      reply.code(500).send(err);
    }
  });

  // Update a daren
  fastify.put('/api/darens/:id', async (request, reply) => {
    try {
      // 标准化数据中的数字字段
      const normalizedData = normalizeDarenData(request.body);
      const daren = await Daren.findByIdAndUpdate(request.params.id, normalizedData, { new: true });
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
        // 成功解析，返回统一格式
        reply.send({
          success: true,
          ...parsedInfo,
          parseMethod: 'json-initial-state',
          parsedAt: new Date().toISOString()
        });
      } else {
        // 解析失败，返回统一格式
        reply.send({
          success: false,
          message: '无法解析用户信息。页面结构可能已更改，或Cookie无效/过期。',
          cookieRequired: true,
          suggestions: [
            '检查链接是否正确',
            '尝试提供有效的Cookie',
            '参考 COOKIES_SETUP_GUIDE.md 设置Cookie'
          ],
          parsedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('解析用户页面时出错:', err);
      
      const errorResponse = {
        success: false,
        message: '解析用户页面时出错',
        error: err.message,
        parsedAt: new Date().toISOString(),
        url: url
      };
      
      // 根据错误类型提供具体建议
      if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        errorResponse.suggestions = [
          '检查网络连接',
          '确认 URL 格式正确',
          '尝试稍后重试'
        ];
      } else if (err.response?.status === 403 || err.response?.status === 401) {
        errorResponse.cookieRequired = true;
        errorResponse.suggestions = [
          '可能需要有效的 Cookie',
          '检查账号权限',
          '参考 COOKIES_SETUP_GUIDE.md 设置 Cookie'
        ];
      } else if (err.response?.status === 429) {
        errorResponse.suggestions = [
          '请求过于频繁，请稍后重试',
          '考虑使用多个账号轮换',
          '增加请求间隔时间'
        ];
      } else {
        errorResponse.suggestions = [
          '检查 URL 是否有效',
          '确保提供了正确的 Cookie',
          '查看服务器日志获取详细错误信息'
        ];
      }
      
      reply.code(500).send(errorResponse);
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
      const progressData = [];

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
      });

      const periodComparison = Object.values(periodGroups).map(group => ({
        name: group.name,
        influencerCount: group.influencers.length,
        totalFee: group.totalFee
      }));

      // Top performers
      const topPerformers = darens
        .filter(d => (d.likes || d.comments || d.collections))
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
            fee: d.fee || 0
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
          // 标准化批量更新数据中的数字字段
          const normalizedBatchData = normalizeDarenData(data);
          await Daren.updateMany(
            { _id: { $in: ids } },
            { $set: normalizedBatchData }
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

  // Parse note info from Xiaohongshu note page (Enhanced version with better cookie support)
  fastify.post('/api/parse-xhs-note-simple', async (request, reply) => {
    const { url, cookie } = request.body;
    if (!url) {
      return reply.code(400).send({ 
        message: 'URL is required',
        success: false,
        parsedAt: new Date().toISOString()
      });
    }

    try {
      // Enhanced headers with better browser simulation
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://www.xiaohongshu.com/'
      };
      
      if (cookie) {
        headers['Cookie'] = cookie;
        console.log('✅ 使用提供的 Cookie 进行请求');
      } else {
        console.log('⚠️ 未提供 Cookie，可能无法获取完整数据');
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

      // 添加解析元数据和调试信息
      parsedInfo.noteUrl = url;
      parsedInfo.parsedAt = new Date().toISOString();
      parsedInfo.hasCookie = !!cookie;
      parsedInfo.rawDataLength = data.length;
      
      // 添加使用建议
      if (!parsedInfo.success || parsedInfo.parseMethod === 'basic-fallback') {
        parsedInfo.suggestions = [
          '建议提供有效的 Cookie 以获取完整数据',
          '请参考 COOKIES_SETUP_GUIDE.md 了解如何设置 Cookie',
          '确保 URL 格式正确且可访问'
        ];
        
        if (!cookie) {
          parsedInfo.cookieRequired = true;
          parsedInfo.message = '未提供 Cookie，只能获取基本信息。要获取完整的点赞、收藏、评论数据，请设置有效的 Cookie。';
        }
      }

      console.log(`\n✅ 解析完成 - 方法: ${parsedInfo.parseMethod}`);
      console.log(`结果: 点赞=${parsedInfo.likes}, 收藏=${parsedInfo.collections}, 评论=${parsedInfo.comments}`);
      console.log(`Cookie状态: ${cookie ? '已提供' : '未提供'}`);
      console.log(`数据完整性: ${parsedInfo.success ? '完整' : '不完整'}`);

      reply.send(parsedInfo);

    } catch (err) {
      console.error('解析笔记页面时出错:', err);
      
      const errorResponse = {
        message: '解析笔记页面时出错',
        error: err.message,
        success: false,
        parsedAt: new Date().toISOString(),
        noteUrl: url,
        hasCookie: !!cookie
      };
      
      // 根据错误类型提供具体建议
      if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        errorResponse.suggestions = [
          '检查网络连接',
          '确认 URL 格式正确',
          '尝试稍后重试'
        ];
      } else if (err.response?.status === 403 || err.response?.status === 401) {
        errorResponse.suggestions = [
          '可能需要有效的 Cookie',
          '检查账号权限',
          '参考 COOKIES_SETUP_GUIDE.md 设置 Cookie'
        ];
      } else if (err.response?.status === 429) {
        errorResponse.suggestions = [
          '请求过于频繁，请稍后重试',
          '考虑使用多个账号轮换',
          '增加请求间隔时间'
        ];
      } else {
        errorResponse.suggestions = [
          '检查 URL 是否有效',
          '确保提供了正确的 Cookie',
          '查看服务器日志获取详细错误信息'
        ];
      }
      
      reply.code(500).send(errorResponse);
    }
  });
}

module.exports = routes;