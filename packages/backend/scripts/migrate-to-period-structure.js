const mongoose = require('mongoose');
const Daren = require('../models/daren');

// 数据迁移脚本：将现有数据迁移到期数维度结构
async function migrateToPeriodStructure() {
  try {
    console.log('开始数据迁移...');
    
    // 连接数据库
    await mongoose.connect('mongodb://localhost:27017/city-collect', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('数据库连接成功');
    
    // 查找所有需要迁移的达人数据
    const darens = await Daren.find({
      $or: [
        { period: { $exists: true, $ne: null, $ne: '' } },
        { fee: { $exists: true, $ne: null } },
        { mainPublishLink: { $exists: true, $ne: null, $ne: '' } },
        { syncPublishLink: { $exists: true, $ne: null, $ne: '' } },
        { likes: { $exists: true, $ne: null } },
        { comments: { $exists: true, $ne: null } },
        { collections: { $exists: true, $ne: null } }
      ]
    });
    
    console.log(`找到 ${darens.length} 个需要迁移的达人记录`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const daren of darens) {
      try {
        // 检查是否已经有期数数据
        if (daren.periodData && daren.periodData.length > 0) {
          console.log(`跳过已迁移的达人: ${daren.nickname}`);
          skippedCount++;
          continue;
        }
        
        // 如果有期数相关的数据，创建期数数据对象
        if (daren.period || daren.fee || daren.mainPublishLink || daren.syncPublishLink || 
            daren.likes || daren.comments || daren.collections) {
          
          const periodData = {
            period: daren.period || '未设置期数',
            fee: daren.fee,
            cooperationMethod: daren.cooperationMethod,
            mainPublishLink: daren.mainPublishLink,
            syncPublishLink: daren.syncPublishLink,
            contactPerson: daren.contactPerson,
            hasConnection: daren.hasConnection,
            inGroup: daren.inGroup,
            storeArrivalTime: daren.storeArrivalTime,
            arrivedAtStore: daren.arrivedAtStore,
            reviewed: daren.reviewed,
            published: daren.published,
            exposure: daren.exposure,
            reads: daren.reads,
            likes: daren.likes,
            comments: daren.comments,
            collections: daren.collections,
            forwards: daren.forwards,
            periodRemarks: '',
            createdAt: daren.createdAt || new Date(),
            updatedAt: new Date()
          };
          
          // 添加期数数据
          await daren.addPeriodData(periodData);
          
          console.log(`✅ 迁移成功: ${daren.nickname} - 期数: ${periodData.period}`);
          migratedCount++;
        } else {
          console.log(`跳过无期数数据的达人: ${daren.nickname}`);
          skippedCount++;
        }
        
      } catch (error) {
        console.error(`❌ 迁移失败: ${daren.nickname} - ${error.message}`);
      }
    }
    
    console.log('\n=== 迁移完成 ===');
    console.log(`成功迁移: ${migratedCount} 个达人`);
    console.log(`跳过记录: ${skippedCount} 个达人`);
    console.log(`总计处理: ${migratedCount + skippedCount} 个达人`);
    
    // 验证迁移结果
    console.log('\n=== 验证迁移结果 ===');
    const allPeriods = await Daren.getAllPeriods();
    console.log('所有期数:', allPeriods.map(p => p.period));
    
    for (const periodInfo of allPeriods) {
      const count = await Daren.countDocuments({ 'periodData.period': periodInfo.period });
      console.log(`期数 "${periodInfo.period}": ${count} 个达人`);
    }
    
  } catch (error) {
    console.error('迁移过程中发生错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateToPeriodStructure();
}

module.exports = migrateToPeriodStructure;