'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { darenApi, periodApi, type Daren, type PeriodData } from '@/lib/api'
import { formatNumber, formatCurrency } from '@/lib/utils'
import { Search, Filter, ExternalLink, DollarSign, TrendingUp, Users, UserPlus, Calendar, BarChart3, Eye, Heart, MessageCircle, Bookmark, Share } from 'lucide-react'
import { AddDarenToPeriodDialog } from '@/components/features/daren/operations'
import { DarenDetailDialog } from '@/components/features/daren/dialogs'
import { useToast } from '@/components/shared/feedback/NotificationSystem'

/**
 * 期数统计数据接口
 */
interface PeriodStats {
  totalDarens: number
  totalInvestment: number
  totalExposure: number
  totalReads: number
  totalLikes: number
  totalComments: number
  totalCollections: number
  totalForwards: number
  publishedWorks: number
  averageEngagement: number
}

/**
 * 期数达人数据接口（包含当前期数数据）
 */
interface PeriodDaren extends Daren {
  currentPeriodData?: PeriodData
}

/**
 * 期数管理页面组件
 * 基于新的期数维度API重构，提供完整的期数管理功能
 */
export function PeriodManagement() {
  // 基础状态
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [periods, setPeriods] = useState<string[]>([])
  const [darens, setDarens] = useState<PeriodDaren[]>([])
  const [stats, setStats] = useState<PeriodStats>({
    totalDarens: 0,
    totalInvestment: 0,
    totalExposure: 0,
    totalReads: 0,
    totalLikes: 0,
    totalComments: 0,
    totalCollections: 0,
    totalForwards: 0,
    publishedWorks: 0,
    averageEngagement: 0
  })
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize] = useState(20)
  
  // 排序状态
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // 达人详情对话框状态
  const [selectedDaren, setSelectedDaren] = useState<Daren | null>(null)
  const [showDarenDetail, setShowDarenDetail] = useState(false)
  
  const toast = useToast()

  /**
   * 加载所有可用期数
   */
  const loadPeriods = async () => {
    try {
      const periodsData = await darenApi.getPeriods()
      setPeriods(periodsData)
      
      // 如果没有选择期数且有可用期数，选择最新的期数
      if (!selectedPeriod && periodsData.length > 0) {
        setSelectedPeriod(periodsData[periodsData.length - 1])
      }
    } catch (error) {
      console.error('加载期数列表失败:', error)
      toast.error('加载期数列表失败')
    }
  }

  /**
   * 加载指定期数的达人数据
   */
  const loadPeriodDarens = async (period: string, page: number = 1) => {
    if (!period) return
    
    try {
      setLoading(true)
      const response = await periodApi.getDarens(period, {
        page,
        limit: pageSize
      })
      
      setDarens(response.items || [])
      setTotalPages(Math.ceil((response.total || 0) / pageSize))
      setCurrentPage(page)
    } catch (error) {
      console.error('加载期数达人数据失败:', error)
      toast.error('加载达人数据失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 加载期数统计数据
   */
  const loadPeriodStats = async (period: string) => {
    if (!period) return
    
    try {
      const statsData = await periodApi.getStats(period)
      setStats(statsData || {
        totalDarens: 0,
        totalInvestment: 0,
        totalExposure: 0,
        totalReads: 0,
        totalLikes: 0,
        totalComments: 0,
        totalCollections: 0,
        totalForwards: 0,
        publishedWorks: 0,
        averageEngagement: 0
      })
    } catch (error) {
      console.error('加载期数统计失败:', error)
      // 如果API不存在，手动计算统计数据
      calculateStatsFromDarens()
    }
  }

  /**
   * 从达人数据手动计算统计信息
   */
  const calculateStatsFromDarens = () => {
    const stats: PeriodStats = {
      totalDarens: darens.length,
      totalInvestment: 0,
      totalExposure: 0,
      totalReads: 0,
      totalLikes: 0,
      totalComments: 0,
      totalCollections: 0,
      totalForwards: 0,
      publishedWorks: 0,
      averageEngagement: 0
    }

    darens.forEach(daren => {
      const periodData = daren.currentPeriodData
      if (periodData) {
        stats.totalInvestment += (periodData.fee || 0)
        stats.totalExposure += (periodData.exposure || 0)
        stats.totalReads += (periodData.reads || 0)
        stats.totalLikes += (periodData.likes || 0)
        stats.totalComments += (periodData.comments || 0)
        stats.totalCollections += (periodData.collections || 0)
        stats.totalForwards += (periodData.forwards || 0)
        
        if (periodData.published || periodData.currentStatus === '已发布') {
          stats.publishedWorks++
        }
      }
    })

    // 计算平均互动率
    const totalEngagement = stats.totalLikes + stats.totalComments + stats.totalCollections + stats.totalForwards
    stats.averageEngagement = stats.totalDarens > 0 ? Math.round(totalEngagement / stats.totalDarens) : 0

    setStats(stats)
  }

  /**
   * 处理期数变更
   */
  const handlePeriodChange = async (period: string) => {
    setSelectedPeriod(period)
    setCurrentPage(1)
    await Promise.all([
      loadPeriodDarens(period, 1),
      loadPeriodStats(period)
    ])
  }

  /**
   * 处理页面变更
   */
  const handlePageChange = (page: number) => {
    loadPeriodDarens(selectedPeriod, page)
  }

  /**
   * 刷新当前期数数据
   */
  const refreshData = async () => {
    if (selectedPeriod) {
      await Promise.all([
        loadPeriodDarens(selectedPeriod, currentPage),
        loadPeriodStats(selectedPeriod)
      ])
    }
  }

  /**
   * 获取状态徽章样式
   */
  const getStatusVariant = (status: string) => {
    switch (status) {
      case '待联系': return 'secondary'
      case '已联系': return 'outline'
      case '已建联': return 'outline'
      case '已到店': return 'default'
      case '已审稿': return 'default'
      case '已发布': return 'default'
      case '已完成': return 'default'
      case '报价不合适': return 'destructive'
      default: return 'secondary'
    }
  }

  /**
   * 过滤达人数据
   */
  const filteredDarens = darens.filter(daren => 
    daren.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  )

  /**
   * 处理达人点击事件
   */
  const handleDarenClick = (daren: PeriodDaren) => {
    setSelectedDaren(daren)
    setShowDarenDetail(true)
  }

  // 初始化加载
  useEffect(() => {
    loadPeriods()
  }, [])

  // 当选择期数变化时加载数据
  useEffect(() => {
    if (selectedPeriod) {
      Promise.all([
        loadPeriodDarens(selectedPeriod, 1),
        loadPeriodStats(selectedPeriod)
      ])
    }
  }, [selectedPeriod])

  // 当达人数据变化时重新计算统计
  useEffect(() => {
    if (darens.length > 0) {
      calculateStatsFromDarens()
    }
  }, [darens])

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">期数管理</h1>
          <p className="text-muted-foreground">管理不同期数的达人合作数据和作品表现</p>
        </div>
      </div>

      {/* 期数选择 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                选择期数
              </CardTitle>
              <CardDescription>选择要查看和管理的合作期数</CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              共 {periods.length} 个期数
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {periods.map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                size="sm"
                onClick={() => handlePeriodChange(period)}
                className="transition-all duration-200"
              >
                {period}
              </Button>
            ))}
            {periods.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                暂无期数数据，请先添加达人到期数中
              </div>
            )}
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
                  已发布: {stats.publishedWorks} 个
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
                  平均: {formatCurrency(stats.totalDarens > 0 ? stats.totalInvestment / stats.totalDarens : 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总曝光量</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalExposure)}</div>
                <p className="text-xs text-muted-foreground">
                  阅读: {formatNumber(stats.totalReads)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总互动量</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats.totalLikes + stats.totalComments + stats.totalCollections)}
                </div>
                <p className="text-xs text-muted-foreground">
                  平均: {formatNumber(stats.averageEngagement)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 达人列表 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {selectedPeriod} - 达人列表
                  </CardTitle>
                  <CardDescription>查看和管理当期达人合作详情</CardDescription>
                </div>
                <AddDarenToPeriodDialog 
                  period={selectedPeriod} 
                  onSuccess={refreshData}
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
                {/* 搜索和筛选 */}
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="搜索达人昵称..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select value={`${sortBy}_${sortOrder}`} onValueChange={(value) => {
                      const [field, order] = value.split('_')
                      setSortBy(field)
                      setSortOrder(order as 'asc' | 'desc')
                    }}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="排序方式" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt_desc">最新添加</SelectItem>
                        <SelectItem value="fee_desc">报价从高到低</SelectItem>
                        <SelectItem value="fee_asc">报价从低到高</SelectItem>
                        <SelectItem value="likes_desc">点赞数从高到低</SelectItem>
                        <SelectItem value="exposure_desc">曝光量从高到低</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button variant="outline" size="sm" onClick={refreshData}>
                      刷新数据
                    </Button>
                  </div>
                </div>

                {/* 数据表格 */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>达人昵称</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={1} className="text-center py-8">
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              加载中...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredDarens.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={1} className="text-center py-8">
                            <div className="text-muted-foreground">
                              {searchTerm ? '没有找到匹配的达人' : '暂无达人数据'}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDarens.map((daren) => {
                          return (
                            <TableRow 
                              key={daren._id} 
                              className="hover:bg-muted/50 cursor-pointer"
                              onClick={() => handleDarenClick(daren)}
                            >
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium text-blue-600 hover:text-blue-800">
                                    {daren.nickname}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {daren.xiaohongshuId && (
                                      <div>ID: {daren.xiaohongshuId}</div>
                                    )}
                                    {daren.ipLocation && (
                                      <div>📍 {daren.ipLocation}</div>
                                    )}
                                    <div className="text-xs text-gray-400 mt-1">
                                      点击查看详细信息
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* 分页控件 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, stats.totalDarens)} 条，
                      共 {stats.totalDarens} 条记录
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                      >
                        上一页
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + 1
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Button>
                          )
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
      
      {/* 达人详情对话框 */}
      <DarenDetailDialog 
        open={showDarenDetail}
        onOpenChange={setShowDarenDetail}
        daren={selectedDaren}
      />
    </div>
  )
}

export default PeriodManagement