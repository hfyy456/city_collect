const mongoose = require('mongoose');
const Period = require('../models/period');
const InfluencerPeriod = require('../models/influencerPeriod');
const Influencer = require('../models/influencer');

// 确保模型已注册
console.log('Models loaded:', {
  Period: !!Period,
  InfluencerPeriod: !!InfluencerPeriod,
  Influencer: !!Influencer
});

async function routes(fastify, options) {
  
  // 获取所有期数
  fastify.get('/api/periods-new', async (request, reply) => {
    try {
      const { status, page = 1, limit = 20 } = request.query;
      
      const query = {};
      if (status) {
        query.status = status;
      }
      
      const periods = await Period.find(query)
        .sort({ startDate: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      const total = await Period.countDocuments(query);
      
      reply.send({
        periods,
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

  // 获取单个期数详情
  fastify.get('/api/periods-new/:id', async (request, reply) => {
    try {
      const period = await Period.findById(request.params.id);
      if (!period) {
        return reply.status(404).send({ error: '期数不存在' });
      }
      
      // 获取期数统计
      const stats = await InfluencerPeriod.getPeriodStats(period.name);
      
      reply.send({
        period,
        stats: stats[0] || {}
      });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 创建新期数
  fastify.post('/api/periods-new', async (request, reply) => {
    try {
      const period = new Period(request.body);
      await period.save();
      reply.status(201).send(period);
    } catch (error) {
      if (error.code === 11000) {
        reply.status(400).send({ error: '期数名称已存在' });
      } else {
        reply.status(500).send({ error: error.message });
      }
    }
  });

  // 更新期数
  fastify.put('/api/periods-new/:id', async (request, reply) => {
    try {
      const period = await Period.findByIdAndUpdate(
        request.params.id,
        request.body,
        { new: true, runValidators: true }
      );
      
      if (!period) {
        return reply.status(404).send({ error: '期数不存在' });
      }
      
      reply.send(period);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 删除期数
  fastify.delete('/api/periods-new/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      // 支持按ID或按名称删除
      let period;
      if (mongoose.Types.ObjectId.isValid(id)) {
        period = await Period.findById(id);
      } else {
        period = await Period.findOne({ name: id });
      }
      
      if (!period) {
        return reply.status(404).send({ error: '期数不存在' });
      }
      
      // 检查是否有关联的达人数据
      const relationCount = await InfluencerPeriod.countDocuments({ period: period.name });
      if (relationCount > 0) {
        return reply.status(400).send({ 
          error: `无法删除期数，还有 ${relationCount} 个关联的达人记录` 
        });
      }
      
      await Period.findByIdAndDelete(period._id);
      reply.send({ message: '期数删除成功' });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 获取期数的达人列表
  fastify.get('/api/periods-new/:periodName/influencers', async (request, reply) => {
    try {
      const { periodName } = request.params;
      const { page = 1, limit = 20, status } = request.query;
      
      const options = { populate: true };
      if (status) {
        options.status = status;
      }
      
      let query = InfluencerPeriod.find({ period: periodName });
      
      if (status) {
        query = query.where('status', status);
      }
      
      const relations = await query
        .populate('influencer')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      const total = await InfluencerPeriod.countDocuments({ 
        period: periodName,
        ...(status && { status })
      });
      
      reply.send({
        influencers: relations,
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

  // 为期数添加达人
  fastify.post('/api/periods-new/:periodName/influencers', async (request, reply) => {
    try {
      const { periodName } = request.params;
      const { influencerId, ...relationData } = request.body;
      
      // 验证期数存在
      const period = await Period.findOne({ name: periodName });
      if (!period) {
        return reply.status(404).send({ error: '期数不存在' });
      }
      
      // 验证达人存在
      const influencer = await Influencer.findById(influencerId);
      if (!influencer) {
        return reply.status(404).send({ error: '达人不存在' });
      }
      
      // 创建关联记录
      const relation = new InfluencerPeriod({
        influencer: influencerId,
        period: periodName,
        ...relationData
      });
      
      await relation.save();
      await relation.populate('influencer');
      
      reply.status(201).send(relation);
    } catch (error) {
      if (error.code === 11000) {
        reply.status(400).send({ error: '该达人已在此期数中' });
      } else {
        reply.status(500).send({ error: error.message });
      }
    }
  });

  // 更新期数中的达人数据
  fastify.put('/api/periods-new/:periodName/influencers/:influencerId', async (request, reply) => {
    try {
      const { periodName, influencerId } = request.params;
      
      const relation = await InfluencerPeriod.findOneAndUpdate(
        { period: periodName, influencer: influencerId },
        request.body,
        { new: true, runValidators: true }
      ).populate('influencer');
      
      if (!relation) {
        return reply.status(404).send({ error: '关联记录不存在' });
      }
      
      reply.send(relation);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 从期数中移除达人
  fastify.delete('/api/periods-new/:periodName/influencers/:influencerId', async (request, reply) => {
    try {
      const { periodName, influencerId } = request.params;
      
      const relation = await InfluencerPeriod.findOneAndDelete({
        period: periodName,
        influencer: influencerId
      });
      
      if (!relation) {
        return reply.status(404).send({ error: '关联记录不存在' });
      }
      
      reply.send({ message: '达人已从期数中移除' });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 批量清除期数下的所有达人关联记录
  fastify.delete('/api/periods-new/:periodName/influencers', async (request, reply) => {
    try {
      const { periodName } = request.params;
      
      // 验证期数存在
      const period = await Period.findOne({ name: periodName });
      if (!period) {
        return reply.status(404).send({ error: '期数不存在' });
      }
      
      // 删除该期数下的所有关联记录
      const result = await InfluencerPeriod.deleteMany({ period: periodName });
      
      reply.send({ 
        message: `成功清除期数 "${periodName}" 下的所有达人关联记录`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 获取期数统计数据
  fastify.get('/api/periods-new/:periodName/stats', async (request, reply) => {
    try {
      const { periodName } = request.params;
      
      // 验证期数存在
      const period = await Period.findOne({ name: periodName });
      if (!period) {
        return reply.status(404).send({ error: '期数不存在' });
      }
      
      const stats = await InfluencerPeriod.getPeriodStats(periodName);
      
      reply.send({
        period: periodName,
        stats: stats[0] || {
          totalInfluencers: 0,
          totalInvestment: 0,
          totalEngagement: 0,
          roi: 0
        }
      });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 更新期数统计缓存
  fastify.post('/api/periods-new/:id/update-stats', async (request, reply) => {
    try {
      const period = await Period.findById(request.params.id);
      if (!period) {
        return reply.status(404).send({ error: '期数不存在' });
      }
      
      await period.updateStats();
      reply.send({ message: '统计数据更新成功', stats: period.stats });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // 批量操作
  fastify.post('/api/periods-new/batch', async (request, reply) => {
    try {
      const { operation, periodIds, data } = request.body;
      
      switch (operation) {
        case 'updateStatus':
          await Period.updateMany(
            { _id: { $in: periodIds } },
            { status: data.status }
          );
          break;
          
        case 'delete':
          // 检查是否有关联数据
          for (const periodId of periodIds) {
            const period = await Period.findById(periodId);
            if (period) {
              const relationCount = await InfluencerPeriod.countDocuments({ 
                period: period.name 
              });
              if (relationCount > 0) {
                return reply.status(400).send({ 
                  error: `期数 "${period.name}" 还有关联数据，无法删除` 
                });
              }
            }
          }
          await Period.deleteMany({ _id: { $in: periodIds } });
          break;
          
        default:
          return reply.status(400).send({ error: '不支持的操作' });
      }
      
      reply.send({ message: '批量操作完成' });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });
}

module.exports = routes;