/**
 * 测试报价更新问题的修复效果
 */

const axios = require('axios');

const baseUrl = 'http://localhost:3005';

async function testFeeUpdateFix() {
  console.log('🧪 测试报价更新问题修复\n');
  
  try {
    // 1. 获取一个有期数数据的达人
    console.log('1. 获取达人列表...');
    const darensResponse = await axios.get(`${baseUrl}/api/darens`);
    const darens = darensResponse.data.items || darensResponse.data;
    
    const darenWithPeriods = darens.find(d => d.periodData && d.periodData.length > 0);
    if (!darenWithPeriods) {
      console.log('❌ 没有找到有期数数据的达人');
      return;
    }
    
    console.log(`✅ 找到测试达人: ${darenWithPeriods.nickname}`);
    console.log(`   期数数量: ${darenWithPeriods.periodData.length}`);
    
    const testPeriod = darenWithPeriods.periodData[0];
    console.log(`\n📋 测试期数: ${testPeriod.period}`);
    console.log(`   原始报价: ${testPeriod.fee}`);
    console.log(`   原始点赞: ${testPeriod.likes}`);
    console.log(`   原始评论: ${testPeriod.comments}`);
    console.log(`   原始收藏: ${testPeriod.collections}`);
    
    // 2. 模拟只更新作品数据的请求
    const updateData = {
      likes: 200,
      comments: 35,
      collections: 90
      // 注意：故意不包含 fee 字段
    };
    
    console.log(`\n🔄 更新作品数据:`, updateData);
    
    // 3. 发送更新请求
    const updateResponse = await axios.put(
      `${baseUrl}/api/darens/${darenWithPeriods._id}/periods/${testPeriod.period}`,
      updateData
    );
    
    console.log(`✅ 更新请求成功`);
    
    // 4. 获取更新后的数据
    const updatedDarenResponse = await axios.get(`${baseUrl}/api/darens/${darenWithPeriods._id}`);
    const updatedDaren = updatedDarenResponse.data;
    const updatedPeriod = updatedDaren.periodData.find(p => p.period === testPeriod.period);
    
    console.log(`\n📊 更新后的数据:`);
    console.log(`   期数: ${updatedPeriod.period}`);
    console.log(`   报价: ${updatedPeriod.fee} (原值: ${testPeriod.fee})`);
    console.log(`   点赞: ${updatedPeriod.likes} (更新为: ${updateData.likes})`);
    console.log(`   评论: ${updatedPeriod.comments} (更新为: ${updateData.comments})`);
    console.log(`   收藏: ${updatedPeriod.collections} (更新为: ${updateData.collections})`);
    
    // 5. 验证修复效果
    console.log(`\n🔍 验证结果:`);
    
    const feePreserved = updatedPeriod.fee === testPeriod.fee;
    const likesUpdated = updatedPeriod.likes === updateData.likes;
    const commentsUpdated = updatedPeriod.comments === updateData.comments;
    const collectionsUpdated = updatedPeriod.collections === updateData.collections;
    
    console.log(`   报价保持不变: ${feePreserved ? '✅' : '❌'}`);
    console.log(`   点赞正确更新: ${likesUpdated ? '✅' : '❌'}`);
    console.log(`   评论正确更新: ${commentsUpdated ? '✅' : '❌'}`);
    console.log(`   收藏正确更新: ${collectionsUpdated ? '✅' : '❌'}`);
    
    if (feePreserved && likesUpdated && commentsUpdated && collectionsUpdated) {
      console.log(`\n🎉 修复成功！作品数据更新不再影响报价`);
    } else {
      console.log(`\n❌ 修复失败，仍存在问题`);
    }
    
    // 6. 测试报价更新功能
    console.log(`\n🔄 测试报价更新功能...`);
    const feeUpdateData = {
      fee: testPeriod.fee + 100 // 增加100元
    };
    
    await axios.put(
      `${baseUrl}/api/darens/${darenWithPeriods._id}/periods/${testPeriod.period}`,
      feeUpdateData
    );
    
    const feeUpdatedResponse = await axios.get(`${baseUrl}/api/darens/${darenWithPeriods._id}`);
    const feeUpdatedPeriod = feeUpdatedResponse.data.periodData.find(p => p.period === testPeriod.period);
    
    const feeCorrectlyUpdated = feeUpdatedPeriod.fee === (testPeriod.fee + 100);
    console.log(`   报价更新功能: ${feeCorrectlyUpdated ? '✅' : '❌'}`);
    console.log(`   新报价: ${feeUpdatedPeriod.fee} (预期: ${testPeriod.fee + 100})`);
    
    // 7. 恢复原始数据
    console.log(`\n🔄 恢复原始数据...`);
    await axios.put(
      `${baseUrl}/api/darens/${darenWithPeriods._id}/periods/${testPeriod.period}`,
      {
        fee: testPeriod.fee,
        likes: testPeriod.likes,
        comments: testPeriod.comments,
        collections: testPeriod.collections
      }
    );
    console.log(`✅ 原始数据已恢复`);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testFeeUpdateFix();