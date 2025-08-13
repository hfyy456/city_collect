/**
 * Cookie本地存储管理工具
 * 用于保存和管理小红书Cookie
 * 提供完整的Cookie生命周期管理功能
 */

// 存储键名常量
const COOKIE_STORAGE_KEY = 'xhs_cookies' as const
const COOKIE_HISTORY_KEY = 'xhs_cookies_history' as const
const COOKIE_BACKUP_KEY = 'xhs_cookies_backup' as const
const MAX_HISTORY_COUNT = 10 // 增加历史记录数量
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000 // 24小时备份间隔

// Cookie验证结果接口
export interface CookieValidationResult {
  isValid: boolean
  message: string
  warnings?: string[]
  score?: number // 0-100的质量评分
}

// Cookie统计信息接口
export interface CookieStats {
  totalCount: number
  defaultCookie: SavedCookie | null
  mostUsed: SavedCookie | null
  oldestCookie: SavedCookie | null
  newestCookie: SavedCookie | null
}

// 导入导出结果接口
export interface ImportResult {
  success: boolean
  message: string
  count: number
  errors?: string[]
}

// Cookie数据接口
export interface SavedCookie {
  id: string
  name: string
  cookie: string
  value?: string  // 别名，为了向后兼容
  createdAt: string
  lastUsed: string
  isDefault?: boolean
  savedAt?: string  // 别名，为了向后兼容
  useCount?: number // 使用次数
  tags?: string[] // Cookie标签
  description?: string // Cookie描述
  isExpired?: boolean // 是否过期
  expiresAt?: string // 过期时间
}

export class CookieStorage {
  private static _cache: Map<string, SavedCookie[]> = new Map()
  private static _lastCacheUpdate = 0
  private static readonly CACHE_TTL = 5000 // 5秒缓存

  /**
   * 保存Cookie
   * @param name Cookie名称
   * @param cookie Cookie值
   * @param setAsDefault 是否设为默认
   * @param options 额外选项
   */
  static async saveCookie(
    name: string, 
    cookie: string, 
    setAsDefault = false,
    options: {
      tags?: string[]
      description?: string
      expiresAt?: string
    } = {}
  ): Promise<SavedCookie> {
    try {
      // 输入验证
      if (!name?.trim()) {
        throw new Error('Cookie名称不能为空')
      }
      if (!cookie?.trim()) {
        throw new Error('Cookie值不能为空')
      }

      const trimmedName = name.trim()
      const trimmedCookie = cookie.trim()
      
      // 验证Cookie格式
      const validation = this.validateCookie(trimmedCookie)
      if (!validation.isValid) {
        console.warn('Cookie验证警告:', validation.message)
      }

      const now = new Date().toISOString()
      const savedCookie: SavedCookie = {
        id: this.generateId(),
        name: trimmedName,
        cookie: trimmedCookie,
        value: trimmedCookie,  // 向后兼容
        createdAt: now,
        savedAt: now,  // 向后兼容
        lastUsed: now,
        isDefault: setAsDefault,
        useCount: 0,
        tags: options.tags || [],
        description: options.description || '',
        isExpired: false,
        expiresAt: options.expiresAt
      }

      // 获取现有的Cookie历史
      const history = await this.getCookieHistory()
      
      // 如果设置为默认，清除其他默认标记
      if (setAsDefault) {
        history.forEach(item => {
          item.isDefault = false
        })
      }
      
      // 检查是否已存在相同名称的Cookie
      const existingIndex = history.findIndex(item => item.name === trimmedName)
      if (existingIndex >= 0) {
        // 更新现有Cookie，保留使用次数
        const existing = history[existingIndex]
        savedCookie.useCount = existing.useCount || 0
        savedCookie.createdAt = existing.createdAt
        history[existingIndex] = savedCookie
      } else {
        // 添加新Cookie
        history.unshift(savedCookie)
        
        // 限制历史记录数量
        if (history.length > MAX_HISTORY_COUNT) {
          history.splice(MAX_HISTORY_COUNT)
        }
      }
      
      // 保存到localStorage
      await this.saveToStorage(COOKIE_HISTORY_KEY, history)
      
      // 如果设置为默认，也保存到默认位置
      if (setAsDefault) {
        await this.saveToStorage(COOKIE_STORAGE_KEY, trimmedCookie)
      }
      
      // 清除缓存
      this.clearCache()
      
      // 自动备份
      await this.autoBackup()
      
      return savedCookie
    } catch (error) {
      console.error('保存Cookie失败:', error)
      throw new Error(`保存Cookie失败: ${(error as Error).message}`)
    }
  }

