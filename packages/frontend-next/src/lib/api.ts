import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3005/api',
  timeout: 10000,
})

// 达人相关接口
export interface Daren {
  _id: string
  nickname: string
  platform?: string
  followers?: string
  homePage?: string
  xiaohongshuId?: string
  ipLocation?: string
  contactInfo?: string
  douyinLink?: string
  dianping?: string
  periodData: PeriodData[]
  remarks?: string
  // 兼容字段
  period?: string
  fee?: number
  mainPublishLink?: string
  syncPublishLink?: string
  likes?: number
  comments?: number
  collections?: number
  likesAndCollections?: string
  createdAt: string
  updatedAt: string
}

export interface PeriodData {
  _id: string
  period: string
  fee?: number
  mainPublishLink?: string
  syncPublishLink?: string
  contactPerson?: string
  storeArrivalTime?: string
  likes?: number
  comments?: number
  collections?: number
  periodRemarks?: string
  createdAt: string
  updatedAt: string
}

export interface DarenListResponse {
  items: Daren[]
  total: number
}

export interface SearchParams {
  page?: number
  limit?: number
  nickname?: string
  periods?: string[]
  feeMin?: number
  feeMax?: number
  likesMin?: number
  likesMax?: number
  startDate?: string
  endDate?: string
  ipLocations?: string[]
  sortBy?: string
}

// API 方法
export const darenApi = {
  // 获取达人列表
  list: (params: SearchParams = {}): Promise<DarenListResponse> =>
    api.get('/darens', { params }).then(res => res.data),

  // 搜索达人（分页版本）
  search: (params: SearchParams = {}): Promise<DarenListResponse> =>
    api.get('/darens', { params }).then(res => res.data),

  // 获取单个达人
  get: (id: string): Promise<Daren> =>
    api.get(`/darens/${id}`).then(res => res.data),

  // 创建达人
  create: (data: Partial<Daren>): Promise<Daren> =>
    api.post('/darens', data).then(res => res.data),

  // 更新达人
  update: (id: string, data: Partial<Daren>): Promise<Daren> =>
    api.put(`/darens/${id}`, data).then(res => res.data),

  // 删除达人
  delete: (id: string): Promise<void> =>
    api.delete(`/darens/${id}`).then(res => res.data),

  // 批量操作
  batch: (operation: string, ids: string[], data?: any): Promise<any> =>
    api.post('/darens/batch', { operation, ids, data }).then(res => res.data),

  // 获取期数列表
  getPeriods: (): Promise<string[]> =>
    api.get('/periods').then(res => res.data),

  // 获取IP位置列表
  getIpLocations: (): Promise<string[]> =>
    api.get('/ip-locations').then(res => res.data),

  // 解析小红书用户页面
  parseXhsUser: (url: string, cookie?: string): Promise<any> =>
    api.post('/parse-xhs-user', { url, cookie }).then(res => res.data),

  // 解析小红书笔记页面
  parseXhsNote: (url: string, cookie?: string): Promise<any> =>
    api.post('/parse-xhs-note-simple', { url, cookie }).then(res => res.data),
}

