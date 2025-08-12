// 演示数据标准化功能的脚本（不需要数据库连接）

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

// 演示数据
const demoData = [
  {
    nickname: '美食小仙女',
    followers: '1.5万',
    likesAndCollections: '2.3万',
    periodData: [
      {
        period: '2024年第1期',
        likes: '2.5k',
        collections: '800',
        comments: 120,
        fee: '8000'
      },
      {
        period: '2024年第2期',
        likes: '3200',
        collections: '1.2k',
        comments: '180',
        fee: 10000
      }
    ]
  },
  {
    nickname: '时尚达人小雅',
    followers: '8万',
    likesAndCollections: '1.8万',
    periodData: [
      {
        period: '2024年第1期',
        likes: '1.8k',
        collections: 600,
        comments: '90',
        fee: '0'
      }
    ]
  },
  {
    nickname: '生活博主小明',
    followers: '12万',
    likesAndCollections: '2.8万',
    periodData: [
      {
        period: '2024年第2期',
        likes: 2800,
        collections: '950',
        comments: 150,
        fee: '7500'
      }
    ]
  }
];

// 演示数据标准化过程
function demonstrateNormalization() {
  console.log('=== 数据标准化演示 ===\n');
  
  let totalUpdates = 0;
  
  demoData.forEach((daren, index) => {
    console.log(`${index + 1}. ${daren.nickname}`);
    console.log('   标准化前 -> 标准化后');
    
    // 标准化粉丝数
    const normalizedFollowers = normalizeNumber(daren.followers);
    if (normalizedFollowers !== daren.followers) {
      console.log(`   粉丝数: ${daren.followers} -> ${normalizedFollowers}`);
      totalUpdates++;
    }
    
    // 标准化点赞与收藏
    const normalizedLikesAndCollections = normalizeNumber(daren.likesAndCollections);
    if (normalizedLikesAndCollections !== daren.likesAndCollections) {
      console.log(`   点赞与收藏: ${daren.likesAndCollections} -> ${normalizedLikesAndCollections}`);
      totalUpdates++;
    }
    
    // 标准化期数数据
    daren.periodData.forEach(period => {
      console.log(`   ${period.period}:`);
      
      const fields = ['likes', 'collections', 'comments', 'fee'];
      fields.forEach(field => {
        if (period[field] !== undefined) {
          const normalized = normalizeNumber(period[field]);
          if (normalized !== period[field]) {
            console.log(`     ${field}: ${period[field]} -> ${normalized}`);
            totalUpdates++;
          }
        }
      });
    });
    
    console.log('');
  });
  
  console.log('=== 标准化统计 ===');
  console.log(`总达人数: ${demoData.length}`);
  console.log(`总更新字段数: ${totalUpdates}`);
  
  // 展示标准化后的数据结构
  console.log('\n=== 标准化后的数据示例 ===');
  const normalizedExample = {
    nickname: demoData[0].nickname,
    followers: normalizeNumber(demoData[0].followers),
    likesAndCollections: normalizeNumber(demoData[0].likesAndCollections),
    periodData: demoData[0].periodData.map(period => ({
      period: period.period,
      likes: normalizeNumber(period.likes),
      collections: normalizeNumber(period.collections),
      comments: normalizeNumber(period.comments),
      fee: normalizeNumber(period.fee)
    }))
  };
  
  console.log(JSON.stringify(normalizedExample, null, 2));
  
  console.log('\n=== 数据类型验证 ===');
  console.log(`粉丝数类型: ${typeof normalizedExample.followers}`);
  console.log(`点赞与收藏类型: ${typeof normalizedExample.likesAndCollections}`);
  normalizedExample.periodData.forEach((period, index) => {
    console.log(`期数${index + 1} - 点赞类型: ${typeof period.likes}`);
    console.log(`期数${index + 1} - 收藏类型: ${typeof period.collections}`);
    console.log(`期数${index + 1} - 费用类型: ${typeof period.fee}`);
  });
}

// 测试各种数字格式
function testNumberFormats() {
  console.log('\n=== 数字格式测试 ===');
  
  const testCases = [
    '1.1',
    '1100',
    '1.1万',
    '2.5k',
    '3K',
    '15万',
    '0.8万',
    '500',
    '1.2k',
    0,
    1500,
    null,
    undefined,
    '',
    '无效数字'
  ];
  
  testCases.forEach(testCase => {
    const result = normalizeNumber(testCase);
    console.log(`${String(testCase).padEnd(10)} -> ${result} (${typeof result})`);
  });
}

// 运行演示
if (require.main === module) {
  demonstrateNormalization();
  testNumberFormats();
}

module.exports = { normalizeNumber, demonstrateNormalization, testNumberFormats };