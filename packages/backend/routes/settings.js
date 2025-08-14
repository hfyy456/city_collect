const Settings = require('../models/settings');

async function routes(fastify, options) {
  
  // 获取所有设置
  fastify.get('/api/settings', async (request, reply) => {
    try {
      const { 
        category, 
        group, 
        userId,
        page = 1, 
        limit = 50 
      } = request.query;
      
      let settings;
      
      if (category) {
        settings = await Settings.getSettingsByCategory(category, userId);
      } else if (group) {
        settings = await Settings.getSettingsByGroup(group, userId);
      } else {
        settings = await Settings.getAllSettings(userId);
      }
      
      // 分页处理
      const total = settings.length;
      const startIndex = (page - 1) * limit;
      const paginatedSettings = settings.slice(startIndex, startIndex + limit);
      
      reply.send({
        settings: paginatedSettings,
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

  // 获取单个设置
  fastify.get('/api/settings/:category/:key', async (request, reply) => {
    try {
      const { category, key } = request.params;
      const { userId } = request.query;
      
      const setting = await Settings.findOne({ 
        category, 
        key, 
        userId: userId || null,
        enabled: true 
      });
      
      if (!setting) {
        return reply.status(404).send({ error: '设置不存在' });
      }
      
      reply.send(setting);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 获取设置值
  fastify.get('/api/settings/:category/:key/value', async (request, reply) => {
    try {
      const { category, key } = request.params;
      const { userId } = request.query;
      
      const value = await Settings.getSetting(category, key, userId);
      
      if (value === null) {
        return reply.status(404).send({ error: '设置不存在' });
      }
      
      reply.send({ value });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 创建或更新设置
  fastify.post('/api/settings/:category/:key', async (request, reply) => {
    try {
      const { category, key } = request.params;
      const { 
        value, 
        description, 
        userId, 
        modifiedBy = 'api',
        reason = 'Updated via API'
      } = request.body;
      
      const setting = await Settings.setSetting(category, key, value, {
        userId,
        description,
        modifiedBy,
        reason
      });
      
      reply.send(setting);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 更新设置值
  fastify.put('/api/settings/:category/:key', async (request, reply) => {
    try {
      const { category, key } = request.params;
      const { 
        value, 
        userId, 
        modifiedBy = 'api',
        reason = 'Updated via API'
      } = request.body;
      
      const query = { category, key };
      if (userId) {
        query.userId = userId;
      }
      
      const setting = await Settings.findOne(query);
      
      if (!setting) {
        return reply.status(404).send({ error: '设置不存在' });
      }
      
      await setting.updateValue(value, modifiedBy, reason);
      reply.send(setting);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 删除设置
  fastify.delete('/api/settings/:category/:key', async (request, reply) => {
    try {
      const { category, key } = request.params;
      const { userId } = request.query;
      
      const query = { category, key };
      if (userId) {
        query.userId = userId;
      }
      
      const setting = await Settings.findOneAndDelete(query);
      
      if (!setting) {
        return reply.status(404).send({ error: '设置不存在' });
      }
      
      reply.send({ message: '设置删除成功' });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 重置设置为默认值
  fastify.post('/api/settings/:category/:key/reset', async (request, reply) => {
    try {
      const { category, key } = request.params;
      const { userId, modifiedBy = 'api' } = request.body;
      
      const query = { category, key };
      if (userId) {
        query.userId = userId;
      }
      
      const setting = await Settings.findOne(query);
      
      if (!setting) {
        return reply.status(404).send({ error: '设置不存在' });
      }
      
      await setting.resetToDefault(modifiedBy);
      reply.send(setting);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 获取设置分类列表
  fastify.get('/api/settings/categories', async (request, reply) => {
    try {
      const categories = await Settings.distinct('category');
      reply.send(categories);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 获取设置组列表
  fastify.get('/api/settings/groups', async (request, reply) => {
    try {
      const { category } = request.query;
      const query = {};
      
      if (category) {
        query.category = category;
      }
      
      const groups = await Settings.distinct('group', query);
      reply.send(groups.filter(Boolean)); // 过滤掉null值
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 批量更新设置
  fastify.post('/api/settings/batch', async (request, reply) => {
    try {
      const { 
        settings, 
        userId, 
        modifiedBy = 'api',
        reason = 'Batch update'
      } = request.body;
      
      if (!Array.isArray(settings)) {
        return reply.status(400).send({ error: 'settings必须是数组' });
      }
      
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };
      
      for (const settingData of settings) {
        try {
          const { category, key, value } = settingData;
          await Settings.setSetting(category, key, value, {
            userId,
            modifiedBy,
            reason
          });
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            setting: `${settingData.category}.${settingData.key}`,
            error: error.message
          });
        }
      }
      
      reply.send({
        message: '批量更新完成',
        results
      });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 导出设置
  fastify.get('/api/settings/export', async (request, reply) => {
    try {
      const { category, userId } = request.query;
      
      const query = { enabled: true };
      if (category) {
        query.category = category;
      }
      if (userId) {
        query.userId = userId;
      }
      
      const settings = await Settings.find(query)
        .select('-__v -history -createdAt -updatedAt')
        .sort({ category: 1, group: 1, order: 1, key: 1 });
      
      reply
        .header('Content-Type', 'application/json')
        .header('Content-Disposition', `attachment; filename="settings-${Date.now()}.json"`)
        .send(settings);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 导入设置
  fastify.post('/api/settings/import', async (request, reply) => {
    try {
      const { 
        settings, 
        userId, 
        modifiedBy = 'import',
        overwrite = false 
      } = request.body;
      
      if (!Array.isArray(settings)) {
        return reply.status(400).send({ error: 'settings必须是数组' });
      }
      
      const results = {
        success: 0,
        failed: 0,
        skipped: 0,
        errors: []
      };
      
      for (const settingData of settings) {
        try {
          const { category, key, value } = settingData;
          
          const existingQuery = { category, key };
          if (userId) {
            existingQuery.userId = userId;
          }
          
          const existing = await Settings.findOne(existingQuery);
          
          if (existing && !overwrite) {
            results.skipped++;
            continue;
          }
          
          await Settings.setSetting(category, key, value, {
            userId,
            description: settingData.description,
            modifiedBy,
            reason: 'Imported from file'
          });
          
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            setting: `${settingData.category}.${settingData.key}`,
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

  // 初始化默认设置
  fastify.post('/api/settings/initialize', {
    schema: {
      body: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  }, async (request, reply) => {
    try {
      await Settings.initializeDefaults();
      reply.send({ message: '默认设置初始化完成' });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 获取设置历史
  fastify.get('/api/settings/:category/:key/history', async (request, reply) => {
    try {
      const { category, key } = request.params;
      const { userId } = request.query;
      
      const query = { category, key };
      if (userId) {
        query.userId = userId;
      }
      
      const setting = await Settings.findOne(query);
      
      if (!setting) {
        return reply.status(404).send({ error: '设置不存在' });
      }
      
      reply.send({
        setting: {
          category: setting.category,
          key: setting.key,
          currentValue: setting.value
        },
        history: setting.history.sort((a, b) => b.modifiedAt - a.modifiedAt)
      });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });
}

module.exports = routes;