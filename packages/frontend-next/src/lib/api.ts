import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3000/api',
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

export default api