const mongoose = require('mongoose');
const Daren = require('../models/daren');

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

// 数据标准化脚本
async function normalizeNumericData() {
  try {
    console.log('开始数据标准化...');
    
    // 连接数据库
    await mongoose.connect('mongodb://47.121.31.68:32233/city_collect', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('数据库连接成功');
    
    // 获取所有达人数据
    const darens = await Daren.find({});
    console.log(`找到 ${darens.length} 个达人记录`);
    
    let updatedCount = 0;
    let totalUpdates = 0;
    
    for (const daren of darens) {
      let hasUpdates = false;
      const updates = {};
      
      // 标准化顶级字段
      const topLevelFields = ['followers', 'likes', 'comments', 'collections', 'forwards'];
      
      for (const field of topLevelFields) {
        if (daren[field] !== undefined && daren[field] !== null) {
          const normalized = normalizeNumber(daren[field]);
          if (normalized !== daren[field]) {
            updates[field] = normalized;
            hasUpdates = true;
            console.log(`${daren.nickname} - ${field}: ${daren[field]} -> ${normalized}`);
          }
        }
      }
      
      // 标准化 likesAndCollections 字段
      if (daren.likesAndCollections !== undefined && daren.likesAndCollections !== null) {
        const normalized = normalizeNumber(daren.likesAndCollections);
        if (normalized !== daren.likesAndCollections) {
          updates.likesAndCollections = normalized;
          hasUpdates = true;
          console.log(`${daren.nickname} - likesAndCollections: ${daren.likesAndCollections} -> ${normalized}`);
        }
      }
      
      // 标准化期数数据中的数字字段
      if (daren.periodData && daren.periodData.length > 0) {
        const updatedPeriodData = daren.periodData.map(period => {
          const periodUpdates = { ...period.toObject() };
          let periodHasUpdates = false;
          
          const periodFields = ['likes', 'comments', 'collections', 'forwards', 'fee'];
          
          for (const field of periodFields) {
            if (period[field] !== undefined && period[field] !== null) {
              const normalized = normalizeNumber(period[field]);
              if (normalized !== period[field]) {
                periodUpdates[field] = normalized;
                periodHasUpdates = true;
                console.log(`${daren.nickname} - ${period.period} - ${field}: ${period[field]} -> ${normalized}`);
              }
            }
          }
          
          if (periodHasUpdates) {
            hasUpdates = true;
            periodUpdates.updatedAt = new Date();
          }
          
          return periodUpdates;
        });
        
        if (hasUpdates) {
          updates.periodData = updatedPeriodData;
        }
      }
      
      // 如果有更新，保存到数据库
      if (hasUpdates) {
        await Daren.findByIdAndUpdate(daren._id, updates);
        updatedCount++;
        totalUpdates += Object.keys(updates).length;
        console.log(`✅ 更新了 ${daren.nickname} 的数据`);
      }
    }
    
    console.log('\n=== 数据标准化完成 ===');
    console.log(`总达人数: ${darens.length}`);
    console.log(`更新的达人数: ${updatedCount}`);
    console.log(`总更新字段数: ${totalUpdates}`);
    
    // 验证标准化结果
    console.log('\n=== 验证标准化结果 ===');
    const verificationDarens = await Daren.find({}).limit(5);
    
    for (const daren of verificationDarens) {
      console.log(`\n${daren.nickname}:`);
      console.log(`  粉丝数: ${daren.followers} (${typeof daren.followers})`);
      console.log(`  点赞与收藏: ${daren.likesAndCollections} (${typeof daren.likesAndCollections})`);
      
      if (daren.periodData && daren.periodData.length > 0) {
        daren.periodData.forEach(period => {
          console.log(`  ${period.period}:`);
          console.log(`    点赞: ${period.likes} (${typeof period.likes})`);
          console.log(`    收藏: ${period.collections} (${typeof period.collections})`);
          console.log(`    费用: ${period.fee} (${typeof period.fee})`);
        });
      }
    }
    
  } catch (error) {
    console.error('数据标准化失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  normalizeNumericData();
}

module.exports = { normalizeNumericData, normalizeNumber };