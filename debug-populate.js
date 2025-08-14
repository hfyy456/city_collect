const mongoose = require('mongoose');
const InfluencerPeriod = require('./packages/backend/models/influencerPeriod');
const Influencer = require('./packages/backend/models/influencer');

async function debugPopulate() {
  try {
    await mongoose.connect('mongodb://47.121.31.68:32233/city_collect');
    console.log('✅ 数据库连接成功');
    
    // 检查关联记录
    console.log('\n1. 检查关联记录...');
    const relations = await InfluencerPeriod.find({ period: '7.22' }).limit(3);
    console.log(`找到 ${relations.length} 个关联记录`);
    
    relations.forEach((relation, index) => {
      console.log(`关联记录 ${index + 1}:`);
      console.log(`  influencer ID: ${relation.influencer}`);
      console.log(`  period: ${relation.period}`);
      console.log(`  fee: ${relation.fee}`);
    });
    
    // 检查达人记录
    console.log('\n2. 检查达人记录...');
    const influencers = await Influencer.find().limit(3);
    console.log(`找到 ${influencers.length} 个达人记录`);
    
    influencers.forEach((influencer, index) => {
      console.log(`达人 ${index + 1}:`);
      console.log(`  _id: ${influencer._id}`);
      console.log(`  nickname: ${influencer.nickname}`);
    });
    
    // 测试populate
    console.log('\n3. 测试populate...');
    const populatedRelations = await InfluencerPeriod.find({ period: '7.22' })
      .populate('influencer')
      .limit(3);
    
    populatedRelations.forEach((relation, index) => {
      console.log(`Populated关联记录 ${index + 1}:`);
      console.log(`  influencer: ${relation.influencer ? 'populated' : 'null'}`);
      if (relation.influencer) {
        console.log(`  nickname: ${relation.influencer.nickname}`);
      }
    });
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugPopulate();