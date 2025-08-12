const mongoose = require('mongoose');
const Daren = require('../models/daren');

// 演示脚本：创建期数维度的示例数据
async function createDemoData() {
  try {
    console.log('开始创建演示数据...');
    
    // 连接数据库
    await mongoose.connect('mongodb://localhost:27017/city-collect', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('数据库连接成功');
    
    // 创建示例达人数据
    const demoDarens = [
      {
        nickname: '美食小仙女',
        platform: '小红书',
        followers: '15万',
        xiaohongshuId: 'foodie123',
        ipLocation: '上海',
        homePage: 'https://xiaohongshu.com/user/foodie123',
        contactInfo: '微信: foodie_contact',
        periodData: [
          {
            period: '2024年第1期',
            fee: 8000,
            cooperationMethod: '付费合作',
            mainPublishLink: 'https://xiaohongshu.com/explore/note1',
            syncPublishLink: 'https://xiaohongshu.com/explore/note1_sync',
            likes: 2500,
            comments: 120,
            collections: 800,
            published: true,
            reviewed: true,
            arrivedAtStore: true,
            hasConnection: true,
            contactPerson: '张经理',
            cooperationMethod: '付费合作',
            periodRemarks: '表现优秀，互动率高'
          },
          {
            period: '2024年第2期',
            fee: 10000,
            cooperationMethod: '付费合作',
            mainPublishLink: 'https://xiaohongshu.com/explore/note2',
            likes: 3200,
            comments: 180,
            collections: 1200,
            published: true,
            reviewed: true,
            arrivedAtStore: true,
            hasConnection: true,
            contactPerson: '李经理',
            periodRemarks: '持续合作，效果更佳'
          }
        ]
      },
      {
        nickname: '时尚达人小雅',
        platform: '小红书',
        followers: '8万',
        xiaohongshuId: 'fashion_ya',
        ipLocation: '北京',
        homePage: 'https://xiaohongshu.com/user/fashion_ya',
        contactInfo: '微信: fashion_contact',
        periodData: [
          {
            period: '2024年第1期',
            fee: 0,
            cooperationMethod: '免费体验',
            mainPublishLink: 'https://xiaohongshu.com/explore/fashion1',
            likes: 1800,
            comments: 90,
            collections: 600,
            published: true,
            reviewed: true,
            arrivedAtStore: true,
            hasConnection: true,
            contactPerson: '王经理',
            periodRemarks: '免费体验效果不错'
          },
          {
            period: '2024年第3期',
            fee: 6000,
            cooperationMethod: '付费合作',
            mainPublishLink: 'https://xiaohongshu.com/explore/fashion3',
            likes: 2100,
            comments: 110,
            collections: 750,
            published: false,
            reviewed: true,
            arrivedAtStore: true,
            hasConnection: true,
            contactPerson: '王经理',
            periodRemarks: '升级为付费合作'
          }
        ]
      },
      {
        nickname: '生活博主小明',
        platform: '小红书',
        followers: '12万',
        xiaohongshuId: 'life_ming',
        ipLocation: '广州',
        homePage: 'https://xiaohongshu.com/user/life_ming',
        contactInfo: '微信: life_contact',
        periodData: [
          {
            period: '2024年第2期',
            fee: 7500,
            cooperationMethod: '付费合作',
            mainPublishLink: 'https://xiaohongshu.com/explore/life2',
            syncPublishLink: 'https://xiaohongshu.com/explore/life2_sync',
            likes: 2800,
            comments: 150,
            collections: 950,
            published: true,
            reviewed: true,
            arrivedAtStore: true,
            hasConnection: true,
            contactPerson: '陈经理',
            periodRemarks: '内容质量高，互动好'
          }
        ]
      }
    ];
    
    // 清除现有演示数据
    await Daren.deleteMany({ nickname: { $in: demoDarens.map(d => d.nickname) } });
    
    // 创建新的演示数据
    for (const darenData of demoDarens) {
      const daren = new Daren(darenData);
      await daren.save();
      console.log(`✅ 创建达人: ${daren.nickname} (${daren.periodData.length} 个期数)`);
    }
    
    console.log('\n=== 演示数据创建完成 ===');
    
    // 验证数据
    console.log('\n=== 验证演示数据 ===');
    const allPeriods = await Daren.getAllPeriods();
    console.log('所有期数:', allPeriods.map(p => p.period));
    
    for (const periodInfo of allPeriods) {
      const darens = await Daren.findByPeriod(periodInfo.period);
      console.log(`期数 "${periodInfo.period}": ${darens.length} 个达人`);
      
      darens.forEach(daren => {
        const periodData = daren.getPeriodData(periodInfo.period);
        console.log(`  - ${daren.nickname}: ¥${periodData.fee || 0}, ${periodData.cooperationMethod || '未设置'}`);
      });
    }
    
    // 展示作品数据
    console.log('\n=== 作品数据概览 ===');
    const allDarens = await Daren.find({ 'periodData.0': { $exists: true } });
    
    allDarens.forEach(daren => {
      console.log(`\n达人: ${daren.nickname}`);
      daren.periodData.forEach(period => {
        const engagement = (period.likes || 0) + (period.comments || 0) + (period.collections || 0);
        console.log(`  ${period.period}: 互动量 ${engagement}, 费用 ¥${period.fee || 0}, ${period.published ? '已发布' : '未发布'}`);
      });
    });
    
  } catch (error) {
    console.error('创建演示数据时发生错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n数据库连接已关闭');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createDemoData();
}

module.exports = createDemoData;