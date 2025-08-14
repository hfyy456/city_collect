const mongoose = require('mongoose');

// 导入模型
const OldDaren = require('../models/daren'); // 原有模型
const Influencer = require('../models/influencer'); // 新的达人模型
const Period = require('../models/period'); // 期数模型
const InfluencerPeriod = require('../models/influencerPeriod'); // 关联模型

/**
 * 数据迁移脚本：从嵌套结构迁移到独立模型
 */
class ModelMigration {
  constructor() {
    this.stats = {
      processedDarens: 0,
      createdInfluencers: 0,
      createdPeriods: 0,
      createdRelations: 0,
      errors: []
    };
  }

  async connect() {
    try {
      await mongoose.connect('mongodb://47.121.31.68:32233/city_collect');
      console.log('✅ 数据库连接成功');
    } catch (error) {
      console.error('❌ 数据库连接失败:', error);
      throw error;
    }
  }

  async migrate() {
    console.log('🚀 开始数据迁移...\n');
    
    try {
      // 1. 创建期数记录
      await this.createPeriods();
      
      // 2. 迁移达人数据
      await this.migrateInfluencers();
      
      // 3. 创建关联记录
      await this.createInfluencerPeriodRelations();
      
      // 4. 验证迁移结果
      await this.validateMigration();
      
      console.log('\n✅ 数据迁移完成！');
      this.printStats();
      
    } catch (error) {
      console.error('❌ 迁移失败:', error);
      throw error;
    }
  }

  async createPeriods() {
    console.log('1. 创建期数记录...');
    
    // 从现有数据中提取所有期数
    const periods = await OldDaren.distinct('periodData.period');
    const legacyPeriods = await OldDaren.distinct('period');
    
    const allPeriods = [...new Set([...periods, ...legacyPeriods])].filter(Boolean);
    
    console.log(`   发现 ${allPeriods.length} 个期数:`, allPeriods);
    
    for (const periodName of allPeriods) {
      try {
        // 检查期数是否已存在
        const existingPeriod = await Period.findOne({ name: periodName });
        if (existingPeriod) {
          console.log(`   期数 "${periodName}" 已存在，跳过`);
          continue;
        }
        
        // 创建期数记录
        const period = new Period({
          name: periodName,
          displayName: periodName,
          description: `自动迁移的期数: ${periodName}`,
          startDate: new Date('2024-01-01'), // 默认开始时间
          endDate: new Date('2024-12-31'),   // 默认结束时间
          status: 'completed', // 假设历史期数都已完成
          createdBy: 'migration-script'
        });
        
        await period.save();
        this.stats.createdPeriods++;
        console.log(`   ✅ 创建期数: ${periodName}`);
        
      } catch (error) {
        console.error(`   ❌ 创建期数 "${periodName}" 失败:`, error.message);
        this.stats.errors.push(`创建期数 ${periodName}: ${error.message}`);
      }
    }
  }

  async migrateInfluencers() {
    console.log('\n2. 迁移达人数据...');
    
    const darens = await OldDaren.find({});
    console.log(`   找到 ${darens.length} 个达人记录`);
    
    for (const daren of darens) {
      try {
        this.stats.processedDarens++;
        
        // 检查达人是否已存在（基于昵称和小红书ID）
        const existingInfluencer = await Influencer.findOne({
          $or: [
            { nickname: daren.nickname },
            { xiaohongshuId: daren.xiaohongshuId }
          ]
        });
        
        if (existingInfluencer) {
          console.log(`   达人 "${daren.nickname}" 已存在，跳过创建`);
          continue;
        }
        
        // 创建新的达人记录
        const influencer = new Influencer({
          nickname: daren.nickname,
          platform: daren.platform || 'xiaohongshu',
          followers: daren.followers,
          homePage: daren.homePage,
          xiaohongshuId: daren.xiaohongshuId,
          ipLocation: daren.ipLocation,
          contactInfo: daren.contactInfo,
          socialLinks: {
            douyin: daren.douyinLink,
            dianping: daren.dianping
          },
          remarks: daren.remarks,
          dataSource: 'migration'
        });
        
        await influencer.save();
        this.stats.createdInfluencers++;
        console.log(`   ✅ 创建达人: ${daren.nickname}`);
        
      } catch (error) {
        console.error(`   ❌ 迁移达人 "${daren.nickname}" 失败:`, error.message);
        this.stats.errors.push(`迁移达人 ${daren.nickname}: ${error.message}`);
      }
    }
  }

