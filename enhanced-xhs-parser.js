const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

/**
 * 增强版小红书数据解析器
 * 支持完整的 Cookie 和请求头配置
 */
class EnhancedXhsParser {
  constructor(options = {}) {
    this.defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    };
    
    this.cookies = options.cookies || '';
    this.timeout = options.timeout || 30000;
    this.retryCount = options.retryCount || 3;
  }

  /**
   * 设置 Cookies
   * @param {string} cookies - Cookie 字符串
   */
  setCookies(cookies) {
    this.cookies = cookies;
    console.log('✅ Cookies 已设置');
  }

  /**
   * 构建请求头
   * @param {string} url - 目标URL
   * @param {object} customHeaders - 自定义请求头
   */
  buildHeaders(url, customHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...customHeaders };
    
    // 添加 Referer
    if (url.includes('xiaohongshu.com')) {
      headers['Referer'] = 'https://www.xiaohongshu.com/';
    }
    
    // 添加 Cookies
    if (this.cookies) {
      headers['Cookie'] = this.cookies;
    }
    
    return headers;
  }

  /**
   * 发送HTTP请求（带重试机制）
   * @param {string} url - 目标URL
   * @param {object} options - 请求选项
   */
  async makeRequest(url, options = {}) {
    const headers = this.buildHeaders(url, options.headers);
    
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        console.log(`🔄 尝试请求 (${attempt}/${this.retryCount}): ${url}`);
        
        const response = await axios.get(url, {
          headers,
          timeout: this.timeout,
          validateStatus: (status) => status < 500, // 允许 4xx 状态码
          ...options
        });
        
        console.log(`✅ 请求成功 - 状态码: ${response.status}, 内容长度: ${response.data.length}`);
        return response;
        
      } catch (error) {
        console.log(`❌ 请求失败 (${attempt}/${this.retryCount}): ${error.message}`);
        
        if (attempt === this.retryCount) {
          throw error;
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * 解析小红书笔记页面
   * @param {string} url - 笔记URL
   */
  async parseNote(url) {
    try {
      const response = await this.makeRequest(url);
      const $ = cheerio.load(response.data);
      
      console.log('\n=== 开始解析笔记数据 ===');
      
      const result = {
        url,
        title: '',
        author: '',
        authorId: '',
        likes: 0,
        collections: 0,
        comments: 0,
        shares: 0,
        parseMethod: 'unknown',
        success: false,
        parsedAt: new Date().toISOString(),
        rawDataLength: response.data.length
      };
      
      // 1. 尝试从 Meta 标签提取
      console.log('\n--- 方法1: Meta标签解析 ---');
      const metaData = this.extractFromMeta($);
      if (metaData.success) {
        Object.assign(result, metaData);
        result.parseMethod = 'meta-tags';
        result.success = true;
        console.log('✅ Meta标签解析成功');
        return result;
      }
      
      // 2. 尝试从 __INITIAL_STATE__ 提取
      console.log('\n--- 方法2: 初始状态JSON解析 ---');
      const jsonData = this.extractFromInitialState(response.data);
      if (jsonData.success) {
        Object.assign(result, jsonData);
        result.parseMethod = 'json-initial-state';
        result.success = true;
        console.log('✅ 初始状态JSON解析成功');
        return result;
      }
      
      // 3. 尝试从脚本正则匹配提取
      console.log('\n--- 方法3: 脚本正则匹配 ---');
      const regexData = this.extractFromScriptRegex($);
      if (regexData.success) {
        Object.assign(result, regexData);
        result.parseMethod = 'script-regex';
        result.success = true;
        console.log('✅ 脚本正则匹配成功');
        return result;
      }
      
      // 4. 基础信息提取
      console.log('\n--- 方法4: 基础信息提取 ---');
      result.title = $('title').text().replace(' - 小红书', '').trim();
      result.parseMethod = 'basic-fallback';
      result.success = !!result.title;
      
      console.log(result.success ? '⚠️ 仅提取到基础信息' : '❌ 解析失败');
      return result;
      
    } catch (error) {
      console.error('❌ 解析笔记失败:', error.message);
      return {
        url,
        success: false,
        error: error.message,
        parsedAt: new Date().toISOString()
      };
    }
  }

  /**
   * 从 Meta 标签提取数据
   */
  extractFromMeta($) {
    const result = { success: false };
    
    $('meta').each((i, meta) => {
      const $meta = $(meta);
      const name = $meta.attr('name') || $meta.attr('property');
      const content = $meta.attr('content');
      
      if (name && content) {
        switch (name) {
          case 'og:title':
            result.title = content.replace(' - 小红书', '').trim();
            break;
          case 'og:xhs:note_like':
            result.likes = parseInt(content) || 0;
            console.log(`Meta标签 - 点赞: ${content}`);
            result.success = true;
            break;
          case 'og:xhs:note_collect':
            result.collections = parseInt(content) || 0;
            console.log(`Meta标签 - 收藏: ${content}`);
            result.success = true;
            break;
          case 'og:xhs:note_comment':
            result.comments = parseInt(content) || 0;
            console.log(`Meta标签 - 评论: ${content}`);
            result.success = true;
            break;
        }
      }
    });
    
    return result;
  }

  /**
   * 从 __INITIAL_STATE__ 提取数据
   */
  extractFromInitialState(html) {
    const result = { success: false };
    
    try {
      const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/);
      if (stateMatch) {
        const state = JSON.parse(stateMatch[1]);
        console.log('初始状态键:', Object.keys(state));
        
        if (state.note?.noteDetailMap) {
          const noteData = state.note.noteDetailMap;
          const noteIds = Object.keys(noteData);
          
          if (noteIds.length > 0) {
            const note = noteData[noteIds[0]]?.note;
            if (note) {
              result.title = note.title || note.desc || '';
              result.author = note.user?.nickname || '';
              result.authorId = note.user?.redId || '';
              result.likes = note.interactInfo?.likedCount || 0;
              result.collections = note.interactInfo?.collectedCount || 0;
              result.comments = note.interactInfo?.commentCount || 0;
              result.shares = note.interactInfo?.shareCount || 0;
              result.success = true;
              
              console.log(`JSON数据 - 标题: ${result.title}`);
              console.log(`JSON数据 - 作者: ${result.author}`);
              console.log(`JSON数据 - 点赞: ${result.likes}`);
            }
          }
        }
      }
    } catch (error) {
      console.log('JSON解析失败:', error.message);
    }
    
    return result;
  }

  /**
   * 从脚本正则匹配提取数据
   */
  extractFromScriptRegex($) {
    const result = { success: false };
    
    $('script').each((i, script) => {
      const content = $(script).html();
      if (content && content.includes('interactInfo')) {
        const patterns = [
          { name: '点赞', regex: /"likedCount":(\d+)/g, key: 'likes' },
          { name: '收藏', regex: /"collectedCount":(\d+)/g, key: 'collections' },
          { name: '评论', regex: /"commentCount":(\d+)/g, key: 'comments' },
          { name: '分享', regex: /"shareCount":(\d+)/g, key: 'shares' }
        ];
        
        patterns.forEach(pattern => {
          const matches = [...content.matchAll(pattern.regex)];
          if (matches.length > 0) {
            result[pattern.key] = parseInt(matches[0][1]) || 0;
            console.log(`正则匹配 - ${pattern.name}: ${result[pattern.key]}`);
            result.success = true;
          }
        });
        
        if (result.success) {
          return false; // 跳出循环
        }
      }
    });
    
    return result;
  }

  /**
   * 解析用户主页
   * @param {string} url - 用户主页URL
   */
  async parseUser(url) {
    try {
      const response = await this.makeRequest(url);
      const $ = cheerio.load(response.data);
      
      console.log('\n=== 开始解析用户数据 ===');
      
      const result = {
        url,
        nickname: '',
        xiaohongshuId: '',
        followers: '',
        ipLocation: '',
        success: false,
        parsedAt: new Date().toISOString()
      };
      
      // 从页面标题提取昵称
      const title = $('title').text();
      if (title.includes(' - 小红书')) {
        result.nickname = title.replace(' - 小红书', '').trim();
      }
      
      // 尝试从脚本中提取更多信息
      $('script').each((i, script) => {
        const content = $(script).html();
        if (content && content.includes('userPageData')) {
          // 这里可以添加更复杂的用户数据提取逻辑
          result.success = true;
        }
      });
      
      result.success = !!result.nickname;
      console.log(result.success ? '✅ 用户信息解析成功' : '❌ 用户信息解析失败');
      
      return result;
      
    } catch (error) {
      console.error('❌ 解析用户失败:', error.message);
      return {
        url,
        success: false,
        error: error.message,
        parsedAt: new Date().toISOString()
      };
    }
  }

  /**
   * 保存调试信息
   * @param {string} url - URL
   * @param {string} html - HTML内容
   */
  saveDebugInfo(url, html) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `xhs_debug_${timestamp}.html`;
    
    fs.writeFileSync(filename, html);
    console.log(`🔍 调试信息已保存到: ${filename}`);
    
    // 保存URL信息
    const urlInfo = {
      url,
      timestamp,
      htmlLength: html.length
    };
    
    fs.writeFileSync(`xhs_debug_${timestamp}.json`, JSON.stringify(urlInfo, null, 2));
  }
}