  /**
   * 获取默认Cookie
   */
  static async getDefaultCookie(): Promise<string> {
    try {
      // 首先尝试从新的cookie历史记录中获取默认cookie
      const defaultRecord = await this.getDefaultCookieRecord()
      if (defaultRecord) {
        // 检查是否过期
        if (this.isCookieExpired(defaultRecord)) {
          console.warn('默认Cookie已过期')
          await this.markCookieExpired(defaultRecord.id)
        }
        return defaultRecord.cookie
      }
      
      // 如果没有找到，尝试从旧的存储格式中获取（向后兼容）
      const fallbackCookie = await this.getFromStorage(COOKIE_STORAGE_KEY)
      return fallbackCookie || ''
    } catch (error) {
      console.error('获取默认Cookie失败:', error)
      return ''
    }
  }

  /**
   * 获取Cookie历史记录（带缓存）
   */
  static async getCookieHistory(): Promise<SavedCookie[]> {
    try {
      // 检查缓存
      const now = Date.now()
      if (this._cache.has(COOKIE_HISTORY_KEY) && 
          (now - this._lastCacheUpdate) < this.CACHE_TTL) {
        return this._cache.get(COOKIE_HISTORY_KEY) || []
      }

      const historyData = await this.getFromStorage(COOKIE_HISTORY_KEY)
      const history: SavedCookie[] = historyData ? JSON.parse(historyData) : []
      
      // 更新缓存
      this._cache.set(COOKIE_HISTORY_KEY, history)
      this._lastCacheUpdate = now
      
      // 检查并标记过期的Cookie
      await this.checkExpiredCookies(history)
      
      return history
    } catch (error) {
      console.error('读取Cookie历史失败:', error)
      return []
    }
  }

  /**
   * 获取默认Cookie记录
   */
  static async getDefaultCookieRecord(): Promise<SavedCookie | null> {
    const history = await this.getCookieHistory()
    return history.find(item => item.isDefault && !item.isExpired) || null
  }

  /**
   * 使用Cookie（更新最后使用时间和使用次数）
   */
  static async useCookie(cookieId: string): Promise<boolean> {
    try {
      const history = await this.getCookieHistory()
      const cookie = history.find(item => item.id === cookieId)
      
      if (cookie && !cookie.isExpired) {
        cookie.lastUsed = new Date().toISOString()
        cookie.useCount = (cookie.useCount || 0) + 1
        
        await this.saveToStorage(COOKIE_HISTORY_KEY, history)
        this.clearCache()
        return true
      }
      return false
    } catch (error) {
      console.error('使用Cookie失败:', error)
      return false
    }
  }

  /**
   * 删除Cookie
   */
  static async deleteCookie(cookieId: string): Promise<boolean> {
    try {
      const history = await this.getCookieHistory()
      const deletedCookie = history.find(item => item.id === cookieId)
      const filteredHistory = history.filter(item => item.id !== cookieId)
      
      await this.saveToStorage(COOKIE_HISTORY_KEY, filteredHistory)
      
      // 如果删除的是默认Cookie，清除默认设置
      if (deletedCookie?.isDefault) {
        localStorage.removeItem(COOKIE_STORAGE_KEY)
      }
      
      this.clearCache()
      return true
    } catch (error) {
      console.error('删除Cookie失败:', error)
      return false
    }
  }

  /**
   * 批量删除Cookie
   */
  static async deleteCookies(cookieIds: string[]): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0
    
    for (const id of cookieIds) {
      const result = await this.deleteCookie(id)
      if (result) {
        success++
      } else {
        failed++
      }
    }
    
