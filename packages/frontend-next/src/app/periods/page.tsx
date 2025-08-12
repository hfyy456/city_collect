'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { darenApi, type Daren, type PeriodData } from '@/lib/api'
import { formatNumber, formatCurrency } from '@/lib/utils'
import { Search, Filter, ExternalLink, DollarSign, TrendingUp, Users, ArrowLeft, UserPlus } from 'lucide-react'
import { AddDarenToPeriodDialog } from '@/components/AddDarenToPeriodDialog'

export default function PeriodsPage() {
  const [periods, setPeriods] = useState<string[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [darens, setDarens] = useState<Daren[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // 期数统计数据
  const [periodStats, setPeriodStats] = useState({
    totalDarens: 0,
    totalInvestment: 0,
    totalEngagement: 0
  })

  // 加载所有期数
  const loadPeriods = async () => {
    try {
      const periodsData = await darenApi.getPeriods()
      setPeriods(periodsData.sort().reverse()) // 按期数倒序排列
      if (periodsData.length > 0 && !selectedPeriod) {
        setSelectedPeriod(periodsData.sort().reverse()[0]) // 选择最新期数
      }
    } catch (error) {
      console.error('加载期数失败:', error)
    }
  }

  // 加载指定期数的达人数据
  const loadPeriodDarens = async (period: string) => {
    if (!period) return
    
    try {
      setLoading(true)
      // 获取所有达人，然后筛选出参与该期数的达人
      const allDarensResponse = await darenApi.list({ limit: 1000 })
      const periodDarens = allDarensResponse.items.filter(daren => 
        daren.periodData?.some(p => p.period === period)
      )
      
      setDarens(periodDarens)
      
      // 计算期数统计
      const totalInvestment = periodDarens.reduce((sum: number, daren: Daren) => {
        const periodData = daren.periodData?.find(p => p.period === period)
        return sum + (periodData?.fee || 0)
      }, 0)
      
      const totalEngagement = periodDarens.reduce((sum: number, daren: Daren) => {
        const periodData = daren.periodData?.find(p => p.period === period)
        return sum + (periodData?.likes || 0) + (periodData?.comments || 0) + (periodData?.collections || 0)
      }, 0)
      
      setPeriodStats({
        totalDarens: periodDarens.length,
        totalInvestment,
        totalEngagement
      })
    } catch (error) {
      console.error('加载期数达人数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPeriods()
  }, [])

  useEffect(() => {
    if (selectedPeriod) {
      loadPeriodDarens(selectedPeriod)
    }
  }, [selectedPeriod])

  // 获取达人在当前期数的数据
  const getPeriodData = (daren: Daren): PeriodData | null => {
    return daren.periodData?.find(p => p.period === selectedPeriod) || null
  }

  // 获取状态对应的Badge样式
  const getStatusVariant = (status: string) => {
    switch (status) {
      case '待联系':
        return 'secondary'
      case '已联系':
      case '已建联':
        return 'outline'
      case '已到店':
        return 'default'
      case '已审稿':
        return 'secondary'
      case '已发布':
        return 'default'
      case '已完成':
        return 'default'
      default:
        return 'secondary'
    }
  }

  // 过滤达人
  const filteredDarens = darens.filter(daren => 
    daren.nickname.toLowerCase().includes(searchTerm.toLowerCase()) &&
    daren.periodData?.some(p => p.period === selectedPeriod)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <a href="/" className="flex items-center">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回主页
                </a>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">期数管理</h1>
                <p className="text-gray-600">按期数查看达人合作详情</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 期数选择 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>选择期数</CardTitle>
            <CardDescription>选择要查看的合作期数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {periods.map(period => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "outline"}
                  onClick={() => setSelectedPeriod(period)}
                  className="mb-2"
                >
                  {period}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedPeriod && (
          <>
            {/* 期数统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">参与达人数</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{periodStats.totalDarens}</div>
                  <p className="text-xs text-muted-foreground">
                    {selectedPeriod} 期数
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">总投入</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(periodStats.totalInvestment)}</div>
                  <p className="text-xs text-muted-foreground">
                    当期报价总和
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">总互动数</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(periodStats.totalEngagement)}</div>
                  <p className="text-xs text-muted-foreground">
                    点赞+评论+收藏
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 搜索和筛选 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{selectedPeriod} 期达人详情</CardTitle>
                <CardDescription>查看当期达人的报价和作品数据</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="搜索达人昵称..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <AddDarenToPeriodDialog 
                    period={selectedPeriod} 
                    onSuccess={() => loadPeriodDarens(selectedPeriod)}
                  />
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    筛选
                  </Button>
                </div>

                {/* 期数达人列表表格 */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>达人信息</TableHead>
                        <TableHead>当期报价</TableHead>
                        <TableHead>当期状态</TableHead>
                        <TableHead>到店时间</TableHead>
                        <TableHead>作品链接</TableHead>
                        <TableHead>曝光数</TableHead>
                        <TableHead>阅读数</TableHead>
                        <TableHead>点赞数</TableHead>
                        <TableHead>评论数</TableHead>
                        <TableHead>收藏数</TableHead>
                        <TableHead>转发数</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center py-8">
                            加载中...
                          </TableCell>
                        </TableRow>
                      ) : filteredDarens.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center py-8">
                            暂无数据
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDarens.map((daren) => {
                          const periodData = getPeriodData(daren)
                          return (
                            <TableRow key={daren._id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{daren.nickname}</div>
                                  <div className="text-sm text-gray-500">{daren.xiaohongshuId}</div>
                                  {daren.ipLocation && (
                                    <div className="text-xs text-gray-400">📍 {daren.ipLocation}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-green-600">
                                  {periodData?.fee ? formatCurrency(periodData.fee) : '-'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Badge 
                                    variant={getStatusVariant(periodData?.currentStatus || '待联系')}
                                    className="text-xs"
                                  >
                                    {periodData?.currentStatus || '待联系'}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {periodData?.storeArrivalTime ? 
                                    new Date(periodData.storeArrivalTime).toLocaleDateString('zh-CN') : 
                                    '-'
                                  }
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {periodData?.mainPublishLink && (
                                    <div>
                                      <a 
                                        href={periodData.mainPublishLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-500 hover:text-blue-700 flex items-center"
                                      >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        主发布
                                      </a>
                                    </div>
                                  )}
                                  {periodData?.syncPublishLink && (
                                    <div>
                                      <a 
                                        href={periodData.syncPublishLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-purple-500 hover:text-purple-700 flex items-center"
                                      >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        同步发布
                                      </a>
                                    </div>
                                  )}
                                  {!periodData?.mainPublishLink && !periodData?.syncPublishLink && (
                                    <span className="text-xs text-gray-400">暂无链接</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {periodData?.exposure ? formatNumber(periodData.exposure) : '-'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {periodData?.reads ? formatNumber(periodData.reads) : '-'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-red-600">
                                  {periodData?.likes ? formatNumber(periodData.likes) : '-'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-blue-600">
                                  {periodData?.comments ? formatNumber(periodData.comments) : '-'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-yellow-600">
                                  {periodData?.collections ? formatNumber(periodData.collections) : '-'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-green-600">
                                  {periodData?.forwards ? formatNumber(periodData.forwards) : '-'}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}