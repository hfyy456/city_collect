/**
 * 测试新的独立期数模型API
 */

const axios = require('axios');

const baseUrl = 'http://localhost:3005';

class PeriodApiTester {
  async testAllEndpoints() {
    console.log('🧪 测试新的期数API端点\n');
    
    try {
      await this.testGetPeriods();
      await this.testGetPeriodStats();
      await this.testGetPeriodInfluencers();
      await this.testCreatePeriod();
      
      console.log('\n✅ 所有API测试完成！');
      
    } catch (error) {
      console.error('❌ API测试失败:', error.message);
    }
  }

  async testGetPeriods() {
    console.log('1. 测试获取所有期数');
    console.log('===================');
    
    try {
      const response = await axios.get(`${baseUrl}/api/periods-new`);
      console.log('✅ 获取期数成功');
      console.log(`   找到 ${response.data.periods.length} 个期数:`);
      
      response.data.periods.forEach(period => {
        console.log(`   - ${period.name}: ${period.displayName} (${period.status})`);
      });
      
    } catch (error) {
      console.log('❌ 获取期数失败:', error.response?.data || error.message);
    }
  }

  async testGetPeriodStats() {
    console.log('\n2. 测试期数统计');
    console.log('================');
    
    const testPeriods = ['7.22', '8.11', '202509'];
    
    for (const periodName of testPeriods) {
      try {
        const response = await axios.get(`${baseUrl}/api/periods-new/${periodName}/stats`);
        const stats = response.data.stats;
        
        console.log(`✅ 期数 "${periodName}" 统计:`);
        console.log(`   达人数量: ${stats.totalInfluencers || 0}`);
        console.log(`   总投入: ¥${stats.totalInvestment || 0}`);
        console.log(`   总互动: ${stats.totalEngagement || 0}`);
        console.log(`   ROI: ${stats.roi?.toFixed(2) || 0}%`);
        
      } catch (error) {
        console.log(`❌ 期数 "${periodName}" 统计失败:`, error.response?.data?.error || error.message);
      }
    }
  }

  async testGetPeriodInfluencers() {
    console.log('\n3. 测试期数达人列表');
    console.log('==================');
    
    const testPeriod = '7.22';
    
    try {
      const response = await axios.get(`${baseUrl}/api/periods-new/${testPeriod}/influencers`);
      const influencers = response.data.influencers;
      
      console.log(`✅ 期数 "${testPeriod}" 达人列表:`);
      console.log(`   共 ${influencers.length} 个达人`);
      
      influencers.slice(0, 5).forEach((relation, index) => {
        console.log(`   关联记录 ${index + 1}:`, JSON.stringify(relation, null, 2).substring(0, 200) + '...');
        
        if (relation.influencer) {
          const influencer = relation.influencer;
          console.log(`   - ${influencer.nickname}: ¥${relation.fee || 0}, 状态: ${relation.status}`);
          console.log(`     点赞: ${relation.performance.likes}, 评论: ${relation.performance.comments}, 收藏: ${relation.performance.collections}`);
        } else {
          console.log(`   - 达人信息为空: ¥${relation.fee || 0}, 状态: ${relation.status}`);
        }
      });
      
      if (influencers.length > 5) {
        console.log(`   ... 还有 ${influencers.length - 5} 个达人`);
      }
      
    } catch (error) {
      console.log(`❌ 获取期数达人失败:`, error.response?.data?.error || error.message);
    }
  }

  async testCreatePeriod() {
    console.log('\n4. 测试创建新期数');
    console.log('================');
    
    const newPeriod = {
      name: 'TEST_2024_Q4',
      displayName: '2024年第四季度测试活动',
      description: '这是一个测试期数，用于验证API功能',
      startDate: '2024-10-01',
      endDate: '2024-12-31',
      status: 'planning',
      budget: {
        total: 50000,
        used: 0
      },
      targets: {
        influencerCount: 20,
        totalReach: 1000000
      }
    };
    
    try {
      const response = await axios.post(`${baseUrl}/api/periods-new`, newPeriod);
      console.log('✅ 创建期数成功:');
      console.log(`   期数名称: ${response.data.name}`);
      console.log(`   显示名称: ${response.data.displayName}`);
      console.log(`   状态: ${response.data.status}`);
      console.log(`   预算: ¥${response.data.budget.total}`);
      
      // 测试更新期数
      await this.testUpdatePeriod(response.data._id);
      
      // 测试删除期数
      await this.testDeletePeriod(response.data._id);
      
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.error === '期数名称已存在') {
        console.log('⚠️ 期数已存在，跳过创建测试');
      } else {
        console.log('❌ 创建期数失败:', error.response?.data?.error || error.message);
      }
    }
  }

  async testUpdatePeriod(periodId) {
    console.log('\n5. 测试更新期数');
    console.log('================');
    
    const updateData = {
      status: 'active',
      description: '已更新的测试期数描述',
      budget: {
        total: 60000,
        used: 5000
      }
    };
    
    try {
      const response = await axios.put(`${baseUrl}/api/periods-new/${periodId}`, updateData);
      console.log('✅ 更新期数成功:');
      console.log(`   状态: ${response.data.status}`);
      console.log(`   预算使用: ¥${response.data.budget.used} / ¥${response.data.budget.total}`);
      
    } catch (error) {
      console.log('❌ 更新期数失败:', error.response?.data?.error || error.message);
    }
  }

  async testDeletePeriod(periodId) {
    console.log('\n6. 测试删除期数');
    console.log('================');
    
    try {
      await axios.delete(`${baseUrl}/api/periods-new/${periodId}`);
      console.log('✅ 删除期数成功');
      
    } catch (error) {
      console.log('❌ 删除期数失败:', error.response?.data?.error || error.message);
    }
  }

  async testOldVsNewComparison() {
    console.log('\n7. 新旧API对比测试');
    console.log('==================');
    
    try {
      // 测试旧API
      console.log('测试旧API...');
      const oldStart = Date.now();
      const oldResponse = await axios.get(`${baseUrl}/api/periods`);
      const oldTime = Date.now() - oldStart;
      console.log(`旧API响应时间: ${oldTime}ms, 期数数量: ${oldResponse.data.length}`);
      
      // 测试新API
      console.log('测试新API...');
      const newStart = Date.now();
      const newResponse = await axios.get(`${baseUrl}/api/periods-new`);
      const newTime = Date.now() - newStart;
      console.log(`新API响应时间: ${newTime}ms, 期数数量: ${newResponse.data.periods.length}`);
      
      // 对比结果
      const improvement = oldTime > 0 ? ((oldTime - newTime) / oldTime * 100).toFixed(1) : 0;
      console.log(`性能对比: ${improvement > 0 ? '提升' : '下降'} ${Math.abs(improvement)}%`);
      
    } catch (error) {
      console.log('❌ 对比测试失败:', error.message);
    }
  }
}

// 运行测试
async function runTests() {
  const tester = new PeriodApiTester();
  
  try {
    await tester.testAllEndpoints();
    await tester.testOldVsNewComparison();
  } catch (error) {
    console.error('测试运行失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests();
}

module.exports = PeriodApiTester;