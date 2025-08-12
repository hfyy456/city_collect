'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { darenApi, type Daren, type PeriodData } from '@/lib/api'
import { formatNumber, formatCurrency } from '@/lib/utils'
import { Search, Filter, ExternalLink, DollarSign, TrendingUp, Users, UserPlus } from 'lucide-react'
import { AddDarenToPeriodDialog } from '@/components/AddDarenToPeriodDialog'
import { EditPeriodDataDialog } from '@/components/EditPeriodDataDialog'

export function PeriodManagement() {
  const [darens, setDarens] = useState<Daren[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [periods, setPeriods] = useState<string[]>([])
  const [stats, setStats] = useState({
    totalDarens: 0,
    totalInvestment: 0,
    totalInteractions: 0,
    publishedWorks: 0
  })

  const loadDarens = async () => {
    try {
      setLoading(true)
      const response = await darenApi.list()
      setDarens(response.items)
      
      // 提取所有期数
      const allPeriods = new Set<string>()
      response.items.forEach((daren: Daren) => {
        if (daren.periodData && daren.periodData.length > 0) {
          daren.periodData.forEach(period => {
            allPeriods.add(period.period)
          })
        } else if (daren.period) {
          allPeriods.add(daren.period)
        }
      })
      
      const periodsArray = Array.from(allPeriods).sort()
      setPeriods(periodsArray)
      
      // 如果没有选择期数，默认选择最新的期数
      if (!selectedPeriod && periodsArray.length > 0) {
        setSelectedPeriod(periodsArray[periodsArray.length - 1])
      }
    } catch (error) {
      console.error('Failed to load darens:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDarens()
  }, [])

  useEffect(() => {
    if (selectedPeriod) {
      calculateStats()
    }
  }, [selectedPeriod, darens])

  const getPeriodData = (daren: Daren): PeriodData | null => {
    if (daren.periodData && daren.periodData.length > 0) {
      return daren.periodData.find(p => p.period === selectedPeriod) || null
    }
    return null
  }

  const calculateStats = () => {
    const periodDarens = darens.filter(daren => 
      daren.periodData?.some(p => p.period === selectedPeriod)
    )
    
    let totalInvestment = 0
    let totalInteractions = 0
    let publishedWorks = 0
    
    periodDarens.forEach(daren => {
      const periodData = getPeriodData(daren)
      if (periodData) {
        totalInvestment += (periodData.fee || 0)
        // 计算互动数：点赞+收藏+评论
        const likesAndCollections = (periodData.likes || 0) + (periodData.collections || 0)
        totalInteractions += likesAndCollections + (periodData.comments || 0)
        if (periodData.currentStatus === '已发布') {
          publishedWorks++
        }
      }
    })
    
    setStats({
      totalDarens: periodDarens.length,
      totalInvestment,
      totalInteractions,
      publishedWorks
    })
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case '未到店': return 'secondary'
      case '报价不合适': return 'destructive'
      case '已到店': return 'default'
      case '已审稿': return 'default'
      case '已结款': return 'default'
      case '已发布': return 'default'
      default: return 'secondary'
    }
  }

  // 过滤达人
  const filteredDarens = darens.filter(daren => 
    daren.nickname.toLowerCase().includes(searchTerm.toLowerCase()) &&
    daren.periodData?.some(p => p.period === selectedPeriod)
  )

  return (
    <div className="space-y-6">
      {/* 期数选择 */}
      <Card>
        <CardHeader>
          <CardTitle>选择期数</CardTitle>
          <CardDescription>选择要查看的合作期数</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {periods.map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedPeriod && (
        <>
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">参与达人数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDarens}</div>
                <p className="text-xs text-muted-foreground">
                  当期参与达人总数
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总投入</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalInvestment)}</div>
                <p className="text-xs text-muted-foreground">
                  当期总费用支出
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总互动数</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalInteractions)}</div>
                <p className="text-xs text-muted-foreground">
                  点赞与收藏+评论总数
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">已完成作品</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.publishedWorks}</div>
                <p className="text-xs text-muted-foreground">
                  已发布状态的作品数
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 达人列表 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedPeriod} - 达人列表</CardTitle>
                  <CardDescription>查看和管理当期达人合作详情</CardDescription>
                </div>
                <AddDarenToPeriodDialog 
                  period={selectedPeriod} 
                  onSuccess={() => loadDarens()}
                >
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    添加达人到本期
                  </Button>
                </AddDarenToPeriodDialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 搜索 */}
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="搜索达人昵称..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* 表格 */}
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
                        <TableHead>点赞与收藏</TableHead>
                        <TableHead>评论数</TableHead>
                        <TableHead>转发数</TableHead>
                        <TableHead>操作</TableHead>
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
                                    variant={getStatusVariant(periodData?.currentStatus || '未到店')}
                                    className="text-xs"
                                  >
                                    {periodData?.currentStatus || '未到店'}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {periodData?.storeArrivalTime ? 
                                    new Date(periodData.storeArrivalTime).toLocaleString('zh-CN', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : '-'
                                  }
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {periodData?.mainPublishLink && (
                                    <a 
                                      href={periodData.mainPublishLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      主发布
                                    </a>
                                  )}
                                  {periodData?.syncPublishLink && (
                                    <a 
                                      href={periodData.syncPublishLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-green-600 hover:text-green-800 text-xs flex items-center"
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      同步发布
                                    </a>
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
                                <div className="font-medium text-purple-600">
                                  💖 {periodData ? formatNumber((periodData.likes || 0) + (periodData.collections || 0)) : '-'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-blue-600">
                                  {periodData?.comments ? formatNumber(periodData.comments) : '-'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-green-600">
                                  {periodData?.forwards ? formatNumber(periodData.forwards) : '-'}
                                </div>
                              </TableCell>
                              <TableCell>
                                {periodData && (
                                  <EditPeriodDataDialog
                                    daren={daren}
                                    periodData={periodData}
                                    onSuccess={() => loadDarens()}
                                  >
                                    <Button variant="outline" size="sm">
                                      编辑
                                    </Button>
                                  </EditPeriodDataDialog>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}