// 期数维度API
export const periodApi = {
  // 获取指定期数的达人数据
  getDarens: (period: string, params: { page?: number; limit?: number } = {}): Promise<any> =>
    api.get(`/periods/${period}/darens`, { params }).then(res => res.data),

  // 为达人添加期数数据
  addPeriodData: (darenId: string, periodData: Partial<PeriodData>): Promise<any> =>
    api.post(`/darens/${darenId}/periods`, periodData).then(res => res.data),

  // 更新达人的期数数据
  updatePeriodData: (darenId: string, period: string, data: Partial<PeriodData>): Promise<any> =>
    api.put(`/darens/${darenId}/periods/${period}`, data).then(res => res.data),

  // 删除达人的期数数据
  deletePeriodData: (darenId: string, period: string): Promise<any> =>
    api.delete(`/darens/${darenId}/periods/${period}`).then(res => res.data),

  // 获取期数统计数据
  getStats: (period: string): Promise<any> =>
    api.get(`/periods/${period}/stats`).then(res => res.data),

  // 新期数管理API
  // 获取所有期数列表
  list: (): Promise<any> =>
    api.get('/periods-new').then(res => res.data),

  // 创建新期数
  create: (data: { name: string; description?: string; startDate?: string; endDate?: string }): Promise<any> =>
    api.post('/periods-new', data).then(res => res.data),

  // 更新期数信息
  update: (id: string, data: any): Promise<any> =>
    api.put(`/periods-new/${id}`, data).then(res => res.data),

  // 删除整个期数
  delete: (id: string): Promise<any> =>
    api.delete(`/periods-new/${id}`).then(res => res.data),

  // 获取期数的达人列表（新API）
  getInfluencers: (periodName: string, params: { page?: number; limit?: number; status?: string } = {}): Promise<any> =>
    api.get(`/periods-new/${periodName}/influencers`, { params }).then(res => res.data),

  // 为期数添加达人
  addInfluencer: (periodName: string, data: any): Promise<any> =>
    api.post(`/periods-new/${periodName}/influencers`, data).then(res => res.data),

  // 更新期数中的达人数据
  updateInfluencer: (periodName: string, influencerId: string, data: any): Promise<any> =>
    api.put(`/periods-new/${periodName}/influencers/${influencerId}`, data).then(res => res.data),

  // 从期数中移除达人
  removeInfluencer: (periodName: string, influencerId: string): Promise<any> =>
    api.delete(`/periods-new/${periodName}/influencers/${influencerId}`).then(res => res.data),

  // 批量清除期数下的所有达人关联记录
  clearAllInfluencers: (periodName: string): Promise<any> =>
    api.delete(`/periods-new/${periodName}/influencers`).then(res => res.data),

  // 获取期数统计数据（新API）
  getNewStats: (periodName: string): Promise<any> =>
    api.get(`/periods-new/${periodName}/stats`).then(res => res.data),

  // 批量操作
  batch: (operation: string, periodIds: string[], data?: any): Promise<any> =>
    api.post('/periods-new/batch', { operation, periodIds, data }).then(res => res.data),
}

// 作品维度API
export const workApi = {
  // 获取作品数据
  list: (params: { periods?: string[]; darenIds?: string[]; page?: number; limit?: number } = {}): Promise<any> =>
    api.get('/works', { params }).then(res => res.data),
}

// 分析API
export const analyticsApi = {
  // 获取分析数据
  get: (params: { startDate?: string; endDate?: string } = {}): Promise<any> =>
    api.get('/analytics', { params }).then(res => res.data),
}

// Cookie管理接口
export interface Cookie {
  _id: string
  name: string
  platform: string
  value: string
  description?: string
  domain?: string
  path?: string
  httpOnly?: boolean
  secure?: boolean
  expiresAt?: string
  status: 'active' | 'expired' | 'invalid' | 'disabled'
  usage: {
    totalRequests: number
    successfulRequests: number
    lastUsed?: string
    lastSuccess?: string
    lastFailure?: string
    failureCount: number
  }
  validation: {
    isValid: boolean
    lastValidated?: string
    validationMethod?: string
    validationResult?: string
  }
  tags: string[]
  createdBy?: string
  remarks?: string
  createdAt: string
  updatedAt: string
}

