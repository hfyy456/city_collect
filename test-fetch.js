const axios = require('axios');
const cheerio = require('cheerio');

async function fetchXhsPage() {
  const url = 'https://www.xiaohongshu.com/explore/68676ca9000000001202f577?xsec_token=AB0xmq3sTe7lWXt9rhsJgZtWBUmfcmfct8VBK0S2AjLJc=&xsec_source=pc_user';
  
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

    console.log('正在获取页面:', url);
    const { data } = await axios.get(url, { headers });
    
    console.log('页面内容长度:', data.length);
    console.log('页面标题:', data.match(/<title>(.*?)<\/title>/)?.[1] || '未找到标题');
    
    // 查找初始状态数据
    const initialStateMatch = data.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/);
    if (initialStateMatch) {
      console.log('找到初始状态数据');
      try {
        const initialState = JSON.parse(initialStateMatch[1]);
        console.log('初始状态数据结构:', Object.keys(initialState));
        
        // 查找笔记数据
        if (initialState.note?.noteDetailMap) {
          const noteData = initialState.note.noteDetailMap;
          const noteId = Object.keys(noteData)[0];
          const note = noteData[noteId]?.note;
          
          if (note) {
            console.log('\n=== 笔记信息 ===');
            console.log('标题:', note.title || note.desc);
            console.log('点赞数:', note.interactInfo?.likedCount || 0);
            console.log('收藏数:', note.interactInfo?.collectedCount || 0);
            console.log('评论数:', note.interactInfo?.commentCount || 0);
            console.log('分享数:', note.interactInfo?.shareCount || 0);
            console.log('作者:', note.user?.nickname);
            console.log('作者ID:', note.user?.redId);
          }
        }
      } catch (parseError) {
        console.log('JSON解析失败:', parseError.message);
      }
    } else {
      console.log('未找到初始状态数据，尝试HTML解析');
      
      const $ = cheerio.load(data);
      const title = $('meta[property="og:title"]').attr('content') || 
                   $('title').text().replace(' - 小红书', '').trim();
      console.log('从HTML提取的标题:', title);
      
      // 搜索脚本中的数据
      const scriptTags = $('script').toArray();
      for (let script of scriptTags) {
        const scriptContent = $(script).html();
        if (scriptContent && scriptContent.includes('interactInfo')) {
          const likeMatch = scriptContent.match(/"likedCount":(\d+)/);
          const collectMatch = scriptContent.match(/"collectedCount":(\d+)/);
          const commentMatch = scriptContent.match(/"commentCount":(\d+)/);
          
          if (likeMatch || collectMatch || commentMatch) {
            console.log('\n=== 从脚本提取的数据 ===');
            console.log('点赞数:', likeMatch ? likeMatch[1] : '未找到');
            console.log('收藏数:', collectMatch ? collectMatch[1] : '未找到');
            console.log('评论数:', commentMatch ? commentMatch[1] : '未找到');
            break;
          }
        }
      }
    }
    
  } catch (error) {
    console.error('获取页面失败:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应头:', error.response.headers);
    }
  }
}

fetchXhsPage();