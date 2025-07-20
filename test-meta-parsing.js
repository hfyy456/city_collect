const cheerio = require('cheerio');
const fs = require('fs');

// 读取我们之前保存的HTML文件
const html = fs.readFileSync('xhs_page_raw.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== Meta标签解析测试 ===\n');

// 测试我们的选择器
console.log('1. 测试具体的小红书Meta标签:');
const metaLikes = $('meta[property="og:xhs:note_like"]').attr('content');
const metaCollections = $('meta[property="og:xhs:note_collect"]').attr('content');
const metaComments = $('meta[property="og:xhs:note_comment"]').attr('content');

console.log('- 点赞数:', metaLikes);
console.log('- 收藏数:', metaCollections);
console.log('- 评论数:', metaComments);

// 如果上面的选择器不工作，尝试查找所有包含xhs的Meta标签
console.log('\n2. 查找所有包含xhs的Meta标签:');
const allMetas = $('meta').toArray();
const xhsMetas = [];

allMetas.forEach((meta) => {
  const $meta = $(meta);
  const property = $meta.attr('property');
  const name = $meta.attr('name');
  const content = $meta.attr('content');
  
  if ((property && property.includes('xhs')) || (name && name.includes('xhs'))) {
    xhsMetas.push({
      property: property,
      name: name,
      content: content
    });
    console.log(`  ${property || name}: ${content}`);
  }
});

// 尝试不同的选择器方式
console.log('\n3. 尝试不同的选择器方式:');
console.log('方式1 - 属性选择器:');
console.log('  点赞:', $('meta[property*="note_like"]').attr('content'));
console.log('  收藏:', $('meta[property*="note_collect"]').attr('content'));
console.log('  评论:', $('meta[property*="note_comment"]').attr('content'));

console.log('\n方式2 - 包含选择器:');
$('meta').each((index, element) => {
  const $el = $(element);
  const prop = $el.attr('property');
  const content = $el.attr('content');
  
  if (prop && (prop.includes('note_like') || prop.includes('note_collect') || prop.includes('note_comment'))) {
    console.log(`  ${prop}: ${content}`);
  }
});

console.log('\n4. 验证基本Meta标签:');
console.log('- og:title:', $('meta[property="og:title"]').attr('content'));
console.log('- og:description:', $('meta[property="og:description"]').attr('content'));
console.log('- keywords:', $('meta[name="keywords"]').attr('content'));

console.log('\n=== 测试完成 ===');
console.log('找到的xhs相关Meta标签数量:', xhsMetas.length);