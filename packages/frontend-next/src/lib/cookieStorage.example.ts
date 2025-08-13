/**
 * CookieStorage 使用示例
 * 展示优化后的 Cookie 管理功能
 */

/* eslint-disable react-hooks/rules-of-hooks */

import { CookieStorage, SavedCookie, CookieValidationResult } from './cookieStorage'

// ==================== 基础使用示例 ====================

/**
 * 保存Cookie示例
 */
export async function saveCookieExample() {
  try {
    // 基础保存
    const cookie = await CookieStorage.saveCookie(
      '测试Cookie',
      'web_session=abc123; a1=def456; webId=xyz789',
      true // 设为默认
    )
    
    // 带选项的保存
    const advancedCookie = await CookieStorage.saveCookie(
      '生产环境Cookie',
      'web_session=prod123; a1=prod456; webId=prod789',
      false,
      {
        tags: ['生产', '重要'],
        description: '生产环境专用Cookie，请勿删除',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30天后过期
      }
    )
    
    console.log('Cookie保存成功:', cookie)
    console.log('高级Cookie保存成功:', advancedCookie)
  } catch (error) {
    console.error('保存Cookie失败:', error)
  }
}

/**
 * 获取和使用Cookie示例
 */
export async function getCookieExample() {
  try {
    // 获取默认Cookie
    const defaultCookie = await CookieStorage.getDefaultCookie()
    console.log('默认Cookie:', defaultCookie)
    
    // 获取Cookie历史
    const history = await CookieStorage.getCookieHistory()
    console.log('Cookie历史:', history)
    
    // 使用Cookie（会增加使用次数）
    if (history.length > 0) {
      const success = await CookieStorage.useCookie(history[0].id)
      console.log('使用Cookie结果:', success)
    }
  } catch (error) {
    console.error('获取Cookie失败:', error)
  }
}

// ==================== 高级功能示例 ====================

/**
 * Cookie验证示例
 */
export function validateCookieExample() {
  const testCookies = [
    'web_session=abc123; a1=def456', // 良好的Cookie
    'invalid_cookie', // 无效的Cookie
    'web_session=abc123; a1=def456; webId=xyz789; gid=123; webBuild=456' // 优秀的Cookie
  ]
  
  testCookies.forEach((cookie, index) => {
    const result: CookieValidationResult = CookieStorage.validateCookie(cookie)
    console.log(`Cookie ${index + 1} 验证结果:`, {
      isValid: result.isValid,
      message: result.message,
      score: result.score,
      warnings: result.warnings
    })
  })
}

/**
 * 搜索和筛选示例
 */
export async function searchAndFilterExample() {
  try {
    // 搜索Cookie
    const searchResults = await CookieStorage.searchCookies('生产')
    console.log('搜索结果:', searchResults)
    
    // 按标签筛选
    const taggedCookies = await CookieStorage.getCookiesByTag('重要')
    console.log('重要标签的Cookie:', taggedCookies)
    
    // 获取所有标签
    const allTags = await CookieStorage.getAllTags()
    console.log('所有标签:', allTags)
  } catch (error) {
    console.error('搜索筛选失败:', error)
  }
}

/**
 * 统计信息示例
 */
export async function getStatsExample() {
  try {
    const stats = await CookieStorage.getCookieStats()
    console.log('Cookie统计信息:', {
      总数: stats.totalCount,
      默认Cookie: stats.defaultCookie?.name,
      最常用: stats.mostUsed?.name,
      最旧: stats.oldestCookie?.name,
      最新: stats.newestCookie?.name
    })
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

// ==================== 导入导出示例 ====================

/**
 * 导出Cookie示例
 */
export async function exportCookieExample() {
  try {
    // 导出为JSON
    const jsonExport = await CookieStorage.exportCookies({
      includeExpired: false,
      format: 'json'
    })
    console.log('JSON导出:', jsonExport)
    
    // 导出为CSV
    const csvExport = await CookieStorage.exportCookies({
      includeExpired: true,
      format: 'csv'
    })
    console.log('CSV导出:', csvExport)
  } catch (error) {
    console.error('导出失败:', error)
  }
}

/**
 * 导入Cookie示例
 */
export async function importCookieExample() {
  const sampleData = JSON.stringify([
    {
      name: '导入测试Cookie',
      cookie: 'web_session=import123; a1=import456',
      tags: ['导入', '测试'],
      description: '这是一个导入的测试Cookie'
    }
  ])
  
  try {
    const result = await CookieStorage.importCookies(sampleData, {
      overwrite: false,
      validateBeforeImport: true
    })
    
    console.log('导入结果:', {
      成功: result.success,
      消息: result.message,
      数量: result.count,
      错误: result.errors
    })
  } catch (error) {
    console.error('导入失败:', error)
  }
}

// ==================== 备份恢复示例 ====================

/**
 * 备份恢复示例
 */
export async function backupRestoreExample() {
  try {
    // 恢复备份
    const restoreResult = await CookieStorage.restoreFromBackup()
    console.log('恢复备份结果:', restoreResult)
  } catch (error) {
    console.error('备份恢复失败:', error)
  }
}

// ==================== 批量操作示例 ====================

/**
 * 批量删除示例
 */
export async function batchDeleteExample() {
  try {
    const history = await CookieStorage.getCookieHistory()
    const idsToDelete = history
      .filter(cookie => cookie.tags?.includes('测试'))
      .map(cookie => cookie.id)
    
    if (idsToDelete.length > 0) {
      const result = await CookieStorage.deleteCookies(idsToDelete)
      console.log('批量删除结果:', {
        成功: result.success,
        失败: result.failed
      })
    }
  } catch (error) {
    console.error('批量删除失败:', error)
  }
}

// ==================== 完整使用流程示例 ====================

/**
 * 完整的Cookie管理流程示例
 */
export async function completeWorkflowExample() {
  console.log('=== Cookie管理完整流程示例 ===')
  
  try {
    // 1. 保存多个Cookie
    console.log('1. 保存Cookie...')
    await CookieStorage.saveCookie('开发环境', 'web_session=dev123; a1=dev456', false, {
      tags: ['开发', '测试'],
      description: '开发环境Cookie'
    })
    
    await CookieStorage.saveCookie('生产环境', 'web_session=prod123; a1=prod456; webId=prod789', true, {
      tags: ['生产', '重要'],
      description: '生产环境Cookie，请勿删除'
    })
    
    // 2. 查看统计信息
    console.log('2. 查看统计信息...')
    const stats = await CookieStorage.getCookieStats()
    console.log('统计信息:', stats)
    
    // 3. 搜索和筛选
    console.log('3. 搜索和筛选...')
    const prodCookies = await CookieStorage.getCookiesByTag('生产')
    console.log('生产环境Cookie:', prodCookies)
    
    // 4. 导出数据
    console.log('4. 导出数据...')
    const exportData = await CookieStorage.exportCookies()
    console.log('导出数据长度:', exportData.length)
    
    // 5. 使用Cookie
    console.log('5. 使用Cookie...')
    const defaultCookie = await CookieStorage.getDefaultCookie()
    console.log('获取到默认Cookie:', defaultCookie ? '成功' : '失败')
    
    console.log('=== 流程完成 ===')
  } catch (error) {
    console.error('流程执行失败:', error)
  }
}