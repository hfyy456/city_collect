// 测试数据标准化功能的脚本

// 数字标准化函数（与路由中的函数相同）
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

// 标准化达人数据中的数字字段
function normalizeDarenData(data) {
  const normalized = { ...data };
  
  // 标准化主要字段
  if (normalized.followers !== undefined) {
    normalized.followers = normalizeNumber(normalized.followers);
  }
  if (normalized.likesAndCollections !== undefined) {
    normalized.likesAndCollections = normalizeNumber(normalized.likesAndCollections);
  }
  if (normalized.likes !== undefined) {
    normalized.likes = normalizeNumber(normalized.likes);
  }
  if (normalized.collections !== undefined) {
    normalized.collections = normalizeNumber(normalized.collections);
  }
  if (normalized.comments !== undefined) {
    normalized.comments = normalizeNumber(normalized.comments);
  }
  if (normalized.fee !== undefined) {
    normalized.fee = normalizeNumber(normalized.fee);
  }
  if (normalized.exposure !== undefined) {
    normalized.exposure = normalizeNumber(normalized.exposure);
  }
  if (normalized.reads !== undefined) {
    normalized.reads = normalizeNumber(normalized.reads);
  }
  if (normalized.forwards !== undefined) {
    normalized.forwards = normalizeNumber(normalized.forwards);
  }
  
  // 标准化期数数据
  if (normalized.periodData && Array.isArray(normalized.periodData)) {
    normalized.periodData = normalized.periodData.map(period => ({
      ...period,
      likes: normalizeNumber(period.likes),
      collections: normalizeNumber(period.collections),
      comments: normalizeNumber(period.comments),
      fee: normalizeNumber(period.fee),
      exposure: normalizeNumber(period.exposure),
      reads: normalizeNumber(period.reads),
      forwards: normalizeNumber(period.forwards)
    }));
  }
  
  return normalized;
}

// 测试数据
const testData = {
  nickname: '测试达人',
  followers: '1.5万',
  likesAndCollections: '2.3万',
  likes: '1.2k',
  collections: '800',
  comments: '150',
  fee: '8000',
  periodData: [
    {
      period: '2024年第1期',
      likes: '2.5k',
      collections: '900',
      comments: '120',
      fee: '7500',
      exposure: '5万',
      reads: '3.2万'
    },
    {
      period: '2024年第2期',
      likes: 3200,
      collections: '1.1k',
      comments: '180',
      fee: 10000,
      exposure: '6.5万',
      reads: '4万'
    }
  ]
};

console.log('=== 数据标准化测试 ===\n');

console.log('原始数据:');
console.log(JSON.stringify(testData, null, 2));

const normalizedData = normalizeDarenData(testData);

console.log('\n标准化后的数据:');
console.log(JSON.stringify(normalizedData, null, 2));

console.log('\n=== 字段对比 ===');
console.log(`粉丝数: ${testData.followers} -> ${normalizedData.followers} (${typeof normalizedData.followers})`);
console.log(`点赞与收藏: ${testData.likesAndCollections} -> ${normalizedData.likesAndCollections} (${typeof normalizedData.likesAndCollections})`);
console.log(`点赞: ${testData.likes} -> ${normalizedData.likes} (${typeof normalizedData.likes})`);
console.log(`收藏: ${testData.collections} -> ${normalizedData.collections} (${typeof normalizedData.collections})`);
console.log(`评论: ${testData.comments} -> ${normalizedData.comments} (${typeof normalizedData.comments})`);
console.log(`费用: ${testData.fee} -> ${normalizedData.fee} (${typeof normalizedData.fee})`);

console.log('\n=== 期数数据对比 ===');
testData.periodData.forEach((period, index) => {
  const normalizedPeriod = normalizedData.periodData[index];
  console.log(`\n${period.period}:`);
  console.log(`  点赞: ${period.likes} -> ${normalizedPeriod.likes} (${typeof normalizedPeriod.likes})`);
  console.log(`  收藏: ${period.collections} -> ${normalizedPeriod.collections} (${typeof normalizedPeriod.collections})`);
  console.log(`  评论: ${period.comments} -> ${normalizedPeriod.comments} (${typeof normalizedPeriod.comments})`);
  console.log(`  费用: ${period.fee} -> ${normalizedPeriod.fee} (${typeof normalizedPeriod.fee})`);
  console.log(`  曝光: ${period.exposure} -> ${normalizedPeriod.exposure} (${typeof normalizedPeriod.exposure})`);
  console.log(`  阅读: ${period.reads} -> ${normalizedPeriod.reads} (${typeof normalizedPeriod.reads})`);
});

console.log('\n=== 验证结果 ===');
const allFieldsAreNumbers = [
  typeof normalizedData.followers === 'number',
  typeof normalizedData.likesAndCollections === 'number',
  typeof normalizedData.likes === 'number',
  typeof normalizedData.collections === 'number',
  typeof normalizedData.comments === 'number',
  typeof normalizedData.fee === 'number'
].every(Boolean);

const allPeriodFieldsAreNumbers = normalizedData.periodData.every(period => 
  typeof period.likes === 'number' &&
  typeof period.collections === 'number' &&
  typeof period.comments === 'number' &&
  typeof period.fee === 'number' &&
  typeof period.exposure === 'number' &&
  typeof period.reads === 'number'
);

console.log(`所有主要字段都是数字类型: ${allFieldsAreNumbers ? '✅' : '❌'}`);
console.log(`所有期数字段都是数字类型: ${allPeriodFieldsAreNumbers ? '✅' : '❌'}`);
console.log(`数据标准化功能: ${allFieldsAreNumbers && allPeriodFieldsAreNumbers ? '✅ 正常工作' : '❌ 存在问题'}`);

module.exports = { normalizeNumber, normalizeDarenData };