'use client'

import { ReactNode } from 'react'
import { Navigation } from './Navigation'
import { NavigationBreadcrumb } from './NavigationBreadcrumb'

interface AppLayoutProps {
  children: ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
}

const getPageInfo = (activeTab: string) => {
  switch (activeTab) {
    case 'darens':
      return {
        title: '达人管理',
        description: '管理达人信息、查看达人数据统计',
        breadcrumb: [{ label: '达人管理', active: true }]
      }
    case 'periods':
      return {
        title: '期数管理',
        description: '管理期数信息、设置时间维度',
        breadcrumb: [{ label: '期数管理', active: true }]
      }
    case 'analytics':
      return {
        title: '数据分析',
        description: '查看统计报告和数据分析',
        breadcrumb: [{ label: '数据分析', active: true }]
      }
    case 'database':
      return {
        title: '数据库管理',
        description: '数据库维护和管理工具',
        breadcrumb: [{ label: '数据库管理', active: true }]
      }
    default:
      return {
        title: '达人管理',
        description: '管理达人信息、查看达人数据统计',
        breadcrumb: [{ label: '达人管理', active: true }]
      }
  }
}

export function AppLayout({ children, activeTab, onTabChange }: AppLayoutProps) {
  const pageInfo = getPageInfo(activeTab)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabChange={onTabChange} />
      
      {/* Main Content */}
      <main className="relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-100 to-blue-100 rounded-full opacity-30 blur-3xl" />
        </div>
        
        {/* Content container */}
        <div className="relative max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <NavigationBreadcrumb items={pageInfo.breadcrumb} className="mb-4" />
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{pageInfo.title}</h1>
              <p className="text-gray-600">{pageInfo.description}</p>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 lg:p-8">
            {children}
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="relative mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>© 2024 City Collect. 达人管理系统 - 让数据管理更简单</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AppLayout