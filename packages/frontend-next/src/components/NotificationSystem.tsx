'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// 通知类型
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

// 通知接口
export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  persistent?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

// 通知上下文
interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => string
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// 通知Hook
export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// 便捷的通知方法
export function useToast() {
  const { addNotification } = useNotifications()

  return {
    success: (title: string, message?: string, options?: Partial<Notification>) => 
      addNotification({ type: 'success', title, message, ...options }),
    
    error: (title: string, message?: string, options?: Partial<Notification>) => 
      addNotification({ type: 'error', title, message, persistent: true, ...options }),
    
    warning: (title: string, message?: string, options?: Partial<Notification>) => 
      addNotification({ type: 'warning', title, message, ...options }),
    
    info: (title: string, message?: string, options?: Partial<Notification>) => 
      addNotification({ type: 'info', title, message, ...options }),
  }
}

// 通知提供者组件
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      id,
      duration: 5000, // 默认5秒
      ...notification,
    }

    setNotifications(prev => [...prev, newNotification])

    // 自动移除（除非是持久化通知）
    if (!newNotification.persistent && newNotification.duration) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

// 通知容器组件
function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

// 单个通知组件
function NotificationItem({ 
  notification, 
  onClose 
}: { 
  notification: Notification
  onClose: () => void 
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // 进入动画
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(onClose, 200) // 等待退出动画完成
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getStyles = () => {
    const baseStyles = "border-l-4 bg-white shadow-lg rounded-md p-4 transition-all duration-200 ease-in-out"
    
    if (isLeaving) {
      return cn(baseStyles, "transform translate-x-full opacity-0")
    }
    
    if (!isVisible) {
      return cn(baseStyles, "transform translate-x-full opacity-0")
    }

    switch (notification.type) {
      case 'success':
        return cn(baseStyles, "border-green-500 transform translate-x-0 opacity-100")
      case 'error':
        return cn(baseStyles, "border-red-500 transform translate-x-0 opacity-100")
      case 'warning':
        return cn(baseStyles, "border-yellow-500 transform translate-x-0 opacity-100")
      case 'info':
        return cn(baseStyles, "border-blue-500 transform translate-x-0 opacity-100")
      default:
        return cn(baseStyles, "border-gray-500 transform translate-x-0 opacity-100")
    }
  }

  return (
    <div className={getStyles()}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">
            {notification.title}
          </h4>
          {notification.message && (
            <p className="text-sm text-gray-600 mt-1">
              {notification.message}
            </p>
          )}
          
          {notification.action && (
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={notification.action.onClick}
              >
                {notification.action.label}
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// 全局通知管理器（用于在组件外部调用）
class NotificationManager {
  private static instance: NotificationManager
  private addNotificationFn?: (notification: Omit<Notification, 'id'>) => string

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  setAddNotificationFn(fn: (notification: Omit<Notification, 'id'>) => string) {
    this.addNotificationFn = fn
  }

  success(title: string, message?: string, options?: Partial<Notification>) {
    if (this.addNotificationFn) {
      return this.addNotificationFn({ type: 'success', title, message, ...options })
    }
  }

  error(title: string, message?: string, options?: Partial<Notification>) {
    if (this.addNotificationFn) {
      return this.addNotificationFn({ type: 'error', title, message, persistent: true, ...options })
    }
  }

  warning(title: string, message?: string, options?: Partial<Notification>) {
    if (this.addNotificationFn) {
      return this.addNotificationFn({ type: 'warning', title, message, ...options })
    }
  }

  info(title: string, message?: string, options?: Partial<Notification>) {
    if (this.addNotificationFn) {
      return this.addNotificationFn({ type: 'info', title, message, ...options })
    }
  }
}

export const notificationManager = NotificationManager.getInstance()

// 初始化组件（在应用根部使用）
export function NotificationInitializer() {
  const { addNotification } = useNotifications()
  
  useEffect(() => {
    notificationManager.setAddNotificationFn(addNotification)
  }, [addNotification])
  
  return null
}