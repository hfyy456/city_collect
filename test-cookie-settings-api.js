/**
 * 测试Cookie和设置管理API
 */

const axios = require('axios');

const baseUrl = 'http://localhost:3005';

class CookieSettingsApiTester {
  async testAllEndpoints() {
    console.log('🍪 测试Cookie和设置管理API\n');
    
    try {
      await this.testCookieManagement();
      await this.testSettingsManagement();
      
      console.log('\n✅ 所有API测试完成！');
      
    } catch (error) {
      console.error('❌ API测试失败:', error.message);
    }
  }

  async testCookieManagement() {
    console.log('1. Cookie管理测试');
    console.log('==================');
    
    // 创建测试Cookie
    const testCookie = {
      name: 'test_xhs_session',
      platform: 'xiaohongshu',
      value: 'test_cookie_value_12345',
      description: '测试用的小红书Cookie',
      domain: '.xiaohongshu.com',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
      tags: ['test', 'xiaohongshu']
    };
    
    try {
      // 创建Cookie
      console.log('创建Cookie...');
      const createResponse = await axios.post(`${baseUrl}/api/cookies`, testCookie);
      const cookieId = createResponse.data._id;
      console.log(`✅ Cookie创建成功: ${cookieId}`);
      
      // 获取Cookie列表
      console.log('\n获取Cookie列表...');
      const listResponse = await axios.get(`${baseUrl}/api/cookies`);
      console.log(`✅ 找到 ${listResponse.data.cookies.length} 个Cookie`);
      
      // 获取单个Cookie
      console.log('\n获取单个Cookie...');
      const getResponse = await axios.get(`${baseUrl}/api/cookies/${cookieId}`);
      console.log(`✅ Cookie详情: ${getResponse.data.name} (${getResponse.data.status})`);
      
      // 记录使用情况
      console.log('\n记录Cookie使用...');
      await axios.post(`${baseUrl}/api/cookies/${cookieId}/usage`, { success: true });
      await axios.post(`${baseUrl}/api/cookies/${cookieId}/usage`, { success: true });
      await axios.post(`${baseUrl}/api/cookies/${cookieId}/usage`, { success: false });
      console.log('✅ 使用记录已更新');
      
      // 验证Cookie
      console.log('\n验证Cookie...');
      await axios.post(`${baseUrl}/api/cookies/${cookieId}/validate`, {
        method: 'api',
        result: 'validation successful'
      });
      console.log('✅ Cookie验证完成');
      
      // 获取平台Cookie
      console.log('\n获取平台Cookie...');
      const platformResponse = await axios.get(`${baseUrl}/api/cookies/platform/xiaohongshu`);
      console.log(`✅ 小红书平台有 ${platformResponse.data.length} 个Cookie`);
      
      // 获取随机Cookie
      console.log('\n获取随机Cookie...');
      const randomResponse = await axios.get(`${baseUrl}/api/cookies/random/xiaohongshu`);
      console.log(`✅ 随机Cookie: ${randomResponse.data.name}`);
      
      // 获取统计信息
      console.log('\n获取Cookie统计...');
      const statsResponse = await axios.get(`${baseUrl}/api/cookies/stats`);
      console.log(`✅ 总计 ${statsResponse.data.total.total} 个Cookie，${statsResponse.data.total.active} 个活跃`);
      
      // 删除测试Cookie
      console.log('\n删除测试Cookie...');
      await axios.delete(`${baseUrl}/api/cookies/${cookieId}`);
      console.log('✅ 测试Cookie已删除');
      
    } catch (error) {
      console.log('❌ Cookie管理测试失败:', error.response?.data?.error || error.message);
    }
  }

