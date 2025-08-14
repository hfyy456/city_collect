const mongoose = require('mongoose');

// 导入模型
const OldDaren = require('../models/daren');
const Influencer = require('../models/influencer');
const Period = require('../models/period');
const InfluencerPeriod = require('../models/influencerPeriod');

/**
 * 迁移验证脚本
 * 验证数据迁移的完整性和正确性
 */
class MigrationValidator {
  constructor() {
    this.results = {
      dataIntegrity: {},
      performanceTest: {},
      functionalTest: {},
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

  async validate() {
    console.log('🔍 开始验证数据迁移...\n');
    
    try {
      await this.validateDataIntegrity();
      await this.testPerformance();
      await this.testFunctionality();
      
      console.log('\n✅ 迁移验证完成！');
      this.printResults();
      
    } catch (error) {
      console.error('❌ 验证失败:', error);
      throw error;
    }
  }

  async validateDataIntegrity() {
    console.log('1. 数据完整性验证');
    console.log('==================');
    
    // 统计原始数据
    const originalDarens = await OldDaren.countDocuments();
    const originalPeriodData = await OldDaren.aggregate([
      { $unwind: { path: '$periodData', preserveNullAndEmptyArrays: true } },
      { $match: { 'periodData.period': { $exists: true } } },
      { $count: 'total' }
    ]);
    const originalLegacyPeriods = await OldDaren.countDocuments({ period: { $exists: true, $ne: null } });
    
    // 统计新数据
    const newInfluencers = await Influencer.countDocuments();
    const newPeriods = await Period.countDocuments();
    const newRelations = await InfluencerPeriod.countDocuments();
    
    console.log(`原始达人记录: ${originalDarens}`);
    console.log(`原始期数数据: ${originalPeriodData[0]?.total || 0}`);
    console.log(`原始兼容期数: ${originalLegacyPeriods}`);
    console.log(`新达人记录: ${newInfluencers}`);
    console.log(`新期数记录: ${newPeriods}`);
    console.log(`新关联记录: ${newRelations}`);
    
    // 验证数据一致性
    const expectedRelations = (originalPeriodData[0]?.total || 0) + originalLegacyPeriods;
    const relationsDiff = Math.abs(newRelations - expectedRelations);
    
    if (relationsDiff <= originalDarens * 0.1) { // 允许10%的差异
      console.log('✅ 数据数量验证通过');
    } else {
      console.log(`⚠️ 数据数量差异较大: 期望${expectedRelations}, 实际${newRelations}`);
    }
    
    // 抽样验证数据内容
    await this.validateSampleData();
    
    this.results.dataIntegrity = {
      originalDarens,
      newInfluencers,
      newPeriods,
      newRelations,
      expectedRelations,
      passed: relationsDiff <= originalDarens * 0.1
    };
  }

  async validateSampleData() {
    console.log('\n抽样验证数据内容...');
    
    // 随机选择5个原始达人进行验证
    const sampleDarens = await OldDaren.aggregate([{ $sample: { size: 5 } }]);
    
    for (const daren of sampleDarens) {
      try {
        // 找到对应的新达人记录
        const newInfluencer = await Influencer.findOne({
          $or: [
            { nickname: daren.nickname },
            { xiaohongshuId: daren.xiaohongshuId }
          ]
        });
        
        if (!newInfluencer) {
          console.log(`⚠️ 未找到达人 "${daren.nickname}" 的新记录`);
          continue;
        }
        
        // 验证基本信息
        const basicInfoMatch = 
          newInfluencer.nickname === daren.nickname &&
          newInfluencer.followers === daren.followers &&
          newInfluencer.xiaohongshuId === daren.xiaohongshuId;
        
        if (basicInfoMatch) {
          console.log(`✅ 达人 "${daren.nickname}" 基本信息验证通过`);
        } else {
          console.log(`❌ 达人 "${daren.nickname}" 基本信息不匹配`);
        }
        
        // 验证期数数据
        if (daren.periodData && daren.periodData.length > 0) {
          for (const periodData of daren.periodData) {
            const relation = await InfluencerPeriod.findOne({
              influencer: newInfluencer._id,
              period: periodData.period
            });
            
            if (relation) {
              const dataMatch = 
                relation.fee === periodData.fee &&
                relation.performance.likes === periodData.likes &&
                relation.performance.comments === periodData.comments;
              
              if (dataMatch) {
                console.log(`  ✅ 期数 "${periodData.period}" 数据验证通过`);
              } else {
                console.log(`  ❌ 期数 "${periodData.period}" 数据不匹配`);
              }
            } else {
              console.log(`  ⚠️ 未找到期数 "${periodData.period}" 的关联记录`);
            }
          }
        }
        
      } catch (error) {
        console.log(`❌ 验证达人 "${daren.nickname}" 时出错:`, error.message);
      }
    }
  }

  async testPerformance() {
    console.log('\n2. 性能测试');
    console.log('============');
    
    const testPeriod = await Period.findOne();
    if (!testPeriod) {
      console.log('⚠️ 没有期数数据，跳过性能测试');
      return;
    }
    
    // 测试旧查询性能
    console.log('测试旧查询方式...');
    const oldStart = Date.now();
    const oldResults = await OldDaren.find({ 'periodData.period': testPeriod.name });
    const oldTime = Date.now() - oldStart;
    console.log(`旧查询耗时: ${oldTime}ms, 结果数: ${oldResults.length}`);
    
    // 测试新查询性能
    console.log('测试新查询方式...');
    const newStart = Date.now();
    const newResults = await InfluencerPeriod.find({ period: testPeriod.name }).populate('influencer');
    const newTime = Date.now() - newStart;
    console.log(`新查询耗时: ${newTime}ms, 结果数: ${newResults.length}`);
    
    const improvement = oldTime > 0 ? ((oldTime - newTime) / oldTime * 100).toFixed(1) : 0;
    console.log(`性能提升: ${improvement}%`);
    
    this.results.performanceTest = {
      oldTime,
      newTime,
      improvement: parseFloat(improvement),
      oldResultCount: oldResults.length,
      newResultCount: newResults.length
    };
  }

  async testFunctionality() {
    console.log('\n3. 功能测试');
    console.log('============');
    
    try {
      // 测试期数统计功能
      const periods = await Period.find().limit(3);
      
      for (const period of periods) {
        console.log(`测试期数 "${period.name}" 的统计功能...`);
        
        const stats = await InfluencerPeriod.getPeriodStats(period.name);
        if (stats && stats.length > 0) {
          const stat = stats[0];
          console.log(`  ✅ 统计成功: ${stat.totalInfluencers}个达人, 投入${stat.totalInvestment}元`);
        } else {
          console.log(`  ⚠️ 期数 "${period.name}" 暂无统计数据`);
        }
      }
      
      // 测试达人查询功能
      console.log('\n测试达人查询功能...');
      const sampleInfluencer = await Influencer.findOne();
      if (sampleInfluencer) {
        const periods = await sampleInfluencer.getPeriods();
        console.log(`✅ 达人 "${sampleInfluencer.nickname}" 参与了 ${periods.length} 个期数`);
        
        const latestCooperation = await sampleInfluencer.getLatestCooperation();
        if (latestCooperation) {
          console.log(`✅ 最新合作期数: ${latestCooperation.period}`);
        }
      }
      
      this.results.functionalTest.passed = true;
      
    } catch (error) {
      console.log('❌ 功能测试失败:', error.message);
      this.results.functionalTest.passed = false;
      this.results.errors.push(`功能测试: ${error.message}`);
    }
  }

  printResults() {
    console.log('\n📊 验证结果汇总');
    console.log('================');
    
    const { dataIntegrity, performanceTest, functionalTest } = this.results;
    
    console.log('\n数据完整性:');
    console.log(`  原始达人: ${dataIntegrity.originalDarens}`);
    console.log(`  新达人: ${dataIntegrity.newInfluencers}`);
    console.log(`  新期数: ${dataIntegrity.newPeriods}`);
    console.log(`  新关联: ${dataIntegrity.newRelations}`);
    console.log(`  验证结果: ${dataIntegrity.passed ? '✅ 通过' : '❌ 失败'}`);
    
    if (performanceTest.oldTime) {
      console.log('\n性能提升:');
      console.log(`  旧查询: ${performanceTest.oldTime}ms`);
      console.log(`  新查询: ${performanceTest.newTime}ms`);
      console.log(`  提升: ${performanceTest.improvement}%`);
    }
    
    console.log('\n功能测试:');
    console.log(`  结果: ${functionalTest.passed ? '✅ 通过' : '❌ 失败'}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n⚠️ 发现的问题:');
      this.results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n🎉 迁移验证完成！');
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('✅ 数据库连接已关闭');
  }
}

// 运行验证
async function runValidation() {
  const validator = new MigrationValidator();
  
  try {
    await validator.connect();
    await validator.validate();
  } catch (error) {
    console.error('验证失败:', error);
    process.exit(1);
  } finally {
    await validator.disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runValidation();
}

module.exports = MigrationValidator;