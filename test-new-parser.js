const axios = require('axios');

async function testNewParser() {
  console.log('=== 测试新的小红书解析API ===\n');
  
  // 测试URL（使用我们之前分析的链接）
  const testUrl = 'https://www.xiaohongshu.com/explore/68676ca9000000001202f577';
  
  try {
    console.log('正在测试新的解析端点...');
    console.log('测试URL:', testUrl);
    console.log('');
    
    // 测试新的笔记解析端点
    const response = await axios.post('http://localhost:3000/api/parse-xhs-note-simple', {
      url: testUrl,
      // cookie: 'your_cookie_here' // 可选
    });
    
    console.log('✅ 解析成功！');
    console.log('响应数据:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // 验证关键数据
    const data = response.data;
    console.log('\n=== 关键数据验证 ===');
    console.log('标题:', data.title);
    console.log('点赞数:', data.likes);
    console.log('收藏数:', data.collections);
    console.log('评论数:', data.comments);
    console.log('解析方法:', data.parseMethod);
    console.log('解析时间:', data.parsedAt);
    
    // 测试智能路由解析
    console.log('\n=== 测试智能路由解析 ===');
    const smartResponse = await axios.post('http://localhost:3000/api/parse-xhs-page', {
      url: testUrl
    });
    
    console.log('智能解析结果:');
    console.log('解析方法:', smartResponse.data.parseMethod);
    console.log('数据一致性:', 
      smartResponse.data.likes === data.likes && 
      smartResponse.data.collections === data.collections &&
      smartResponse.data.comments === data.comments ? '✅ 一致' : '❌ 不一致'
    );
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.log('错误状态:', error.response.status);
      console.log('错误数据:', error.response.data);
    }
  }
}

// 运行测试
testNewParser();