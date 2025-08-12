'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { 
  Activity, 
  Clock, 
  Zap, 
  Database, 
  Wifi, 
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Info,
  Gauge
} from 'lucide-react'

interface PerformanceMetrics {
  // 页面性能
  loadTime: number
  domContentLoaded: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  
  // 网络性能
  networkLatency: number
  connectionType: string
  
  // 内存使用
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  
  // API性能
  apiResponseTimes: {
    average: number
    slowest: number
    fastest: number
  }
  
  // 用户体验
  cumulativeLayoutShift: number
  firstInputDelay: number
  
  // 系统状态
  timestamp: number
  errors: number
}

interface PerformanceAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  message: string
  timestamp: number
  metric: string
  value: number
  threshold: number
}

export function PerformanceMonitor() {
  const [isOpen, setIsOpen] = useState(false)
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const apiTimesRef = useRef<number[]>([])

  useEffect(() => {
    if (isMonitoring) {
      startMonitoring()
    } else {
      stopMonitoring()
    }

    return () => stopMonitoring()
  }, [isMonitoring])

  const startMonitoring = () => {
    // 立即收集一次指标
    collectMetrics()
    
    // 每5秒收集一次指标
    intervalRef.current = setInterval(collectMetrics, 5000)
  }

  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const collectMetrics = async () => {
    try {
      const newMetrics = await gatherPerformanceMetrics()
      setMetrics(newMetrics)
      checkAlerts(newMetrics)
    } catch (error) {
      console.error('性能指标收集失败:', error)
    }
  }

  const gatherPerformanceMetrics = async (): Promise<PerformanceMetrics> => {
    // 页面性能指标
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')
    
    const loadTime = navigation ? navigation.loadEventEnd - navigation.fetchStart : 0
    const domContentLoaded = navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0
    const firstContentfulPaint = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
    
    // 网络信息
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    const networkLatency = navigation ? navigation.responseStart - navigation.requestStart : 0
    
    // 内存使用（如果支持）
    const memory = (performance as any).memory
    const memoryUsage = memory ? {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
    } : { used: 0, total: 0, percentage: 0 }
    
    // API响应时间统计
    const apiTimes = apiTimesRef.current
    const apiResponseTimes = {
      average: apiTimes.length > 0 ? apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length : 0,
      slowest: apiTimes.length > 0 ? Math.max(...apiTimes) : 0,
      fastest: apiTimes.length > 0 ? Math.min(...apiTimes) : 0
    }
    
    // Web Vitals
    const cls = await getCLS()
    const fid = await getFID()
    
    return {
      loadTime,
      domContentLoaded,
      firstContentfulPaint,
      largestContentfulPaint: 0, // 需要通过 PerformanceObserver 获取
      networkLatency,
      connectionType: connection?.effectiveType || 'unknown',
      memoryUsage,
      apiResponseTimes,
      cumulativeLayoutShift: cls,
      firstInputDelay: fid,
      timestamp: Date.now(),
      errors: 0 // 可以通过错误监听器收集
    }
  }

  const getCLS = (): Promise<number> => {
    return new Promise((resolve) => {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
      })
      
      try {
        observer.observe({ type: 'layout-shift', buffered: true })
        setTimeout(() => {
          observer.disconnect()
          resolve(clsValue)
        }, 1000)
      } catch {
        resolve(0)
      }
    })
  }

  const getFID = (): Promise<number> => {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          resolve((entry as any).processingStart - entry.startTime)
          observer.disconnect()
          return
        }
      })
      
      try {
        observer.observe({ type: 'first-input', buffered: true })
        setTimeout(() => {
          observer.disconnect()
          resolve(0)
        }, 5000)
      } catch {
        resolve(0)
      }
    })
  }

  const checkAlerts = (metrics: PerformanceMetrics) => {
    const newAlerts: PerformanceAlert[] = []
    const now = Date.now()

    // 检查页面加载时间
    if (metrics.loadTime > 3000) {
      newAlerts.push({
        id: `load-time-${now}`,
        type: 'warning',
        message: '页面加载时间过长',
        timestamp: now,
        metric: 'loadTime',
        value: metrics.loadTime,
        threshold: 3000
      })
    }

    // 检查内存使用
    if (metrics.memoryUsage.percentage > 80) {
      newAlerts.push({
        id: `memory-${now}`,
        type: 'error',
        message: '内存使用率过高',
        timestamp: now,
        metric: 'memoryUsage',
        value: metrics.memoryUsage.percentage,
        threshold: 80
      })
    }

    // 检查API响应时间
    if (metrics.apiResponseTimes.average > 2000) {
      newAlerts.push({
        id: `api-${now}`,
        type: 'warning',
        message: 'API响应时间过长',
        timestamp: now,
        metric: 'apiResponseTime',
        value: metrics.apiResponseTimes.average,
        threshold: 2000
      })
    }

    // 检查CLS
    if (metrics.cumulativeLayoutShift > 0.1) {
      newAlerts.push({
        id: `cls-${now}`,
        type: 'warning',
        message: '页面布局稳定性较差',
        timestamp: now,
        metric: 'cumulativeLayoutShift',
        value: metrics.cumulativeLayoutShift,
        threshold: 0.1
      })
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]) // 保留最新的10个警告
    }
  }

  // 监听API请求（可以通过拦截器实现）
  const recordApiTime = (responseTime: number) => {
    apiTimesRef.current = [...apiTimesRef.current.slice(-19), responseTime] // 保留最近20次请求
  }

  const getPerformanceScore = (metrics: PerformanceMetrics): number => {
    let score = 100
    
    // 页面加载时间评分
    if (metrics.loadTime > 3000) score -= 20
    else if (metrics.loadTime > 1500) score -= 10
    
    // 内存使用评分
    if (metrics.memoryUsage.percentage > 80) score -= 25
    else if (metrics.memoryUsage.percentage > 60) score -= 10
    
    // API响应时间评分
    if (metrics.apiResponseTimes.average > 2000) score -= 20
    else if (metrics.apiResponseTimes.average > 1000) score -= 10
    
    // CLS评分
    if (metrics.cumulativeLayoutShift > 0.1) score -= 15
    else if (metrics.cumulativeLayoutShift > 0.05) score -= 5
    
    return Math.max(0, score)
  }

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return '优秀'
    if (score >= 70) return '良好'
    if (score >= 50) return '一般'
    return '需要优化'
  }

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>性能监控</span>
              {metrics && (
                <Badge 
                  variant={getPerformanceScore(metrics) >= 70 ? 'default' : 'destructive'}
                  className={getScoreColor(getPerformanceScore(metrics))}
                >
                  {getPerformanceScore(metrics)}分 - {getScoreLabel(getPerformanceScore(metrics))}
                </Badge>
              )}
              {alerts.length > 0 && (
                <Badge variant="destructive">
                  {alerts.length} 个警告
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              实时监控系统性能和用户体验指标
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={isMonitoring ? 'destructive' : 'default'}
              size="sm"
              onClick={() => setIsMonitoring(!isMonitoring)}
            >
              {isMonitoring ? '停止监控' : '开始监控'}
            </Button>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  <Gauge className="w-4 h-4 mr-2" />
                  {isOpen ? '收起' : '详情'}
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
      </CardHeader>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {!metrics && (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>点击"开始监控"来收集性能数据</p>
              </div>
            )}

            {metrics && (
              <>
                {/* 警告列表 */}
                {alerts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span>性能警告</span>
                    </h4>
                    <div className="space-y-2">
                      {alerts.slice(0, 3).map(alert => (
                        <div key={alert.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            {alert.type === 'error' ? (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            ) : alert.type === 'warning' ? (
                              <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            ) : (
                              <Info className="w-4 h-4 text-blue-500" />
                            )}
                            <span className="text-sm font-medium">{alert.message}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 核心指标 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">页面加载</span>
                    </div>
                    <div className="text-2xl font-bold">{formatTime(metrics.loadTime)}</div>
                    <Progress value={Math.min(100, (3000 - metrics.loadTime) / 30)} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">内存使用</span>
                    </div>
                    <div className="text-2xl font-bold">{metrics.memoryUsage.percentage.toFixed(1)}%</div>
                    <Progress value={metrics.memoryUsage.percentage} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">API响应</span>
                    </div>
                    <div className="text-2xl font-bold">{formatTime(metrics.apiResponseTimes.average)}</div>
                    <Progress value={Math.min(100, (2000 - metrics.apiResponseTimes.average) / 20)} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Wifi className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">网络延迟</span>
                    </div>
                    <div className="text-2xl font-bold">{formatTime(metrics.networkLatency)}</div>
                    <div className="text-xs text-gray-500">{metrics.connectionType}</div>
                  </div>
                </div>

                <Separator />

                {/* 详细指标 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">页面性能</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">DOM内容加载</span>
                        <span className="text-sm font-medium">{formatTime(metrics.domContentLoaded)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">首次内容绘制</span>
                        <span className="text-sm font-medium">{formatTime(metrics.firstContentfulPaint)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">累积布局偏移</span>
                        <span className="text-sm font-medium">{metrics.cumulativeLayoutShift.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">首次输入延迟</span>
                        <span className="text-sm font-medium">{formatTime(metrics.firstInputDelay)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">系统资源</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">已用内存</span>
                        <span className="text-sm font-medium">{formatBytes(metrics.memoryUsage.used)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">总内存</span>
                        <span className="text-sm font-medium">{formatBytes(metrics.memoryUsage.total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">最快API</span>
                        <span className="text-sm font-medium">{formatTime(metrics.apiResponseTimes.fastest)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">最慢API</span>
                        <span className="text-sm font-medium">{formatTime(metrics.apiResponseTimes.slowest)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  最后更新: {new Date(metrics.timestamp).toLocaleString()}
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}