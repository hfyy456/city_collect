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

// 数字标准化函数 - 与后端保持一致
export function normalizeNumber(value: any): number {
  if (!value) return 0
  
  // 如果已经是数字，直接返回
  if (typeof value === 'number') {
    return Math.round(value)
  }
  
  // 转换为字符串处理
  const str = value.toString().trim()
  
  // 处理带单位的数字
  if (str.includes('万')) {
    const num = parseFloat(str.replace('万', ''))
    return isNaN(num) ? 0 : Math.round(num * 10000)
  }
  
  if (str.includes('k') || str.includes('K')) {
    const num = parseFloat(str.replace(/[kK]/, ''))
    return isNaN(num) ? 0 : Math.round(num * 1000)
  }
  
  // 处理纯数字字符串
  const num = parseFloat(str)
  return isNaN(num) ? 0 : Math.round(num)
}

// 达人数据标准化函数
export function normalizeDarenData(data: any): any {
  const normalized = { ...data }
  
  // 标准化主要数字字段
  const numericFields = ['followers', 'likes', 'comments', 'collections', 'forwards', 'exposure', 'reads', 'fee', 'likesAndCollections']
  
  numericFields.forEach(field => {
    if (normalized[field] !== undefined && normalized[field] !== null && normalized[field] !== '') {
      normalized[field] = normalizeNumber(normalized[field])
    }
  })
  
  // 标准化期数数据中的数字字段
  if (normalized.periodData && Array.isArray(normalized.periodData)) {
    normalized.periodData = normalized.periodData.map((period: any) => {
      const normalizedPeriod = { ...period }
      numericFields.forEach(field => {
        if (normalizedPeriod[field] !== undefined && normalizedPeriod[field] !== null && normalizedPeriod[field] !== '') {
          normalizedPeriod[field] = normalizeNumber(normalizedPeriod[field])
        }
      })
      return normalizedPeriod
    })
  }
  
  return normalized
}