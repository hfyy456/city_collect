const mongoose = require('mongoose');
const Daren = require('../models/daren');

// 示例脚本：为达人添加新期数数据
async function addPeriodExample() {
  try {
    console.log('连接数据库...');
    
    // 连接数据库
    await mongoose.connect('mongodb://localhost:27017/city-collect', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('数据库连接成功');
    
    // 示例1：为指定达人添加新期数
    console.log('\n=== 示例1：为指定达人添加新期数 ===');
    
    // 查找达人
    const daren = await Daren.findOne({ nickname: '美食小仙女' });
    if (daren) {
      // 添加新期数数据
      const newPeriodData = {
        period: '2024年第4期',
        fee: 12000,
        cooperationMethod: '付费合作',
        mainPublishLink: 'https://xiaohongshu.com/explore/new-note-4',
        syncPublishLink: 'https://xiaohongshu.com/explore/new-note-4-sync',
        contactPerson: '王经理',
        hasConnection: true,
        inGroup: true,
        arrivedAtStore: false,
        reviewed: false,
        published: false,
        likes: 0,
        comments: 0,
        collections: 0,
        periodRemarks: '第四期合作，费用上调'
      };
      
      await daren.addPeriodData(newPeriodData);
      console.log(`✅ 为 ${daren.nickname} 添加了 ${newPeriodData.period} 的数据`);
      
      // 查看该达人的所有期数
      const allPeriods = daren.getAllPeriods();
      console.log(`${daren.nickname} 参与的所有期数:`, allPeriods);
    } else {
      console.log('❌ 未找到指定达人');
    }
    
    // 示例2：批量为多个达人添加同一期数
    console.log('\n=== 示例2：批量为多个达人添加同一期数 ===');
    
    const targetDarens = await Daren.find({ 
      nickname: { $in: ['时尚达人小雅', '生活博主小明'] } 
    });
    
    const batchPeriodData = {
      period: '2024年第5期',
      fee: 8000,
      cooperationMethod: '付费合作',
      contactPerson: '李经理',
      hasConnection: true,
      periodRemarks: '第五期批量合作'
    };
    
    for (const daren of targetDarens) {
      await daren.addPeriodData(batchPeriodData);
      console.log(`✅ 为 ${daren.nickname} 添加了 ${batchPeriodData.period} 的数据`);
    }
    
    // 示例3：更新现有期数的数据（比如添加作品数据）
    console.log('\n=== 示例3：更新现有期数的作品数据 ===');
    
    const darenToUpdate = await Daren.findOne({ nickname: '美食小仙女' });
    if (darenToUpdate) {
      const updateData = {
        period: '2024年第4期',
        likes: 3500,
        comments: 200,
        collections: 1200,
        published: true,
        reviewed: true,
        arrivedAtStore: true,
        mainPublishLink: 'https://xiaohongshu.com/explore/updated-note-4',
        periodRemarks: '第四期合作，数据表现优秀'
      };
      
      await darenToUpdate.addPeriodData(updateData);
      console.log(`✅ 更新了 ${darenToUpdate.nickname} 的 ${updateData.period} 数据`);
    }
    
    // 示例4：查看期数统计
    console.log('\n=== 示例4：查看期数统计 ===');
    
    const allPeriods = await Daren.getAllPeriods();
    console.log('所有期数:', allPeriods.map(p => p.period));
    
    for (const periodInfo of allPeriods) {
      const darensInPeriod = await Daren.findByPeriod(periodInfo.period);
      let totalFee = 0;
      let totalEngagement = 0;
      let publishedCount = 0;
      
      darensInPeriod.forEach(daren => {
        const periodData = daren.getPeriodData(periodInfo.period);
        if (periodData) {
          totalFee += periodData.fee || 0;
          totalEngagement += (periodData.likes || 0) + (periodData.comments || 0) + (periodData.collections || 0);
          if (periodData.published) publishedCount++;
        }
      });
      
      console.log(`期数 "${periodInfo.period}":`);
      console.log(`  - 参与达人: ${darensInPeriod.length} 个`);
      console.log(`  - 总费用: ¥${totalFee.toLocaleString()}`);
      console.log(`  - 总互动量: ${totalEngagement.toLocaleString()}`);
      console.log(`  - 已发布: ${publishedCount} 个 (${Math.round(publishedCount / darensInPeriod.length * 100)}%)`);
    }
    
    console.log('\n=== 操作完成 ===');
    
  } catch (error) {
    console.error('操作过程中发生错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  addPeriodExample();
}

module.exports = addPeriodExample;