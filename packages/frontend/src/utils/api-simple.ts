import axios from 'axios'
import { ElMessage } from 'element-plus'

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Performance monitoring interface
interface PerformanceMonitor {
  recordApiCall: (endpoint: string, responseTime: number, success: boolean) => void
  recordError: (type: string, message: string, stack?: string) => void
}

let performanceMonitor: PerformanceMonitor | undefined

// Set performance monitor
export const setPerformanceMonitor = (monitor: PerformanceMonitor) => {
  performanceMonitor = monitor
}

// Request interceptor
api.interceptors.request.use(
  (config: any) => {
    config.metadata = { startTime: Date.now() }
    config.headers['X-Request-ID'] = Math.random().toString(36).substr(2, 9)
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error: any) => {
    console.error('❌ Request Error:', error)
    performanceMonitor?.recordError('Request Error', error.message)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response: any) => {
    const config = response.config
    const responseTime = Date.now() - (config.metadata?.startTime || 0)
    
    console.log(`✅ API Response: ${config.method?.toUpperCase()} ${config.url} - ${responseTime}ms`)
    
    // Record performance metrics
    performanceMonitor?.recordApiCall(
      `${config.method?.toUpperCase()} ${config.url}`,
      responseTime,
      true
    )

    // Show success message for certain operations
    if (shouldShowSuccessMessage(config)) {
      ElMessage.success(getSuccessMessage(config))
    }

    return response
  },
  (error: any) => {
    const config = error.config
    const responseTime = config?.metadata ? Date.now() - config.metadata.startTime : 0
    
    console.error(`❌ API Error: ${config?.method?.toUpperCase()} ${config?.url} - ${responseTime}ms`, error)
    
    // Record performance metrics
    performanceMonitor?.recordApiCall(
      `${config?.method?.toUpperCase()} ${config?.url}`,
      responseTime,
      false
    )

    // Record error
    performanceMonitor?.recordError('API Error', error.message, error.stack)

    // Handle different error types
    handleApiError(error)
    
    return Promise.reject(error)
  }
)

const shouldShowSuccessMessage = (config: any): boolean => {
  const method = config.method?.toUpperCase()
  const url = config.url?.toLowerCase()
  
  // Show success for create, update, delete operations
  return (
    method === 'POST' ||
    method === 'PUT' ||
    method === 'DELETE' ||
    url?.includes('batch')
  )
}

const getSuccessMessage = (config: any): string => {
  const method = config.method?.toUpperCase()
  const url = config.url?.toLowerCase()
  
  if (method === 'POST') {
    if (url?.includes('darens')) return '达人添加成功'
    if (url?.includes('batch')) return '批量操作成功'
    return '操作成功'
  }
  
  if (method === 'PUT') {
    return '更新成功'
  }
  
  if (method === 'DELETE') {
    return '删除成功'
  }
  
  return '操作成功'
}

const handleApiError = (error: any) => {
  const status = error.response?.status
  const message = error.response?.data?.message || error.message
  
  switch (status) {
    case 400:
      ElMessage.error(`请求错误: ${message}`)
      break
    case 401:
      ElMessage.error('未授权访问，请重新登录')
      break
    case 403:
      ElMessage.error('权限不足')
      break
    case 404:
      ElMessage.error('请求的资源不存在')
      break
    case 422:
      ElMessage.error(`数据验证失败: ${message}`)
      break
    case 429:
      ElMessage.error('请求过于频繁，请稍后再试')
      break
    case 500:
      ElMessage.error('服务器内部错误，请联系管理员')
      break
    case 502:
    case 503:
    case 504:
      ElMessage.error('服务暂时不可用，请稍后再试')
      break
    default:
      if (error.code === 'ECONNABORTED') {
        ElMessage.error('请求超时，请检查网络连接')
      } else if (error.code === 'ERR_NETWORK') {
        ElMessage.error('网络连接失败，请检查网络设置')
      } else {
        ElMessage.error(`请求失败: ${message}`)
      }
  }
}

// Enhanced API object with additional methods
const enhancedApi = {
  ...api,
  setPerformanceMonitor,
  
  // Batch request utility
  async batchRequest(requests: Array<() => Promise<any>>): Promise<any[]> {
    const results = await Promise.allSettled(requests.map(req => req()))
    
    const successful = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)
    
    const failed = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason)
    
    if (failed.length > 0) {
      console.warn(`Batch request completed with ${failed.length} failures:`, failed)
      performanceMonitor?.recordError('Batch Request', `${failed.length} requests failed`)
    }
    
    return successful
  },

  // Upload with progress
  async uploadWithProgress(
    url: string, 
    data: FormData, 
    onProgress?: (progress: number) => void
  ): Promise<any> {
    return api.post(url, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    })
  },

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await api.get('/health')
      return true
    } catch (error) {
      return false
    }
  }
}

export { enhancedApi as api }
export type { PerformanceMonitor }
export default enhancedApi