// 使用示例
async function example() {
  console.log('=== 增强版小红书解析器示例 ===\n');
  
  // 创建解析器实例
  const parser = new EnhancedXhsParser({
    timeout: 30000,
    retryCount: 3
  });
  
  // 设置 Cookies（重要！）
  const cookies = `
    // 在这里粘贴你的小红书 Cookies
    // 例如: web_session=xxx; xsecappid=xxx; a1=xxx;
    // 获取方法：
    // 1. 打开小红书网站并登录
    // 2. 按F12打开开发者工具
    // 3. 在Network标签页找到任意请求
    // 4. 复制Request Headers中的Cookie值
  `;
  
  if (cookies.trim() && !cookies.includes('在这里粘贴')) {
    parser.setCookies(cookies.trim());
  } else {
    console.log('⚠️ 警告: 未设置 Cookies，可能无法获取完整数据');
    console.log('请在代码中设置有效的 Cookies 以获得最佳效果');
  }
  
  // 测试笔记解析
  const noteUrl = 'https://www.xiaohongshu.com/explore/68676ca9000000001202f577';
  console.log('\n📝 测试笔记解析...');
  const noteResult = await parser.parseNote(noteUrl);
  
  console.log('\n=== 笔记解析结果 ===');
  console.log(JSON.stringify(noteResult, null, 2));
  
  // 如果需要调试，保存HTML
  if (!noteResult.success) {
    console.log('\n🔍 解析失败，建议检查 Cookies 设置');
  }
}

// 导出类和示例函数
module.exports = { EnhancedXhsParser, example };

// 如果直接运行此文件，执行示例
if (require.main === module) {
  example().catch(console.error);
}