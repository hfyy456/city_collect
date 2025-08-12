import { type Daren } from './api'

// 计算总点赞数的辅助函数
export function getTotalLikes(daren: Daren): number {
  let total = 0
  daren.periodData?.forEach(period => {
    total += (period.likes || 0)
  })
  if (total === 0) {
    total = (daren.likes || 0)
  }
  return total
}

// 计算总收藏数的辅助函数
export function getTotalCollections(daren: Daren): number {
  let total = 0
  daren.periodData?.forEach(period => {
    total += (period.collections || 0)
  })
  if (total === 0) {
    total = (daren.collections || 0)
  }
  return total
}

// 计算总评论数的辅助函数
export function getTotalComments(daren: Daren): number {
  let total = 0
  daren.periodData?.forEach(period => {
    total += (period.comments || 0)
  })
  if (total === 0) {
    total = (daren.comments || 0)
  }
  return total
}

// 计算总点赞与收藏数的辅助函数
export function getTotalLikesAndCollections(daren: Daren): number {
  // 优先使用 likesAndCollections 字段
  if (daren.likesAndCollections) {
    return typeof daren.likesAndCollections === 'string' 
      ? parseInt(daren.likesAndCollections) || 0 
      : daren.likesAndCollections
  }
  
  // 如果没有合并字段，则计算点赞和收藏的总和
  return getTotalLikes(daren) + getTotalCollections(daren)
}

// 计算总投入费用
export function getTotalInvestment(daren: Daren): number {
  if (daren.periodData && daren.periodData.length > 0) {
    return daren.periodData.reduce((sum, period) => sum + (period.fee || 0), 0)
  }
  return daren.fee || 0
}

// 计算总互动数
export function getTotalInteractions(daren: Daren): number {
  return getTotalLikes(daren) + getTotalComments(daren) + getTotalCollections(daren)
}

// 计算ROI
export function calculateROI(interactions: number, investment: number): number {
  return investment > 0 ? (interactions / investment * 100) : 0
}

// 计算达人列表的统计数据
export function calculateStats(darens: Daren[]) {
  const totalInfluencers = darens.length
  let totalInvestment = 0
  let totalInteractions = 0
  
  darens.forEach((daren) => {
    totalInvestment += getTotalInvestment(daren)
    totalInteractions += getTotalInteractions(daren)
  })
  
  const averageROI = calculateROI(totalInteractions, totalInvestment)
  
  return {
    totalInfluencers,
    totalInvestment,
    totalInteractions,
    averageROI
  }
}

// 过滤达人列表
export function filterDarens(darens: Daren[], searchTerm: string): Daren[] {
  if (!searchTerm.trim()) return darens
  
  const term = searchTerm.toLowerCase()
  return darens.filter(daren => 
    daren.nickname.toLowerCase().includes(term) ||
    daren.xiaohongshuId?.toLowerCase().includes(term) ||
    daren.ipLocation?.toLowerCase().includes(term)
  )
}