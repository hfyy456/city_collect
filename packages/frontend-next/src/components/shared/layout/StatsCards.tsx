/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-08-13 02:32:01
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-08-13 02:40:00
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, TrendingUp, BarChart3 } from 'lucide-react'
import { formatNumber, formatCurrency } from '@/lib/utils'

interface StatsData {
  totalInfluencers: number
  totalInvestment: number
  totalInteractions: number
  averageROI: number
}

interface StatsCardsProps {
  stats: StatsData
  loading?: boolean
}

export function StatsCards({ stats, loading = false }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statsConfig = [
    {
      title: '总达人数',
      value: stats.totalInfluencers,
      icon: Users,
      formatter: (value: number) => value.toString(),
      trend: '+12.5% 较上月',
      color: 'text-blue-600'
    },
    {
      title: '总投入',
      value: stats.totalInvestment,
      icon: DollarSign,
      formatter: formatCurrency,
      trend: '+8.2% 较上月',
      color: 'text-green-600'
    },
    {
      title: '总互动数',
      value: stats.totalInteractions,
      icon: TrendingUp,
      formatter: formatNumber,
      trend: '+15.3% 较上月',
      color: 'text-purple-600'
    },
    {
      title: '平均ROI',
      value: stats.averageROI,
      icon: BarChart3,
      formatter: (value: number) => `${value.toFixed(1)}%`,
      trend: '+2.1% 较上月',
      color: 'text-orange-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsConfig.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.formatter(stat.value)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export type { StatsData }