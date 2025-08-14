import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number | string | undefined): string {
  if (!num) return '0'
  
  let n: number
  
  if (typeof num === 'string') {
    // 检查字符串是否已经包含单位
    if (num.includes('万')) {
      const value = parseFloat(num.replace('万', ''))
      if (!isNaN(value)) {
        n = value * 10000
      } else {
        return '0'
      }
    } else if (num.includes('k') || num.includes('K')) {
      const value = parseFloat(num.replace(/[kK]/, ''))
      if (!isNaN(value)) {
        n = value * 1000
      } else {
        return '0'
      }
    } else {
      n = parseFloat(num)
      if (isNaN(n)) return '0'
    }
  } else {
    n = num
  }
  
  if (isNaN(n)) return '0'
  
  if (n >= 10000) {
    return (n / 10000).toFixed(1) + '万'
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(1) + 'k'
  }
  return n.toString()
}

export function formatCurrency(amount: number | undefined): string {
  if (!amount) return '¥0'
  return `¥${amount.toLocaleString()}`
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return '-'
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 数字标准化函数 - 与后端保持一致
 * 将各种格式的数字字符串转换为标准数字
 * @param value 输入值（数字、字符串等）
 * @returns 标准化后的数字
 * @throws Error 当无法解析时抛出错误
 */
export function normalizeNumber(value: any): number {
  if (!value && value !== 0) return 0
  
  // 如果已经是数字，直接返回
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
      throw new Error(`无效的数字值: ${value}`)
    }
    return Math.round(value)
  }
  
  // 转换为字符串处理
  const str = value.toString().trim()
  if (!str) return 0
  
  // 处理带"万"单位的数字
  if (str.includes('万')) {
    const numStr = str.replace('万', '').trim()
    const num = parseFloat(numStr)
    if (isNaN(num)) {
      throw new Error(`无法解析带万单位的数字: ${str}`)
    }
    return Math.round(num * 10000)
  }
  
  // 处理带"k"或"K"单位的数字
  if (str.includes('k') || str.includes('K')) {
    const numStr = str.replace(/[kK]/, '').trim()
    const num = parseFloat(numStr)
    if (isNaN(num)) {
      throw new Error(`无法解析带k单位的数字: ${str}`)
    }
    return Math.round(num * 1000)
  }
  
  // 处理纯数字字符串
  const num = parseFloat(str)
  if (isNaN(num)) {
    throw new Error(`无法解析数字: ${str}`)
  }
  return Math.round(num)
}

/**
 * 达人数据标准化函数
 * 将包含中文单位的数字字符串转换为标准数字格式
 * @param data 原始达人数据
 * @returns 标准化后的达人数据
 */
export function normalizeDarenData(data: any): any {
  const normalized = { ...data }
  
  // 标准化主要数字字段
  const numericFields = ['followers', 'likes', 'comments', 'collections', 'forwards', 'exposure', 'reads', 'fee', 'likesAndCollections']
  
  numericFields.forEach(field => {
    if (normalized[field] !== undefined && normalized[field] !== null && normalized[field] !== '') {
      try {
        normalized[field] = normalizeNumber(normalized[field])
      } catch (error) {
        console.warn(`标准化字段 ${field} 失败:`, normalized[field], error)
        // 如果标准化失败，设置为0而不是保留原值
        normalized[field] = 0
      }
    }
  })
  
  // 标准化期数数据中的数字字段
  if (normalized.periodData && Array.isArray(normalized.periodData)) {
    normalized.periodData = normalized.periodData.map((period: any) => {
      const normalizedPeriod = { ...period }
      numericFields.forEach(field => {
        if (normalizedPeriod[field] !== undefined && normalizedPeriod[field] !== null && normalizedPeriod[field] !== '') {
          try {
            normalizedPeriod[field] = normalizeNumber(normalizedPeriod[field])
          } catch (error) {
            console.warn(`标准化期数数据字段 ${field} 失败:`, normalizedPeriod[field], error)
            normalizedPeriod[field] = 0
          }
        }
      })
      return normalizedPeriod
    })
  }
  
  return normalized
}