  async createInfluencerPeriodRelations() {
    console.log('\n3. 创建达人-期数关联记录...');
    
    const darens = await OldDaren.find({});
    
    for (const daren of darens) {
      try {
        // 找到对应的新达人记录
        const influencer = await Influencer.findOne({
          $or: [
            { nickname: daren.nickname },
            { xiaohongshuId: daren.xiaohongshuId }
          ]
        });
        
        if (!influencer) {
          console.log(`   ⚠️ 未找到达人 "${daren.nickname}" 的新记录`);
          continue;
        }
        
        // 处理期数数据数组
        if (daren.periodData && daren.periodData.length > 0) {
          for (const periodData of daren.periodData) {
            await this.createInfluencerPeriodRecord(influencer._id, periodData);
          }
        }
        
        // 处理兼容字段（旧的单期数数据）
        if (daren.period) {
          const legacyPeriodData = {
            period: daren.period,
            fee: daren.fee,
            mainPublishLink: daren.mainPublishLink,
            syncPublishLink: daren.syncPublishLink,
            storeArrivalTime: daren.storeArrivalTime,
            likes: daren.likes,
            comments: daren.comments,
            collections: daren.collections
          };
          
          await this.createInfluencerPeriodRecord(influencer._id, legacyPeriodData);
        }
        
      } catch (error) {
        console.error(`   ❌ 处理达人 "${daren.nickname}" 的关联记录失败:`, error.message);
        this.stats.errors.push(`关联记录 ${daren.nickname}: ${error.message}`);
      }
    }
  }

  async createInfluencerPeriodRecord(influencerId, periodData) {
    try {
      // 检查关联记录是否已存在
      const existingRelation = await InfluencerPeriod.findOne({
        influencer: influencerId,
        period: periodData.period
      });
      
      if (existingRelation) {
        console.log(`   关联记录已存在: ${influencerId} - ${periodData.period}`);
        return;
      }
      
      // 创建关联记录
      const relation = new InfluencerPeriod({
        influencer: influencerId,
        period: periodData.period,
        fee: periodData.fee || 0,
        mainPublishLink: periodData.mainPublishLink,
        syncPublishLink: periodData.syncPublishLink,
        contactPerson: periodData.contactPerson,
        storeArrivalTime: periodData.storeArrivalTime,
        performance: {
          likes: periodData.likes || 0,
          comments: periodData.comments || 0,
          collections: periodData.collections || 0,
          lastUpdated: new Date()
        },
        remarks: periodData.periodRemarks,
        status: this.determineStatus(periodData),
        dataSource: 'migration'
      });
      
      await relation.save();
      this.stats.createdRelations++;
      console.log(`   ✅ 创建关联: ${influencerId} - ${periodData.period}`);
      
    } catch (error) {
      console.error(`   ❌ 创建关联记录失败:`, error.message);
      this.stats.errors.push(`关联记录: ${error.message}`);
    }
  }

  determineStatus(periodData) {
    // 根据现有数据推断状态
    if (periodData.mainPublishLink || periodData.syncPublishLink) {
      return 'published';
    }
    if (periodData.storeArrivalTime) {
      return 'content_created';
    }
    if (periodData.contactPerson) {
      return 'confirmed';
    }
    return 'contacted';
  }

  async validateMigration() {
    console.log('\n4. 验证迁移结果...');
    
    const originalCount = await OldDaren.countDocuments();
    const newInfluencerCount = await Influencer.countDocuments();
    const periodCount = await Period.countDocuments();
    const relationCount = await InfluencerPeriod.countDocuments();
    
    console.log(`   原始达人记录: ${originalCount}`);
    console.log(`   新达人记录: ${newInfluencerCount}`);
    console.log(`   期数记录: ${periodCount}`);
    console.log(`   关联记录: ${relationCount}`);
    
    // 验证数据完整性
    const sampleInfluencer = await Influencer.findOne().populate({
      path: 'cooperationStats',
      model: 'InfluencerPeriod'
    });
    
    if (sampleInfluencer) {
      console.log(`   ✅ 样本达人验证通过: ${sampleInfluencer.nickname}`);
    }
  }

  printStats() {
    console.log('\n📊 迁移统计:');
    console.log(`   处理的达人: ${this.stats.processedDarens}`);
    console.log(`   创建的达人: ${this.stats.createdInfluencers}`);
    console.log(`   创建的期数: ${this.stats.createdPeriods}`);
    console.log(`   创建的关联: ${this.stats.createdRelations}`);
    
    if (this.stats.errors.length > 0) {
      console.log(`\n⚠️ 错误 (${this.stats.errors.length}):`);
      this.stats.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('✅ 数据库连接已关闭');
  }
}

// 运行迁移
async function runMigration() {
  const migration = new ModelMigration();
  
  try {
    await migration.connect();
    await migration.migrate();
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  } finally {
    await migration.disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runMigration();
}

module.exports = ModelMigration;