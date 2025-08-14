/**
 * 调试报价更新问题
 * 模拟更新作品数据时报价被意外更新的情况
 */

const mongoose = require('mongoose');
const Daren = require('./packages/backend/models/daren');
const { normalizeDarenData } = require('./packages/backend/utils/normalize');

async function debugFeeUpdateIssue() {
  try {
    await mongoose.connect('mongodb://47.121.31.68:32233/city_collect');
    console.log('✅ 数据库连接成功');
    
    // 1. 找一个有期数数据的达人
    const daren = await Daren.findOne({ 'periodData.0': { $exists: true } });
    if (!daren) {
      console.log('❌ 没有找到有期数数据的达人');
      return;
    }
    
    console.log(`\n📋 测试达人: ${daren.nickname}`);
    console.log(`期数数据数量: ${daren.periodData.length}`);
    
    if (daren.periodData.length > 0) {
      const firstPeriod = daren.periodData[0];
      console.log(`\n原始期数数据:`);
      console.log(`  期数: ${firstPeriod.period}`);
      console.log(`  报价: ${firstPeriod.fee}`);
      console.log(`  点赞: ${firstPeriod.likes}`);
      console.log(`  评论: ${firstPeriod.comments}`);
      console.log(`  收藏: ${firstPeriod.collections}`);
      
      // 2. 模拟只更新作品数据的请求
      const updateData = {
        likes: 150,
        comments: 25,
        collections: 80
        // 注意：这里没有包含 fee 字段
      };
      
      console.log(`\n🔄 模拟更新请求数据:`, updateData);
      
      // 3. 模拟当前的处理逻辑
      console.log(`\n=== 当前处理逻辑 ===`);
      const normalizedUpdateData = normalizeDarenData({ 
        periodData: [{ ...updateData, period: firstPeriod.period }] 
      }).periodData[0];
      
      console.log(`标准化后的数据:`, normalizedUpdateData);
      console.log(`❌ 问题：fee 被设置为 ${normalizedUpdateData.fee}（应该保持原值 ${firstPeriod.fee}）`);
      
      // 4. 展示正确的处理逻辑
      console.log(`\n=== 正确的处理逻辑 ===`);
      
      // 只标准化实际传入的字段
      const correctUpdateData = {};
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          if (['likes', 'comments', 'collections', 'forwards'].includes(key)) {
            correctUpdateData[key] = typeof updateData[key] === 'number' ? 
              updateData[key] : parseInt(updateData[key]) || 0;
          } else {
            correctUpdateData[key] = updateData[key];
          }
        }
      });
      
      console.log(`正确处理后的数据:`, correctUpdateData);
      console.log(`✅ 正确：只更新传入的字段，不影响 fee`);
      
      // 5. 测试 addPeriodData 的行为
      console.log(`\n=== addPeriodData 方法测试 ===`);
      
      // 备份原始数据
      const originalFee = firstPeriod.fee;
      
      // 使用错误的方式更新
      console.log(`使用错误方式更新...`);
      await daren.addPeriodData({
        period: firstPeriod.period,
        ...normalizedUpdateData
      });
      
      // 检查结果
      const updatedDaren = await Daren.findById(daren._id);
      const updatedPeriod = updatedDaren.getPeriodData(firstPeriod.period);
      
      console.log(`更新后的数据:`);
      console.log(`  期数: ${updatedPeriod.period}`);
      console.log(`  报价: ${updatedPeriod.fee} (原值: ${originalFee})`);
      console.log(`  点赞: ${updatedPeriod.likes}`);
      console.log(`  评论: ${updatedPeriod.comments}`);
      console.log(`  收藏: ${updatedPeriod.collections}`);
      
      if (updatedPeriod.fee !== originalFee) {
        console.log(`❌ 确认问题：报价从 ${originalFee} 被错误地更新为 ${updatedPeriod.fee}`);
      }
      
      // 恢复原始数据
      await daren.addPeriodData({
        period: firstPeriod.period,
        fee: originalFee
      });
      console.log(`✅ 已恢复原始报价数据`);
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugFeeUpdateIssue();