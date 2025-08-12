'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // 这里可以添加错误日志上报
    this.setState({
      error,
      errorInfo
    })
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

// 默认错误回退组件
function DefaultErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            出现了一些问题
          </CardTitle>
          <CardDescription>
            应用遇到了意外错误，请尝试刷新页面或返回首页
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment && error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <h4 className="text-sm font-medium text-red-800 mb-2">错误详情 (开发模式):</h4>
              <pre className="text-xs text-red-700 whitespace-pre-wrap break-all">
                {error.message}
              </pre>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 cursor-pointer">查看堆栈信息</summary>
                  <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap break-all">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
          
          <div className="flex space-x-3">
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'} className="flex-1">
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 页面级错误回退组件
export function PageErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 保持头部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">City Collect</h1>
              <p className="text-gray-600">达人管理系统</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              页面加载失败
            </CardTitle>
            <CardDescription className="text-base">
              当前页面遇到了问题，请尝试刷新页面或联系技术支持
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {process.env.NODE_ENV === 'development' && error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">错误信息:</h4>
                <p className="text-sm text-red-700">{error.message}</p>
              </div>
            )}
            
            <div className="flex justify-center space-x-4">
              <Button onClick={resetError} size="lg">
                <RefreshCw className="w-4 h-4 mr-2" />
                重新加载
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'} size="lg">
                <Home className="w-4 h-4 mr-2" />
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 组件级错误回退
export function ComponentErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="border border-red-200 bg-red-50 rounded-md p-4">
      <div className="flex items-center space-x-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <h3 className="text-sm font-medium text-red-800">组件加载失败</h3>
      </div>
      <p className="text-sm text-red-700 mb-3">
        该组件遇到了问题，请尝试重新加载
      </p>
      {process.env.NODE_ENV === 'development' && error && (
        <p className="text-xs text-red-600 mb-3 font-mono">{error.message}</p>
      )}
      <Button size="sm" variant="outline" onClick={resetError}>
        <RefreshCw className="w-3 h-3 mr-1" />
        重试
      </Button>
    </div>
  )
}

export default ErrorBoundary