  async testSettingsManagement() {
    console.log('\n2. 设置管理测试');
    console.log('================');
    
    try {
      // 初始化默认设置
      console.log('初始化默认设置...');
      await axios.post(`${baseUrl}/api/settings/initialize`);
      console.log('✅ 默认设置初始化完成');
      
      // 获取所有设置
      console.log('\n获取所有设置...');
      const allSettingsResponse = await axios.get(`${baseUrl}/api/settings`);
      console.log(`✅ 找到 ${allSettingsResponse.data.settings.length} 个设置`);
      
      // 获取分类设置
      console.log('\n获取系统设置...');
      const systemSettingsResponse = await axios.get(`${baseUrl}/api/settings?category=system`);
      console.log(`✅ 系统设置: ${systemSettingsResponse.data.settings.length} 个`);
      
      // 创建自定义设置
      console.log('\n创建自定义设置...');
      const customSetting = {
        value: 'test_value',
        description: '测试设置',
        modifiedBy: 'test_user'
      };
      
      const createSettingResponse = await axios.post(
        `${baseUrl}/api/settings/user/test_setting`, 
        customSetting
      );
      console.log(`✅ 自定义设置创建成功: ${createSettingResponse.data.fullKey}`);
      
      // 获取设置值
      console.log('\n获取设置值...');
      const valueResponse = await axios.get(`${baseUrl}/api/settings/user/test_setting/value`);
      console.log(`✅ 设置值: ${valueResponse.data.value}`);
      
      // 更新设置值
      console.log('\n更新设置值...');
      await axios.put(`${baseUrl}/api/settings/user/test_setting`, {
        value: 'updated_test_value',
        modifiedBy: 'test_user',
        reason: '测试更新'
      });
      console.log('✅ 设置值已更新');
      
      // 获取设置历史
      console.log('\n获取设置历史...');
      const historyResponse = await axios.get(`${baseUrl}/api/settings/user/test_setting/history`);
      console.log(`✅ 设置历史: ${historyResponse.data.history.length} 条记录`);
      
      // 重置为默认值
      console.log('\n重置设置...');
      await axios.post(`${baseUrl}/api/settings/user/test_setting/reset`, {
        modifiedBy: 'test_user'
      });
      console.log('✅ 设置已重置');
      
      // 批量更新设置
      console.log('\n批量更新设置...');
      const batchSettings = [
        { category: 'user', key: 'batch_test_1', value: 'value1' },
        { category: 'user', key: 'batch_test_2', value: 'value2' },
        { category: 'user', key: 'batch_test_3', value: 123 }
      ];
      
      const batchResponse = await axios.post(`${baseUrl}/api/settings/batch`, {
        settings: batchSettings,
        modifiedBy: 'test_user',
        reason: '批量测试'
      });
      console.log(`✅ 批量更新完成: ${batchResponse.data.results.success} 成功`);
      
      // 获取分类列表
      console.log('\n获取分类列表...');
      const categoriesResponse = await axios.get(`${baseUrl}/api/settings/categories`);
      console.log(`✅ 设置分类: ${categoriesResponse.data.join(', ')}`);
      
      // 测试导出功能
      console.log('\n测试导出设置...');
      const exportResponse = await axios.get(`${baseUrl}/api/settings/export?category=user`);
      console.log(`✅ 导出了 ${exportResponse.data.length} 个用户设置`);
      
      // 清理测试数据
      console.log('\n清理测试数据...');
      await axios.delete(`${baseUrl}/api/settings/user/test_setting`);
      await axios.delete(`${baseUrl}/api/settings/user/batch_test_1`);
      await axios.delete(`${baseUrl}/api/settings/user/batch_test_2`);
      await axios.delete(`${baseUrl}/api/settings/user/batch_test_3`);
      console.log('✅ 测试数据已清理');
      
    } catch (error) {
      console.log('❌ 设置管理测试失败:', error.response?.data?.error || error.message);
    }
  }

  async testIntegrationScenarios() {
    console.log('\n3. 集成场景测试');
    console.log('================');
    
    try {
      // 场景1: 爬虫配置管理
      console.log('场景1: 爬虫配置管理...');
      
      // 设置爬虫参数
      await axios.post(`${baseUrl}/api/settings/scraping/delay`, {
        value: 3000,
        description: '爬虫请求延迟'
      });
      
      // 添加Cookie
      const scrapingCookie = {
        name: 'scraping_session',
        platform: 'xiaohongshu',
        value: 'scraping_cookie_value',
        description: '爬虫专用Cookie'
      };
      
      const cookieResponse = await axios.post(`${baseUrl}/api/cookies`, scrapingCookie);
      const cookieId = cookieResponse.data._id;
      
      // 获取爬虫配置
      const delayValue = await axios.get(`${baseUrl}/api/settings/scraping/delay/value`);
      const availableCookies = await axios.get(`${baseUrl}/api/cookies/valid/xiaohongshu`);
      
      console.log(`✅ 爬虫延迟: ${delayValue.data.value}ms`);
      console.log(`✅ 可用Cookie: ${availableCookies.data.length} 个`);
      
      // 清理
      await axios.delete(`${baseUrl}/api/cookies/${cookieId}`);
      await axios.delete(`${baseUrl}/api/settings/scraping/delay`);
      
      console.log('✅ 集成场景测试完成');
      
    } catch (error) {
      console.log('❌ 集成场景测试失败:', error.response?.data?.error || error.message);
    }
  }
}

// 运行测试
async function runTests() {
  const tester = new CookieSettingsApiTester();
  
  try {
    await tester.testAllEndpoints();
    await tester.testIntegrationScenarios();
  } catch (error) {
    console.error('测试运行失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests();
}

module.exports = CookieSettingsApiTester;