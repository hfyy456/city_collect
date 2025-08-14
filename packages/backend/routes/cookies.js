const Cookie = require('../models/cookie');

async function routes(fastify, options) {
  
  // 获取所有Cookie
  fastify.get('/api/cookies', async (request, reply) => {
    try {
      const { 
        platform, 
        status, 
        page = 1, 
        limit = 20,
        search 
      } = request.query;
      
      const query = {};
      
      if (platform) {
        query.platform = platform;
      }
      
      if (status) {
        query.status = status;
      }
      
      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
          { domain: new RegExp(search, 'i') }
        ];
      }
      
      const cookies = await Cookie.find(query)
        .sort({ updatedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      const total = await Cookie.countDocuments(query);
      
      reply.send({
        cookies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 获取单个Cookie
  fastify.get('/api/cookies/:id', async (request, reply) => {
    try {
      const cookie = await Cookie.findById(request.params.id);
      if (!cookie) {
        return reply.status(404).send({ error: 'Cookie不存在' });
      }
      reply.send(cookie);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 创建新Cookie
  fastify.post('/api/cookies', async (request, reply) => {
    try {
      const cookie = new Cookie(request.body);
      await cookie.save();
      reply.status(201).send(cookie);
    } catch (error) {
      if (error.code === 11000) {
        reply.status(400).send({ error: 'Cookie名称在该平台下已存在' });
      } else {
        reply.status(500).send({ error: error.message });
      }
    }
  });

  // 更新Cookie
  fastify.put('/api/cookies/:id', async (request, reply) => {
    try {
      const cookie = await Cookie.findByIdAndUpdate(
        request.params.id,
        request.body,
        { new: true, runValidators: true }
      );
      
      if (!cookie) {
        return reply.status(404).send({ error: 'Cookie不存在' });
      }
      
      reply.send(cookie);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 删除Cookie
  fastify.delete('/api/cookies/:id', async (request, reply) => {
    try {
      const cookie = await Cookie.findByIdAndDelete(request.params.id);
      if (!cookie) {
        return reply.status(404).send({ error: 'Cookie不存在' });
      }
      reply.send({ message: 'Cookie删除成功' });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 获取平台Cookie列表
  fastify.get('/api/cookies/platform/:platform', async (request, reply) => {
    try {
      const { platform } = request.params;
      const cookies = await Cookie.findByPlatform(platform);
      reply.send(cookies);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 获取有效Cookie
  fastify.get('/api/cookies/valid/:platform?', async (request, reply) => {
    try {
      const { platform } = request.params;
      const cookies = await Cookie.findValidCookies(platform);
      reply.send(cookies);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 获取随机Cookie
  fastify.get('/api/cookies/random/:platform?', async (request, reply) => {
    try {
      const platform = request.params.platform || 'xiaohongshu';
      const cookies = await Cookie.getRandomCookie(platform);
      
      if (cookies.length === 0) {
        return reply.status(404).send({ error: '没有可用的Cookie' });
      }
      
      reply.send(cookies[0]);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 记录Cookie使用情况
  fastify.post('/api/cookies/:id/usage', async (request, reply) => {
    try {
      const { success = true } = request.body;
      const cookie = await Cookie.findById(request.params.id);
      
      if (!cookie) {
        return reply.status(404).send({ error: 'Cookie不存在' });
      }
      
      await cookie.recordUsage(success);
      reply.send({ message: '使用记录已更新', cookie });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 验证Cookie
  fastify.post('/api/cookies/:id/validate', async (request, reply) => {
    try {
      const { method = 'manual', result = '' } = request.body;
      const cookie = await Cookie.findById(request.params.id);
      
      if (!cookie) {
        return reply.status(404).send({ error: 'Cookie不存在' });
      }
      
      await cookie.validate(method, result);
      reply.send({ message: 'Cookie验证完成', cookie });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 启用/禁用Cookie
  fastify.post('/api/cookies/:id/toggle', async (request, reply) => {
    try {
      const cookie = await Cookie.findById(request.params.id);
      
      if (!cookie) {
        return reply.status(404).send({ error: 'Cookie不存在' });
      }
      
      if (cookie.status === 'disabled') {
        await cookie.enable();
      } else {
        await cookie.disable();
      }
      
      reply.send({ message: 'Cookie状态已更新', cookie });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 获取Cookie统计
  fastify.get('/api/cookies/stats', async (request, reply) => {
    try {
      const stats = await Cookie.getCookieStats();
      
      // 计算总体统计
      const totalStats = {
        total: 0,
        active: 0,
        expired: 0,
        invalid: 0,
        avgSuccessRate: 0
      };
      
      stats.forEach(stat => {
        totalStats.total += stat.total;
        totalStats.active += stat.active;
        totalStats.expired += stat.expired;
        totalStats.invalid += stat.invalid;
      });
      
      if (stats.length > 0) {
        totalStats.avgSuccessRate = stats.reduce((sum, stat) => sum + stat.avgSuccessRate, 0) / stats.length;
      }
      
      reply.send({
        byPlatform: stats,
        total: totalStats
      });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 批量操作
  fastify.post('/api/cookies/batch', async (request, reply) => {
    try {
      const { operation, cookieIds, data } = request.body;
      
      switch (operation) {
        case 'delete':
          await Cookie.deleteMany({ _id: { $in: cookieIds } });
          break;
          
        case 'updateStatus':
          await Cookie.updateMany(
            { _id: { $in: cookieIds } },
            { status: data.status }
          );
          break;
          
        case 'updatePlatform':
          await Cookie.updateMany(
            { _id: { $in: cookieIds } },
            { platform: data.platform }
          );
          break;
          
        case 'addTags':
          await Cookie.updateMany(
            { _id: { $in: cookieIds } },
            { $addToSet: { tags: { $each: data.tags } } }
          );
          break;
          
        default:
          return reply.status(400).send({ error: '不支持的操作' });
      }
      
      reply.send({ message: '批量操作完成' });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 导入Cookie
  fastify.post('/api/cookies/import', async (request, reply) => {
    try {
      const { cookies, platform = 'xiaohongshu' } = request.body;
      
      if (!Array.isArray(cookies)) {
        return reply.status(400).send({ error: 'cookies必须是数组' });
      }
      
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };
      
      for (const cookieData of cookies) {
        try {
          const cookie = new Cookie({
            ...cookieData,
            platform,
            createdBy: 'import'
          });
          await cookie.save();
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            cookie: cookieData.name || 'unknown',
            error: error.message
          });
        }
      }
      
      reply.send({
        message: '导入完成',
        results
      });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 导出Cookie
  fastify.get('/api/cookies/export', async (request, reply) => {
    try {
      const { platform, status = 'active' } = request.query;
      
      const query = { status };
      if (platform) {
        query.platform = platform;
      }
      
      const cookies = await Cookie.find(query).select('-__v -createdAt -updatedAt');
      
      reply
        .header('Content-Type', 'application/json')
        .header('Content-Disposition', `attachment; filename="cookies-${Date.now()}.json"`)
        .send(cookies);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });
}

module.exports = routes;