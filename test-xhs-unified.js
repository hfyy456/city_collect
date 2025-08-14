/**
 * 统一的小红书解析测试套件
 * 整合了所有解析功能的测试
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

class XhsTestSuite {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.testUrls = {
      note: 'https://www.xiaohongshu.com/explore/68676ca9000000001202f577',
      user: 'https://www.xiaohongshu.com/user/profile/xxxxxxxxx'
    };
  }

  async runAllTests() {
    console.log('=== 小红书解析测试套件 ===\n');
    
    await this.testDirectParsing();
    await this.testApiEndpoints();
    await this.testMetaParsing();
    await this.testHtmlFallback();
  }

  async testDirectParsing() {
    console.log('1. 直接页面解析测试');
    console.log('========================');
    
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

      const response = await axios.get(this.testUrls.note, { 
        headers,
        timeout: 10000,
        validateStatus: status => status < 500
      });
      
      console.log('✅ 页面获取成功');
      console.log(`   状态码: ${response.status}`);
      console.log(`   内容长度: ${response.data.length}`);
      
      await this.parsePageContent(response.data);
      
    } catch (error) {
      console.log('❌ 直接解析失败:', error.message);
    }
    
    console.log('\n');
  }

  async testApiEndpoints() {
    console.log('2. API端点测试');
    console.log('================');
    
    const endpoints = [
      { name: '笔记解析', path: '/api/parse-xhs-note-simple' },
      { name: '智能路由', path: '/api/parse-xhs-page' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`测试 ${endpoint.name}...`);
        
        const response = await axios.post(`${this.baseUrl}${endpoint.path}`, {
          url: this.testUrls.note
        });
        
        console.log('✅ 成功');
        console.log(`   解析方法: ${response.data.parseMethod}`);
        console.log(`   标题: ${response.data.title}`);
        console.log(`   点赞: ${response.data.likes}`);
        console.log(`   收藏: ${response.data.collections}`);
        console.log(`   评论: ${response.data.comments}`);
        
      } catch (error) {
        console.log(`❌ ${endpoint.name} 失败:`, error.message);
      }
    }
    
    console.log('\n');
  }

  async testMetaParsing() {
    console.log('3. Meta标签解析测试');
    console.log('====================');
    
    try {
      // 如果有保存的HTML文件，使用它进行测试
      if (fs.existsSync('xhs_page_raw.html')) {
        const html = fs.readFileSync('xhs_page_raw.html', 'utf8');
        const $ = cheerio.load(html);
        
        console.log('使用本地HTML文件测试...');
        
        // 测试各种Meta标签选择器
        const metaTests = [
          { name: '小红书专用Meta', selector: 'meta[property*="xhs"]' },
          { name: 'OG标签', selector: 'meta[property^="og:"]' },
          { name: '通用Meta', selector: 'meta[name]' }
        ];
        
        metaTests.forEach(test => {
          const metas = $(test.selector);
          console.log(`${test.name}: 找到 ${metas.length} 个标签`);
          
          metas.each((i, el) => {
            const $el = $(el);
            const prop = $el.attr('property') || $el.attr('name');
            const content = $el.attr('content');
            if (prop && content && (prop.includes('like') || prop.includes('collect') || prop.includes('comment'))) {
              console.log(`   ${prop}: ${content}`);
            }
          });
        });
        
      } else {
        console.log('⚠️ 未找到本地HTML文件，跳过Meta解析测试');
      }
      
    } catch (error) {
      console.log('❌ Meta解析测试失败:', error.message);
    }
    
    console.log('\n');
  }

  async testHtmlFallback() {
    console.log('4. HTML回退解析测试');
    console.log('====================');
    
    try {
      // 模拟没有初始状态数据的情况
      const mockHtml = `
        <html>
          <head>
            <title>测试笔记 - 小红书</title>
            <meta property="og:title" content="测试笔记标题" />
            <meta property="og:description" content="测试描述" />
          </head>
          <body>
            <script>
              var data = {"interactInfo":{"likedCount":123,"collectedCount":456,"commentCount":789}};
            </script>
          </body>
        </html>
      `;
      
      const $ = cheerio.load(mockHtml);
      
      console.log('测试HTML回退解析...');
      console.log('OG标题:', $('meta[property="og:title"]').attr('content'));
      console.log('OG描述:', $('meta[property="og:description"]').attr('content'));
      
      // 从脚本中提取数据
      const scriptContent = $('script').html();
      if (scriptContent) {
        const likeMatch = scriptContent.match(/"likedCount":(\d+)/);
        const collectMatch = scriptContent.match(/"collectedCount":(\d+)/);
        const commentMatch = scriptContent.match(/"commentCount":(\d+)/);
        
        console.log('从脚本提取:');
        console.log('   点赞数:', likeMatch ? likeMatch[1] : '未找到');
        console.log('   收藏数:', collectMatch ? collectMatch[1] : '未找到');
        console.log('   评论数:', commentMatch ? commentMatch[1] : '未找到');
      }
      
      console.log('✅ HTML回退解析测试完成');
      
    } catch (error) {
      console.log('❌ HTML回退解析失败:', error.message);
    }
    
    console.log('\n');
  }

  async parsePageContent(html) {
    const $ = cheerio.load(html);
    
    // 查找初始状态数据
    const initialStateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/);
    if (initialStateMatch) {
      try {
        const initialState = JSON.parse(initialStateMatch[1]);
        console.log('   找到初始状态数据');
        console.log('   数据结构:', Object.keys(initialState).join(', '));
        
        // 检查笔记数据
        if (initialState.note?.noteDetailMap) {
          const noteData = initialState.note.noteDetailMap;
          const noteId = Object.keys(noteData)[0];
          const note = noteData[noteId]?.note;
          
          if (note) {
            console.log('   笔记信息:');
            console.log(`     标题: ${note.title || note.desc || '无标题'}`);
            console.log(`     点赞: ${note.interactInfo?.likedCount || 0}`);
            console.log(`     收藏: ${note.interactInfo?.collectedCount || 0}`);
            console.log(`     评论: ${note.interactInfo?.commentCount || 0}`);
          }
        }
        
      } catch (parseError) {
        console.log('   JSON解析失败，使用HTML解析');
      }
    } else {
      console.log('   未找到初始状态数据');
    }
  }
}

// 运行测试
if (require.main === module) {
  const testSuite = new XhsTestSuite();
  testSuite.runAllTests().catch(console.error);
}

module.exports = XhsTestSuite;