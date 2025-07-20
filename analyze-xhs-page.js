const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function analyzeXhsPage() {
  const url = 'https://www.xiaohongshu.com/explore/68676ca9000000001202f577?xsec_token=AB0xmq3sTe7lWXt9rhsJgZtWBUmfcmfct8VBK0S2AjLJc=&xsec_source=pc_user'; // 替换为实际URL
  
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
    };

    console.log('正在分析小红书页面结构...');
    const { data } = await axios.get(url, { headers });
    
    // 保存原始HTML到文件
    fs.writeFileSync('xhs_page_raw.html', data);
    console.log('✅ 原始HTML已保存到 xhs_page_raw.html');
    
    const $ = cheerio.load(data);
    
    console.log('\n=== 页面基本信息 ===');
    console.log('标题:', $('title').text());
    console.log('页面长度:', data.length);
    
    // 查找所有可能包含数据的脚本
    console.log('\n=== 脚本分析 ===');
    const scripts = $('script').toArray();
    
    for (let i = 0; i < scripts.length; i++) {
      const script = $(scripts[i]);
      const content = script.html();
      
      if (content) {
        console.log(`\n--- 脚本 ${i + 1} ---`);
        console.log('长度:', content.length);
        
        // 检查是否包含关键数据
        const hasInitialState = content.includes('__INITIAL_STATE__');
        const hasInteractInfo = content.includes('interactInfo');
        const hasLikedCount = content.includes('likedCount');
        const hasNoteData = content.includes('noteDetailMap');
        
        console.log('包含 __INITIAL_STATE__:', hasInitialState);
        console.log('包含 interactInfo:', hasInteractInfo);
        console.log('包含 likedCount:', hasLikedCount);
        console.log('包含 noteDetailMap:', hasNoteData);
        
        if (hasInitialState) {
          console.log('🎯 找到初始状态脚本！');
          // 提取初始状态数据
          const stateMatch = content.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/);
          if (stateMatch) {
            try {
              const state = JSON.parse(stateMatch[1]);
              console.log('初始状态键:', Object.keys(state));
              
              // 保存初始状态到文件
              fs.writeFileSync('xhs_initial_state.json', JSON.stringify(state, null, 2));
              console.log('✅ 初始状态数据已保存到 xhs_initial_state.json');
              
            } catch (e) {
              console.log('❌ 初始状态JSON解析失败');
            }
          }
        }
        
        if (hasInteractInfo && hasLikedCount) {
          console.log('🎯 找到交互数据脚本！');
          
          // 尝试提取数据
          const patterns = [
            /"likedCount":(\d+)/g,
            /"collectedCount":(\d+)/g,
            /"commentCount":(\d+)/g,
            /"shareCount":(\d+)/g
          ];
          
          patterns.forEach((pattern, index) => {
            const matches = [...content.matchAll(pattern)];
            const labels = ['点赞', '收藏', '评论', '分享'];
            console.log(`${labels[index]}数据匹配:`, matches.map(m => m[1]));
          });
        }
        
        // 如果脚本很长，只显示前200字符
        if (content.length > 200) {
          console.log('内容预览:', content.substring(0, 200) + '...');
        } else {
          console.log('完整内容:', content);
        }
      }
    }
    
    // 查找meta标签
    console.log('\n=== Meta标签信息 ===');
    const metaTags = $('meta').toArray();
    metaTags.forEach((meta, index) => {
      const $meta = $(meta);
      const name = $meta.attr('name') || $meta.attr('property');
      const content = $meta.attr('content');
      
      if (name && content) {
        console.log(`${name}: ${content}`);
      }
    });
    
    console.log('\n=== 分析完成 ===');
    console.log('请检查生成的文件：');
    console.log('- xhs_page_raw.html (原始HTML)');
    console.log('- xhs_initial_state.json (如果找到初始状态数据)');
    
  } catch (error) {
    console.error('分析失败:', error.message);
  }
}

analyzeXhsPage();