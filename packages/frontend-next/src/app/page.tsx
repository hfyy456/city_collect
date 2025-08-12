/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-08-13 02:19:11
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-08-13 03:02:15
 */
'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/shared/layout'
import { DarenManagement } from '@/components/pages/daren'
import { PeriodManagement } from '@/components/pages/periods'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('darens')

  const renderContent = () => {
    switch (activeTab) {
      case 'darens':
        return <DarenManagement />
      case 'periods':
        return <PeriodManagement />
      case 'analytics':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">数据分析</h3>
              <p className="text-gray-500">此功能正在开发中，敬请期待...</p>
            </div>
          </div>
        )
      case 'database':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">数据库管理</h3>
              <p className="text-gray-500">此功能正在开发中，敬请期待...</p>
            </div>
          </div>
        )
      default:
        return <DarenManagement />
    }
  }

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-6">
        {renderContent()}
      </div>
    </AppLayout>
  )
}