    return { success, failed }
  }

  /**
   * 设置默认Cookie
   */
  static async setDefaultCookie(cookieId: string): Promise<boolean> {
    try {
      const history = await this.getCookieHistory()
      
      // 清除所有默认标记
      history.forEach(item => {
        item.isDefault = false
      })
      
      // 设置新的默认Cookie
      const targetCookie = history.find(item => item.id === cookieId)
      if (targetCookie && !targetCookie.isExpired) {
        targetCookie.isDefault = true
        targetCookie.lastUsed = new Date().toISOString()
        targetCookie.useCount = (targetCookie.useCount || 0) + 1
        
        await this.saveToStorage(COOKIE_HISTORY_KEY, history)
        await this.saveToStorage(COOKIE_STORAGE_KEY, targetCookie.cookie)
        
        this.clearCache()
        return true
      }
      return false
    } catch (error) {
      console.error('设置默认Cookie失败:', error)
      return false
    }
  }

  /**
   * 清除所有Cookie
   */
  static async clearAllCookies(): Promise<void> {
    try {
      localStorage.removeItem(COOKIE_STORAGE_KEY)
      localStorage.removeItem(COOKIE_HISTORY_KEY)
      localStorage.removeItem(COOKIE_BACKUP_KEY)
      this.clearCache()
    } catch (error) {
      console.error('清除所有Cookie失败:', error)
      throw error
    }
  }

  /**
   * 验证Cookie格式（增强版）
   */
  static validateCookie(cookie: string): CookieValidationResult {
    if (!cookie || cookie.trim().length === 0) {
      return { 
        isValid: false, 
        message: 'Cookie不能为空',
        score: 0
      }
    }
    
    const trimmedCookie = cookie.trim()
    const warnings: string[] = []
    let score = 0
    
    // 检查基本格式
    if (!trimmedCookie.includes('=')) {
      return { 
        isValid: false, 
        message: 'Cookie格式不正确，应包含键值对',
        score: 0
      }
    }
    score += 20
    
    // 检查Cookie长度
    if (trimmedCookie.length < 50) {
      warnings.push('Cookie长度较短，可能不完整')
    } else {
      score += 10
    }
    
    // 检查是否包含小红书相关的关键Cookie
    const criticalCookies = ['web_session', 'a1']
    const importantCookies = ['webId', 'gid', 'webBuild']
    const optionalCookies = ['xsecappid', 'cache_feeds']
    
    const hasCritical = criticalCookies.some(key => 
      trimmedCookie.includes(`${key}=`)
    )
    const hasImportant = importantCookies.some(key => 
      trimmedCookie.includes(`${key}=`)
    )
    const hasOptional = optionalCookies.some(key => 
      trimmedCookie.includes(`${key}=`)
    )
    
    if (hasCritical) {
      score += 40
    } else {
      warnings.push('缺少关键Cookie (web_session, a1)，可能影响功能')
    }
    
    if (hasImportant) {
      score += 20
    } else {
      warnings.push('缺少重要Cookie，建议补充完整')
    }
    
    if (hasOptional) {
      score += 10
    }
    
    // 检查Cookie格式规范性
    const cookiePairs = trimmedCookie.split(';')
    let validPairs = 0
    
    for (const pair of cookiePairs) {
      const trimmedPair = pair.trim()
      if (trimmedPair.includes('=') && trimmedPair.split('=').length === 2) {
        validPairs++
      }
    }
    
    if (validPairs === cookiePairs.length) {
      score += 10
    } else {
      warnings.push('部分Cookie格式不规范')
    }
    
    const isValid = score >= 60 // 60分以上认为有效
    let message = ''
    
    if (score >= 90) {
      message = 'Cookie质量优秀'
    } else if (score >= 70) {
      message = 'Cookie质量良好'
    } else if (score >= 60) {
      message = 'Cookie基本可用'
    } else {
      message = 'Cookie质量较差，建议重新获取'
    }
    
    return { 
      isValid, 
      message, 
      warnings: warnings.length > 0 ? warnings : undefined,
      score 
    }
  }

  /**
   * 格式化Cookie显示文本
   */
  static formatCookieDisplay(cookie: string, maxLength = 50): string {
    if (!cookie) return ''
    
    const trimmed = cookie.trim()
    if (trimmed.length <= maxLength) {
      return trimmed
    }
    
    return trimmed.substring(0, maxLength) + '...'
  }

  /**
   * 获取Cookie统计信息
   */
  static async getCookieStats(): Promise<CookieStats> {
    const history = await this.getCookieHistory()
    const validCookies = history.filter(c => !c.isExpired)
    
    let mostUsed: SavedCookie | null = null
    let oldestCookie: SavedCookie | null = null
    let newestCookie: SavedCookie | null = null
    
    if (validCookies.length > 0) {
      mostUsed = validCookies.reduce((prev, current) => 
        (current.useCount || 0) > (prev.useCount || 0) ? current : prev
      )
      
      oldestCookie = validCookies.reduce((prev, current) => 
        new Date(current.createdAt) < new Date(prev.createdAt) ? current : prev
      )
      
      newestCookie = validCookies.reduce((prev, current) => 
        new Date(current.createdAt) > new Date(prev.createdAt) ? current : prev
      )
    }
    
    return {
      totalCount: validCookies.length,
      defaultCookie: await this.getDefaultCookieRecord(),
      mostUsed,
      oldestCookie,
      newestCookie
    }
  }

  /**
   * 搜索Cookie
   */
  static async searchCookies(query: string): Promise<SavedCookie[]> {
    const history = await this.getCookieHistory()
    const lowerQuery = query.toLowerCase()
    
    return history.filter(cookie => 
      cookie.name.toLowerCase().includes(lowerQuery) ||
      cookie.description?.toLowerCase().includes(lowerQuery) ||
      cookie.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  /**
   * 按标签筛选Cookie
   */
  static async getCookiesByTag(tag: string): Promise<SavedCookie[]> {
    const history = await this.getCookieHistory()
    return history.filter(cookie => 
      cookie.tags?.includes(tag) && !cookie.isExpired
    )
  }

  /**
   * 获取所有标签
   */
  static async getAllTags(): Promise<string[]> {
    const history = await this.getCookieHistory()
    const tags = new Set<string>()
    
    history.forEach(cookie => {
      cookie.tags?.forEach(tag => tags.add(tag))
    })
    
    return Array.from(tags).sort()
  }

  /**
   * 导出Cookie数据（增强版）
   */
  static async exportCookies(options: {
    includeExpired?: boolean
    format?: 'json' | 'csv'
  } = {}): Promise<string> {
    const { includeExpired = false, format = 'json' } = options
    const history = await this.getCookieHistory()
    const exportData = includeExpired ? history : history.filter(c => !c.isExpired)
    
    if (format === 'csv') {
      const headers = ['名称', '创建时间', '最后使用', '使用次数', '是否默认', '标签', '描述']
      const rows = exportData.map(cookie => [
        cookie.name,
        cookie.createdAt,
        cookie.lastUsed,
        cookie.useCount || 0,
        cookie.isDefault ? '是' : '否',
        cookie.tags?.join(';') || '',
        cookie.description || ''
      ])
      
      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }
    
    return JSON.stringify({
      exportTime: new Date().toISOString(),
      version: '2.0',
      cookies: exportData
    }, null, 2)
  }

  /**
   * 导入Cookie数据（增强版）
   */
  static async importCookies(
    jsonData: string, 
    options: {
      overwrite?: boolean
      validateBeforeImport?: boolean
    } = {}
  ): Promise<ImportResult> {
    const { overwrite = false, validateBeforeImport = true } = options
    const errors: string[] = []
    
    try {
      let importedData: any
      
      try {
        importedData = JSON.parse(jsonData)
      } catch {
        return { 
          success: false, 
          message: 'JSON格式不正确', 
          count: 0,
          errors: ['无法解析JSON数据']
        }
      }
      
      // 支持新旧格式
      const importedCookies: SavedCookie[] = Array.isArray(importedData) 
        ? importedData 
        : importedData.cookies || []
      
      if (!Array.isArray(importedCookies)) {
        return { 
          success: false, 
          message: '数据格式不正确', 
          count: 0,
          errors: ['Cookie数据不是数组格式']
        }
      }
      
      const currentHistory = await this.getCookieHistory()
      const mergedHistory = overwrite ? [] : [...currentHistory]
      
      let importCount = 0
      
      for (const importedCookie of importedCookies) {
        try {
          // 验证导入的Cookie结构
          if (!importedCookie.name || !importedCookie.cookie) {
            errors.push(`Cookie "${importedCookie.name || '未知'}" 缺少必要字段`)
            continue
          }
          
          // 验证Cookie质量
          if (validateBeforeImport) {
            const validation = this.validateCookie(importedCookie.cookie)
            if (!validation.isValid) {
              errors.push(`Cookie "${importedCookie.name}" 验证失败: ${validation.message}`)
              continue
            }
          }
          
          const existingIndex = mergedHistory.findIndex(item => item.name === importedCookie.name)
          
          const processedCookie: SavedCookie = {
            ...importedCookie,
            id: existingIndex >= 0 ? mergedHistory[existingIndex].id : this.generateId(),
            lastUsed: new Date().toISOString(),
            useCount: importedCookie.useCount || 0,
            tags: importedCookie.tags || [],
            description: importedCookie.description || '',
            isExpired: false
          }
          
          if (existingIndex >= 0) {
            // 更新现有Cookie
            mergedHistory[existingIndex] = processedCookie
          } else {
            // 添加新Cookie
            mergedHistory.push(processedCookie)
          }
          
          importCount++
        } catch (error) {
          errors.push(`处理Cookie "${importedCookie.name}" 时出错: ${(error as Error).message}`)
        }
      }
      
      // 限制总数量
      if (mergedHistory.length > MAX_HISTORY_COUNT) {
        const removed = mergedHistory.splice(MAX_HISTORY_COUNT)
        errors.push(`超出最大数量限制，移除了 ${removed.length} 个Cookie`)
      }
      
      await this.saveToStorage(COOKIE_HISTORY_KEY, mergedHistory)
      this.clearCache()
      
      return { 
        success: true, 
        message: `成功导入 ${importCount} 个Cookie`, 
        count: importCount,
        errors: errors.length > 0 ? errors : undefined
      }
    } catch (error) {
      return { 
        success: false, 
        message: '导入失败：' + (error as Error).message, 
        count: 0,
        errors: [error as string]
      }
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 生成唯一ID
   */
  private static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  /**
   * 安全的localStorage操作
   */
  private static async saveToStorage(key: string, data: any): Promise<void> {
    try {
      const jsonString = JSON.stringify(data)
      localStorage.setItem(key, jsonString)
    } catch (error) {
      console.error(`保存到localStorage失败 (${key}):`, error)
      throw new Error('存储空间不足或数据过大')
    }
  }

  /**
   * 安全的localStorage读取
   */
  private static async getFromStorage(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.error(`从localStorage读取失败 (${key}):`, error)
      return null
    }
  }

  /**
   * 清除缓存
   */
  private static clearCache(): void {
    this._cache.clear()
    this._lastCacheUpdate = 0
  }

  /**
   * 检查Cookie是否过期
   */
  private static isCookieExpired(cookie: SavedCookie): boolean {
    if (!cookie.expiresAt) return false
    return new Date(cookie.expiresAt) < new Date()
  }

  /**
   * 标记Cookie为过期
   */
  private static async markCookieExpired(cookieId: string): Promise<void> {
    const history = await this.getCookieHistory()
    const cookie = history.find(c => c.id === cookieId)
    if (cookie) {
      cookie.isExpired = true
      await this.saveToStorage(COOKIE_HISTORY_KEY, history)
      this.clearCache()
    }
  }

  /**
   * 检查并标记过期的Cookie
   */
  private static async checkExpiredCookies(history: SavedCookie[]): Promise<void> {
    let hasExpired = false
    
    for (const cookie of history) {
      if (!cookie.isExpired && this.isCookieExpired(cookie)) {
        cookie.isExpired = true
        hasExpired = true
      }
    }
    
    if (hasExpired) {
      await this.saveToStorage(COOKIE_HISTORY_KEY, history)
    }
  }

  /**
   * 自动备份
   */
  private static async autoBackup(): Promise<void> {
    try {
      const lastBackup = localStorage.getItem(COOKIE_BACKUP_KEY + '_time')
      const now = Date.now()
      
      if (!lastBackup || (now - parseInt(lastBackup)) > BACKUP_INTERVAL) {
        const history = await this.getCookieHistory()
        const backupData = {
          timestamp: now,
          data: history
        }
        
        localStorage.setItem(COOKIE_BACKUP_KEY, JSON.stringify(backupData))
        localStorage.setItem(COOKIE_BACKUP_KEY + '_time', now.toString())
      }
    } catch (error) {
      console.warn('自动备份失败:', error)
    }
  }

  /**
   * 恢复备份
   */
  static async restoreFromBackup(): Promise<{ success: boolean; message: string; count: number }> {
    try {
      const backupData = localStorage.getItem(COOKIE_BACKUP_KEY)
      if (!backupData) {
        return { success: false, message: '没有找到备份数据', count: 0 }
      }
      
      const backup = JSON.parse(backupData)
      const cookies = backup.data || []
      
      await this.saveToStorage(COOKIE_HISTORY_KEY, cookies)
      this.clearCache()
      
      return {
        success: true,
        message: `成功恢复 ${cookies.length} 个Cookie`,
        count: cookies.length
      }
    } catch (error) {
      return {
        success: false,
        message: '恢复备份失败：' + (error as Error).message,
        count: 0
      }
    }
  }
}