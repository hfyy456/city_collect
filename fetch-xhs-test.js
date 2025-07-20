const axios = require('axios');
const cheerio = require('cheerio');

async function testXhsParsing() {
  console.log('=== 小红书页面解析测试 ===\n');
  
  // 你需要提供完整的小红书链接
  console.log('请提供完整的小红书链接，格式如下：');
  console.log('笔记链接: https://www.xiaohongshu.com/explore/xxxxxxxxx');
  console.log('用户主页: https://www.xiaohongshu.com/user/profile/xxxxxxxxx');
  console.log('');
  
  // 如果你有完整的链接，请替换下面的URL
  const testUrl = 'https://www.xiaohongshu.com/explore/68676ca9000000001202f577?xsec_token=AB0xmq3sTe7lWXt9rhsJgZtWBUmfcmfct8VBK0S2AjLJc=&xsec_source=pc_user';
  
  console.log('当前测试URL:', testUrl);
  console.log('');
  
  // 测试我们的解析逻辑
  await testParseLogic(testUrl);
}

async function testParseLogic(url) {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    console.log('正在获取页面内容...');
    const response = await axios.get(url, { 
      headers,
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // 接受所有小于500的状态码
      }
    });
    
    console.log('响应状态:', response.status);
    console.log('响应头 Content-Type:', response.headers['content-type']);
    console.log('页面内容长度:', response.data.length);
    
    if (response.status === 200) {
      await parsePageContent(response.data, url);
    } else {
      console.log('页面返回非200状态，可能需要登录或Cookie');
    }
    
  } catch (error) {
    console.error('请求失败:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('DNS解析失败，请检查网络连接');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('连接被拒绝');
    } else if (error.response) {
      console.log('服务器响应状态:', error.response.status);
      console.log('响应数据:', error.response.data.substring(0, 200) + '...');
    }
  }
}

async function parsePageContent(html, url) {
  console.log('\n=== 开始解析页面内容 ===');
  
  const $ = cheerio.load(html);
  
  // 获取页面标题
  const title = $('title').text();
  console.log('页面标题:', title);
  
  // 查找初始状态数据
  const initialStateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/);
  if (initialStateMatch) {
    console.log('\n✅ 找到 window.__INITIAL_STATE__ 数据');
    try {
      const initialState = JSON.parse(initialStateMatch[1]);
      console.log('数据结构键:', Object.keys(initialState));
      
      // 检查是否为笔记页面
      if (initialState.note?.noteDetailMap) {
        console.log('\n📝 检测到笔记数据');
        const noteData = initialState.note.noteDetailMap;
        const noteIds = Object.keys(noteData);
        console.log('笔记ID数量:', noteIds.length);
        
        if (noteIds.length > 0) {
          const noteId = noteIds[0];
          const note = noteData[noteId]?.note;
          
          if (note) {
            console.log('\n=== 笔记详细信息 ===');
            console.log('笔记ID:', noteId);
            console.log('标题:', note.title || note.desc || '无标题');
            console.log('点赞数:', note.interactInfo?.likedCount || 0);
            console.log('收藏数:', note.interactInfo?.collectedCount || 0);
            console.log('评论数:', note.interactInfo?.commentCount || 0);
            console.log('分享数:', note.interactInfo?.shareCount || 0);
            
            if (note.user) {
              console.log('\n=== 作者信息 ===');
              console.log('作者昵称:', note.user.nickname);
              console.log('作者ID:', note.user.redId);
              console.log('作者主页:', `https://www.xiaohongshu.com/user/profile/${note.user.redId}`);
            }
          }
        }
      }
      
      // 检查是否为用户页面
      if (initialState.user?.userPageData) {
        console.log('\n👤 检测到用户数据');
        const userData = initialState.user.userPageData;
        console.log('\n=== 用户详细信息 ===');
        console.log('用户昵称:', userData.nickname);
        console.log('小红书ID:', userData.redId);
        console.log('粉丝数:', userData.fans);
        console.log('获赞与收藏:', userData.liked);
        console.log('IP属地:', userData.ipLocation);
      }
      
    } catch (parseError) {
      console.log('❌ JSON解析失败:', parseError.message);
      console.log('尝试HTML解析...');
      await fallbackHtmlParsing($, html);
    }
  } else {
    console.log('❌ 未找到 window.__INITIAL_STATE__ 数据');
    console.log('尝试HTML解析...');
    await fallbackHtmlParsing($, html);
  }
}

async function fallbackHtmlParsing($, html) {
  console.log('\n=== HTML解析模式 ===');
  
  // 从meta标签获取信息
  const ogTitle = $('meta[property="og:title"]').attr('content');
  const ogDescription = $('meta[property="og:description"]').attr('content');
  
  console.log('OG标题:', ogTitle);
  console.log('OG描述:', ogDescription);
  
  // 搜索脚本中的数据模式
  const scriptTags = $('script').toArray();
  console.log('脚本标签数量:', scriptTags.length);
  
  let foundData = false;
  for (let i = 0; i < scriptTags.length; i++) {
    const scriptContent = $(scriptTags[i]).html();
    if (scriptContent && scriptContent.includes('interactInfo')) {
      console.log(`\n在第${i+1}个脚本中找到交互数据`);
      
      const likeMatch = scriptContent.match(/"likedCount":(\d+)/);
      const collectMatch = scriptContent.match(/"collectedCount":(\d+)/);
      const commentMatch = scriptContent.match(/"commentCount":(\d+)/);
      const shareMatch = scriptContent.match(/"shareCount":(\d+)/);
      
      if (likeMatch || collectMatch || commentMatch) {
        console.log('点赞数:', likeMatch ? likeMatch[1] : '未找到');
        console.log('收藏数:', collectMatch ? collectMatch[1] : '未找到');
        console.log('评论数:', commentMatch ? commentMatch[1] : '未找到');
        console.log('分享数:', shareMatch ? shareMatch[1] : '未找到');
        foundData = true;
        break;
      }
    }
  }
  
  if (!foundData) {
    console.log('❌ 未能从HTML中提取到交互数据');
    console.log('可能需要Cookie或页面结构已更改');
  }
}

// 运行测试
testXhsParsing().catch(console.error);