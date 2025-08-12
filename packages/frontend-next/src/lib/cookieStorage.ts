/**
 * Cookie本地存储管理工具
 * 用于保存和管理小红书Cookie
 */

const COOKIE_STORAGE_KEY = 'xhs_cookies'
const COOKIE_HISTORY_KEY = 'xhs_cookies_history'
const MAX_HISTORY_COUNT = 5

export interface SavedCookie {
  id: string
  name: string
  cookie: string
  value?: string  // 别名，为了向后兼容
  createdAt: string
  lastUsed: string
  isDefault?: boolean
  savedAt?: string  // 别名，为了向后兼容
}

export class CookieStorage {
  /**
   * 保存Cookie
   */
  static saveCookie(name: string, cookie: string, setAsDefault = false): SavedCookie {
    const savedCookie: SavedCookie = {
      id: Date.now().toString(),
      name: name.trim(),
      cookie: cookie.trim(),
      value: cookie.trim(),  // 向后兼容
      createdAt: new Date().toISOString(),
      savedAt: new Date().toISOString(),  // 向后兼容
      lastUsed: new Date().toISOString(),
      isDefault: setAsDefault
    }

    // 获取现有的Cookie历史
    const history = this.getCookieHistory()
    
    // 如果设置为默认，清除其他默认标记
    if (setAsDefault) {
      history.forEach(item => {
        item.isDefault = false
      })
    }
    
    // 检查是否已存在相同名称的Cookie
    const existingIndex = history.findIndex(item => item.name === name)
    if (existingIndex >= 0) {
      // 更新现有Cookie
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
    localStorage.setItem(COOKIE_HISTORY_KEY, JSON.stringify(history))
    
    // 如果设置为默认，也保存到默认位置
    if (setAsDefault) {
      localStorage.setItem(COOKIE_STORAGE_KEY, cookie)
    }
    
    return savedCookie
  }

  /**
   * 获取默认Cookie
   */
  static getDefaultCookie(): string {
    // 首先尝试从新的cookie历史记录中获取默认cookie
    const defaultRecord = this.getDefaultCookieRecord()
    if (defaultRecord) {
      return defaultRecord.cookie
    }
    
    // 如果没有找到，尝试从旧的存储格式中获取（向后兼容）
    return localStorage.getItem(COOKIE_STORAGE_KEY) || ''
  }

  /**
   * 获取Cookie历史记录
   */
  static getCookieHistory(): SavedCookie[] {
    try {
      const history = localStorage.getItem(COOKIE_HISTORY_KEY)
      return history ? JSON.parse(history) : []
    } catch (error) {
      console.error('读取Cookie历史失败:', error)
      return []
    }
  }

  /**
   * 获取默认Cookie记录
   */
  static getDefaultCookieRecord(): SavedCookie | null {
    const history = this.getCookieHistory()
    return history.find(item => item.isDefault) || null
  }

  /**
   * 使用Cookie（更新最后使用时间）
   */
  static useCookie(cookieId: string): void {
    const history = this.getCookieHistory()
    const cookie = history.find(item => item.id === cookieId)
    
    if (cookie) {
      cookie.lastUsed = new Date().toISOString()
      localStorage.setItem(COOKIE_HISTORY_KEY, JSON.stringify(history))
    }
  }

  /**
   * 删除Cookie
   */
  static deleteCookie(cookieId: string): void {
    const history = this.getCookieHistory()
    const filteredHistory = history.filter(item => item.id !== cookieId)
    localStorage.setItem(COOKIE_HISTORY_KEY, JSON.stringify(filteredHistory))
    
    // 如果删除的是默认Cookie，清除默认设置
    const deletedCookie = history.find(item => item.id === cookieId)
    if (deletedCookie?.isDefault) {
      localStorage.removeItem(COOKIE_STORAGE_KEY)
    }
  }

  /**
   * 设置默认Cookie
   */
  static setDefaultCookie(cookieId: string): void {
    const history = this.getCookieHistory()
    
    // 清除所有默认标记
    history.forEach(item => {
      item.isDefault = false
    })
    
    // 设置新的默认Cookie
    const targetCookie = history.find(item => item.id === cookieId)
    if (targetCookie) {
      targetCookie.isDefault = true
      targetCookie.lastUsed = new Date().toISOString()
      
      localStorage.setItem(COOKIE_HISTORY_KEY, JSON.stringify(history))
      localStorage.setItem(COOKIE_STORAGE_KEY, targetCookie.cookie)
    }
  }

  /**
   * 清除所有Cookie
   */
  static clearAllCookies(): void {
    localStorage.removeItem(COOKIE_STORAGE_KEY)
    localStorage.removeItem(COOKIE_HISTORY_KEY)
  }

  /**
   * 验证Cookie格式
   */
  static validateCookie(cookie: string): { isValid: boolean; message: string } {
    if (!cookie || cookie.trim().length === 0) {
      return { isValid: false, message: 'Cookie不能为空' }
    }
    
    const trimmedCookie = cookie.trim()
    
    // 检查基本格式
    if (!trimmedCookie.includes('=')) {
      return { isValid: false, message: 'Cookie格式不正确，应包含键值对' }
    }
    
    // 检查是否包含小红书相关的关键Cookie
    const requiredCookies = ['web_session', 'a1']
    const hasRequiredCookies = requiredCookies.some(key => 
      trimmedCookie.includes(`${key}=`)
    )
    
    if (!hasRequiredCookies) {
      return { 
        isValid: false, 
        message: '建议包含 web_session 或 a1 等关键Cookie以获得最佳效果' 
      }
    }
    
    return { isValid: true, message: 'Cookie格式正确' }
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
   * 导出Cookie数据
   */
  static exportCookies(): string {
    const history = this.getCookieHistory()
    return JSON.stringify(history, null, 2)
  }

  /**
   * 导入Cookie数据
   */
  static importCookies(jsonData: string): { success: boolean; message: string; count: number } {
    try {
      const importedCookies: SavedCookie[] = JSON.parse(jsonData)
      
      if (!Array.isArray(importedCookies)) {
        return { success: false, message: '数据格式不正确', count: 0 }
      }
      
      const currentHistory = this.getCookieHistory()
      const mergedHistory = [...currentHistory]
      
      let importCount = 0
      
      importedCookies.forEach(importedCookie => {
        // 验证导入的Cookie结构
        if (importedCookie.name && importedCookie.cookie) {
          const existingIndex = mergedHistory.findIndex(item => item.name === importedCookie.name)
          
          if (existingIndex >= 0) {
            // 更新现有Cookie
            mergedHistory[existingIndex] = {
              ...importedCookie,
              id: mergedHistory[existingIndex].id, // 保持原有ID
              lastUsed: new Date().toISOString()
            }
          } else {
            // 添加新Cookie
            mergedHistory.push({
              ...importedCookie,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              lastUsed: new Date().toISOString()
            })
          }
          
          importCount++
        }
      })
      
      // 限制总数量
      if (mergedHistory.length > MAX_HISTORY_COUNT) {
        mergedHistory.splice(MAX_HISTORY_COUNT)
      }
      
      localStorage.setItem(COOKIE_HISTORY_KEY, JSON.stringify(mergedHistory))
      
      return { 
        success: true, 
        message: `成功导入 ${importCount} 个Cookie`, 
        count: importCount 
      }
    } catch (error) {
      return { 
        success: false, 
        message: '导入失败：' + (error as Error).message, 
        count: 0 
      }
    }
  }
}