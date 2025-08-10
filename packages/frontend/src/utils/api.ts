import axios from 'axios'
import { ElMessage } from 'element-plus'

// Performance monitoring interface
interface PerformanceMonitor {
  recordApiCall: (endpoint: string, responseTime: number, success: boolean) => void
  recordError: (type: string, message: string, stack?: string) => void
}

class ApiClient {
  private instance: any
  private performanceMonitor?: PerformanceMonitor

  constructor(baseURL: string = 'http://localhost:3000/api') {
    this.instance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  setPerformanceMonitor(monitor: PerformanceMonitor) {
    this.performanceMonitor = monitor
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Add timestamp for performance monitoring
        config.metadata = { startTime: Date.now() }
        
        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId()
        
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('❌ Request Error:', error)
        this.performanceMonitor?.recordError('Request Error', error.message)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: any) => {
        const config = response.config as any
        const responseTime = Date.now() - (config.metadata?.startTime || 0)
        
        console.log(`✅ API Response: ${config.method?.toUpperCase()} ${config.url} - ${responseTime}ms`)
        
        // Record performance metrics
        this.performanceMonitor?.recordApiCall(
          `${config.method?.toUpperCase()} ${config.url}`,
          responseTime,
          true
        )

        // Show success message for certain operations
        if (this.shouldShowSuccessMessage(config)) {
          ElMessage.success(this.getSuccessMessage(config))
        }

        return response
      },
      (error) => {
        const config = error.config as any
        const responseTime = config?.metadata ? Date.now() - config.metadata.startTime : 0
        
        console.error(`❌ API Error: ${config?.method?.toUpperCase()} ${config?.url} - ${responseTime}ms`, error)
        
        // Record performance metrics
        this.performanceMonitor?.recordApiCall(
          `${config?.method?.toUpperCase()} ${config?.url}`,
          responseTime,
          false
        )

        // Record error
        this.performanceMonitor?.recordError(
          'API Error',
          error.message,
          error.stack
        )

        // Handle different error types
        this.handleApiError(error)
        
        return Promise.reject(error)
      }
    )
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  private shouldShowSuccessMessage(config: any): boolean {
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

  private getSuccessMessage(config: any): string {
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

  private handleApiError(error: any) {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message
    
    switch (status) {
      case 400:
        ElMessage.error(`请求错误: ${message}`)
        break
      case 401:
        ElMessage.error('未授权访问，请重新登录')
        // Could redirect to login page here
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

  // Enhanced request methods with retry logic
  async get<T = any>(url: string, config?: any): Promise<any> {
    return this.retryRequest(() => this.instance.get<T>(url, config))
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<any> {
    return this.retryRequest(() => this.instance.post<T>(url, data, config))
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<any> {
    return this.retryRequest(() => this.instance.put<T>(url, data, config))
  }

  async delete<T = any>(url: string, config?: any): Promise<any> {
    return this.retryRequest(() => this.instance.delete<T>(url, config))
  }

  private async retryRequest<T>(requestFn: () => Promise<T>, maxRetries: number = 2): Promise<T> {
    let lastError: any
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn()
      } catch (error: any) {
        lastError = error
        
        // Don't retry for client errors (4xx) except 429
        if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
          throw error
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw error
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000
        console.log(`🔄 Retrying request in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError
  }

  // Batch request utility
  async batchRequest<T = any>(requests: Array<() => Promise<any>>): Promise<any[]> {
    const results = await Promise.allSettled(requests.map(req => req()))
    
    const successful = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)
    
    const failed = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason)
    
    if (failed.length > 0) {
      console.warn(`Batch request completed with ${failed.length} failures:`, failed)
      this.performanceMonitor?.recordError('Batch Request', `${failed.length} requests failed`)
    }
    
    return successful
  }

  // Upload with progress
  async uploadWithProgress<T = any>(
    url: string, 
    data: FormData, 
    onProgress?: (progress: number) => void
  ): Promise<any> {
    return this.instance.post<T>(url, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    })
  }

  // Cancel all pending requests
  cancelAllRequests() {
    // This would require implementing a request cancellation system
    console.log('Cancelling all pending requests...')
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health')
      return true
    } catch (error) {
      return false
    }
  }
}

// Create and export the API client instance
export const api = new ApiClient()

// Export types for use in components
export type { PerformanceMonitor }
export default api