export interface CookieListResponse {
  cookies: Cookie[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export const cookieApi = {
  // 获取Cookie列表
  list: (params: {
    platform?: string
    status?: string
    page?: number
    limit?: number
    search?: string
  } = {}): Promise<CookieListResponse> =>
    api.get('/cookies', { params }).then(res => res.data),

  // 获取单个Cookie
  get: (id: string): Promise<Cookie> =>
    api.get(`/cookies/${id}`).then(res => res.data),

  // 创建Cookie
  create: (data: Partial<Cookie>): Promise<Cookie> =>
    api.post('/cookies', data).then(res => res.data),

  // 更新Cookie
  update: (id: string, data: Partial<Cookie>): Promise<Cookie> =>
    api.put(`/cookies/${id}`, data).then(res => res.data),

  // 删除Cookie
  delete: (id: string): Promise<void> =>
    api.delete(`/cookies/${id}`).then(res => res.data),

  // 获取平台Cookie
  getByPlatform: (platform: string): Promise<Cookie[]> =>
    api.get(`/cookies/platform/${platform}`).then(res => res.data),

  // 获取有效Cookie
  getValid: (platform?: string): Promise<Cookie[]> =>
    api.get(`/cookies/valid/${platform || ''}`).then(res => res.data),

  // 获取随机Cookie
  getRandom: (platform?: string): Promise<Cookie> =>
    api.get(`/cookies/random/${platform || ''}`).then(res => res.data),

  // 记录使用情况
  recordUsage: (id: string, success: boolean): Promise<any> =>
    api.post(`/cookies/${id}/usage`, { success }).then(res => res.data),

  // 验证Cookie
  validate: (id: string, method: string, result: string): Promise<any> =>
    api.post(`/cookies/${id}/validate`, { method, result }).then(res => res.data),

  // 切换状态
  toggle: (id: string): Promise<any> =>
    api.post(`/cookies/${id}/toggle`).then(res => res.data),

  // 获取统计信息
  getStats: (): Promise<any> =>
    api.get('/cookies/stats').then(res => res.data),

  // 批量操作
  batch: (operation: string, cookieIds: string[], data?: any): Promise<any> =>
    api.post('/cookies/batch', { operation, cookieIds, data }).then(res => res.data),

  // 导入Cookie
  import: (cookies: Partial<Cookie>[], platform?: string): Promise<any> =>
    api.post('/cookies/import', { cookies, platform }).then(res => res.data),

  // 导出Cookie
  export: (params: { platform?: string; status?: string } = {}): Promise<Cookie[]> =>
    api.get('/cookies/export', { params }).then(res => res.data),
}

// 设置管理接口
export interface Setting {
  _id: string
  category: string
  key: string
  value: any
  valueType: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description?: string
  defaultValue?: any
  sensitive?: boolean
  scope: 'global' | 'user' | 'session'
  userId?: string
  validation?: {
    required?: boolean
    min?: number
    max?: number
    pattern?: string
    enum?: string[]
  }
  group?: string
  order?: number
  enabled?: boolean
  lastModifiedBy?: string
  history?: Array<{
    value: any
    modifiedBy: string
    modifiedAt: string
    reason: string
  }>
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface SettingListResponse {
  settings: Setting[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export const settingsApi = {
  // 获取设置列表
  list: (params: {
    category?: string
    group?: string
    userId?: string
    page?: number
    limit?: number
  } = {}): Promise<SettingListResponse> =>
    api.get('/settings', { params }).then(res => res.data),

  // 获取单个设置
  get: (category: string, key: string, userId?: string): Promise<Setting> =>
    api.get(`/settings/${category}/${key}`, { params: { userId } }).then(res => res.data),

  // 获取设置值
  getValue: (category: string, key: string, userId?: string): Promise<{ value: any }> =>
    api.get(`/settings/${category}/${key}/value`, { params: { userId } }).then(res => res.data),

  // 创建或更新设置
  set: (category: string, key: string, data: {
    value: any
    description?: string
    userId?: string
    modifiedBy?: string
    reason?: string
  }): Promise<Setting> =>
    api.post(`/settings/${category}/${key}`, data).then(res => res.data),

  // 更新设置值
  update: (category: string, key: string, data: {
    value: any
    userId?: string
    modifiedBy?: string
    reason?: string
  }): Promise<Setting> =>
    api.put(`/settings/${category}/${key}`, data).then(res => res.data),

  // 删除设置
  delete: (category: string, key: string, userId?: string): Promise<void> =>
    api.delete(`/settings/${category}/${key}`, { params: { userId } }).then(res => res.data),

  // 重置为默认值
  reset: (category: string, key: string, data: {
    userId?: string
    modifiedBy?: string
  }): Promise<Setting> =>
    api.post(`/settings/${category}/${key}/reset`, data).then(res => res.data),

  // 获取分类列表
  getCategories: (): Promise<string[]> =>
    api.get('/settings/categories').then(res => res.data),

  // 获取组列表
  getGroups: (category?: string): Promise<string[]> =>
    api.get('/settings/groups', { params: { category } }).then(res => res.data),

  // 批量更新
  batch: (data: {
    settings: Array<{ category: string; key: string; value: any }>
    userId?: string
    modifiedBy?: string
    reason?: string
  }): Promise<any> =>
    api.post('/settings/batch', data).then(res => res.data),

  // 导出设置
  export: (params: { category?: string; userId?: string } = {}): Promise<Setting[]> =>
    api.get('/settings/export', { params }).then(res => res.data),

  // 导入设置
  import: (data: {
    settings: Partial<Setting>[]
    userId?: string
    modifiedBy?: string
    overwrite?: boolean
  }): Promise<any> =>
    api.post('/settings/import', data).then(res => res.data),

  // 初始化默认设置
  initialize: (): Promise<any> =>
    api.post('/settings/initialize').then(res => res.data),

  // 获取设置历史
  getHistory: (category: string, key: string, userId?: string): Promise<any> =>
    api.get(`/settings/${category}/${key}/history`, { params: { userId } }).then(res => res.data),
}

export default api