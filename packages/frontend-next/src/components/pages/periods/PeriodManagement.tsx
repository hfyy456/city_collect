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
import { CookieStorage } from '@/lib/cookieStorage'
import { Search, Filter, ExternalLink, DollarSign, TrendingUp, Users, UserPlus, Calendar, BarChart3, Eye, Heart, MessageCircle, Bookmark, Share, Edit3, RefreshCw, Trash2 } from 'lucide-react'
import { AddDarenToPeriodDialog } from '@/components/features/daren/operations'
import { DarenDetailDialog } from '@/components/features/daren/dialogs'
import { EditPeriodDataDialog } from '@/components/features/periods/EditPeriodDataDialog'
import { DeleteConfirmDialog } from '@/components/features/daren/dialogs/DeleteConfirmDialog'
import { useToast } from '@/components/shared/feedback/NotificationSystem'

/**
 * 期数统计数据接口
 */
interface PeriodStats {
  totalDarens: number
  totalInvestment: number
  totalLikes: number
  totalComments: number
  totalCollections: number
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
    totalLikes: 0,
    totalComments: 0,
    totalCollections: 0,
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
  
  // 编辑期数数据对话框状态
  const [editingDaren, setEditingDaren] = useState<PeriodDaren | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  
  // 更新作品数据状态
  const [updatingWorkData, setUpdatingWorkData] = useState<string[]>([])  
  
  // 删除相关状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletePeriodDialogOpen, setDeletePeriodDialogOpen] = useState(false)
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false)
  const [deletingDaren, setDeletingDaren] = useState<PeriodDaren | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  const toast = useToast()

  /**
   * 加载所有可用期数
   */
  const loadPeriods = async () => {
    try {
      // 使用新的期数API获取期数列表
      const periodsResponse = await periodApi.list()
      const periodsData = periodsResponse.periods || periodsResponse || []
      
      // 提取期数名称
      const periodNames = periodsData.map((period: any) => 
        typeof period === 'string' ? period : period.name
      )
      
      setPeriods(periodNames)
      
      // 如果没有选择期数且有可用期数，选择最新的期数
      if (!selectedPeriod && periodNames.length > 0) {
        setSelectedPeriod(periodNames[periodNames.length - 1])
      }
    } catch (error) {
      console.error('加载期数列表失败:', error)
      toast.error('加载期数列表失败')
      
      // 如果新API失败，回退到旧API
      try {
        const periodsData = await darenApi.getPeriods()
        setPeriods(periodsData)
        
        if (!selectedPeriod && periodsData.length > 0) {
          setSelectedPeriod(periodsData[periodsData.length - 1])
        }
      } catch (fallbackError) {
        console.error('回退API也失败:', fallbackError)
      }
    }
  }

  /**
   * 加载指定期数的达人数据
   */
  const loadPeriodDarens = async (period: string, page: number = 1) => {
    if (!period) return
    
    try {
      setLoading(true)
      // 使用新的期数API获取达人数据
      const response = await periodApi.getInfluencers(period, {
        page,
        limit: pageSize
      })
      
      setDarens(response.items || [])
      setTotalPages(Math.ceil((response.total || 0) / pageSize))
      setCurrentPage(page)
    } catch (error) {
      console.error('加载期数达人数据失败:', error)
      toast.error('加载达人数据失败')
      
      // 如果新API失败，回退到旧API
      try {
        const fallbackResponse = await periodApi.getDarens(period, {
          page,
          limit: pageSize
        })
        
        setDarens(fallbackResponse.items || [])
        setTotalPages(Math.ceil((fallbackResponse.total || 0) / pageSize))
        setCurrentPage(page)
      } catch (fallbackError) {
        console.error('回退API也失败:', fallbackError)
        setDarens([])
        setTotalPages(0)
        setCurrentPage(1)
      }
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
      // 使用新的期数统计API
      const statsData = await periodApi.getNewStats(period)
      setStats(statsData || {
        totalDarens: 0,
        totalInvestment: 0,
        totalLikes: 0,
        totalComments: 0,
        totalCollections: 0,
        averageEngagement: 0
      })
    } catch (error) {
      console.error('加载期数统计失败:', error)
      
      // 如果新API失败，回退到旧API
      try {
        const fallbackStatsData = await periodApi.getStats(period)
        setStats(fallbackStatsData || {
          totalDarens: 0,
          totalInvestment: 0,
          totalLikes: 0,
          totalComments: 0,
          totalCollections: 0,
          averageEngagement: 0
        })
      } catch (fallbackError) {
        console.error('回退统计API也失败:', fallbackError)
        // 如果API都不存在，手动计算统计数据
        calculateStatsFromDarens()
      }
    }
  }

  /**
   * 从达人数据手动计算统计信息
   */
  const calculateStatsFromDarens = () => {
    const stats: PeriodStats = {
      totalDarens: darens.length,
      totalInvestment: 0,
      totalLikes: 0,
      totalComments: 0,
      totalCollections: 0,
      averageEngagement: 0
    }

    darens.forEach(daren => {
      const periodData = daren.currentPeriodData
      if (periodData) {
        stats.totalInvestment += (periodData.fee || 0)
        stats.totalLikes += (periodData.likes || 0)
        stats.totalComments += (periodData.comments || 0)
        stats.totalCollections += (periodData.collections || 0)
      }
    })

    // 计算平均互动率
    const totalEngagement = stats.totalLikes + stats.totalComments + stats.totalCollections
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
   * 更新作品数据
   */
  const handleUpdateWorkData = async (daren: PeriodDaren) => {
    console.log('🔍 [DEBUG] 开始更新作品数据，达人:', daren.nickname)
    
    const periodData = daren.currentPeriodData
    if (!periodData?.mainPublishLink) {
      console.log('❌ [DEBUG] 没有作品链接')
      toast.error('该达人没有作品链接，无法更新数据')
      return
    }
    
    console.log('🔗 [DEBUG] 作品链接:', periodData.mainPublishLink)

    // 获取默认Cookie
    console.log('🍪 [DEBUG] 开始获取默认Cookie...')
    const defaultCookie = await CookieStorage.getDefaultCookie()
    console.log('🍪 [DEBUG] 获取到的Cookie:', defaultCookie ? `长度: ${defaultCookie.length}` : '空值')
    
    // 获取Cookie历史记录进行调试
    const cookieHistory = await CookieStorage.getCookieHistory()
    console.log('📋 [DEBUG] Cookie历史记录数量:', cookieHistory.length)
    console.log('📋 [DEBUG] Cookie历史记录:', cookieHistory.map(c => ({
      name: c.name,
      isDefault: c.isDefault,
      isExpired: c.isExpired,
      lastUsed: c.lastUsed,
      cookieLength: c.cookie?.length || 0
    })))
    
    // 获取默认Cookie记录
    const defaultRecord = await CookieStorage.getDefaultCookieRecord()
    console.log('🎯 [DEBUG] 默认Cookie记录:', defaultRecord ? {
      name: defaultRecord.name,
      isDefault: defaultRecord.isDefault,
      isExpired: defaultRecord.isExpired,
      cookieLength: defaultRecord.cookie?.length || 0
    } : '无默认记录')
    
    // 如果没有默认cookie，提示用户设置
    if (!defaultCookie) {
      console.log('❌ [DEBUG] 没有获取到默认Cookie，停止执行')
      toast.error('请先在导航栏中设置默认Cookie')
      return
    }

    const darenId = daren._id!
    setUpdatingWorkData(prev => [...prev, darenId])
    
    try {
      console.log('🚀 [DEBUG] 开始调用解析API...')
      // 调用解析API获取最新作品数据，传入cookie参数
      const parseResult = await darenApi.parseXhsNote(periodData.mainPublishLink, defaultCookie)
      console.log('📊 [DEBUG] 解析结果:', parseResult)
      
      if (parseResult.success) {
        // 更新期数数据中的作品数据
        const updateData = {
          likes: parseResult.likes || periodData.likes,
          collections: parseResult.collections || periodData.collections,
          comments: parseResult.comments || periodData.comments
        }
        
        console.log('💾 [DEBUG] 准备更新数据:', updateData)
        await periodApi.updatePeriodData(darenId, selectedPeriod, updateData)
        toast.success('作品数据更新成功！')
        
        // 刷新数据
        await refreshData()
      } else {
        console.log('❌ [DEBUG] 解析失败:', parseResult.message)
        toast.error(`更新失败: ${parseResult.message || '无法解析作品数据'}`)
      }
    } catch (error) {
      console.error('💥 [DEBUG] 更新作品数据失败:', error)
      toast.error('更新作品数据失败，请稍后重试')
    } finally {
      setUpdatingWorkData(prev => prev.filter(id => id !== darenId))
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

  /**
   * 处理编辑期数数据
   */
  const handleEditPeriodData = (daren: PeriodDaren) => {
    setEditingDaren(daren)
    setShowEditDialog(true)
  }

  /**
   * 编辑成功后刷新数据
   */
  const handleEditSuccess = () => {
    if (selectedPeriod) {
      loadPeriodDarens(selectedPeriod, currentPage)
      loadPeriodStats(selectedPeriod)
    }
  }

  /**
   * 删除整个期数
   */
  const handleDeletePeriod = async () => {
    if (!selectedPeriod) return

    const deletedPeriod = selectedPeriod

    try {
      setDeleting(true)
      // 使用期数名称作为ID删除
      await periodApi.delete(selectedPeriod)
      toast.success('期数删除成功')
      setDeletePeriodDialogOpen(false)
      
      // 重新加载期数列表
      await loadPeriods()
      
      // 如果删除的是当前选中的期数，选择其他期数或清空
      if (selectedPeriod === deletedPeriod) {
        // 获取更新后的期数列表
        const updatedPeriods = periods.filter(p => p !== deletedPeriod)
        
        if (updatedPeriods.length > 0) {
          // 选择最新的期数
          const newSelectedPeriod = updatedPeriods[updatedPeriods.length - 1]
          setSelectedPeriod(newSelectedPeriod)
          // 加载新选中期数的数据
          await loadPeriodDarens(newSelectedPeriod)
          await loadPeriodStats(newSelectedPeriod)
        } else {
          // 没有剩余期数，清空选择
          setSelectedPeriod('')
          setDarens([])
          setStats({
            totalDarens: 0,
            totalInvestment: 0,
            totalLikes: 0,
            totalComments: 0,
            totalCollections: 0,
            averageEngagement: 0
          })
        }
      }
    } catch (error: any) {
      console.error('删除期数失败:', error)
      const errorMessage = error.response?.data?.error || '删除期数失败'
      toast.error(errorMessage)
    } finally {
      setDeleting(false)
    }
  }

  /**
   * 删除单个达人合作
   */
  const handleDeleteDarenFromPeriod = async () => {
    if (!deletingDaren || !selectedPeriod) return

    try {
      setDeleting(true)
      await periodApi.removeInfluencer(selectedPeriod, deletingDaren._id!)
      toast.success('达人合作删除成功')
      setDeleteDialogOpen(false)
      setDeletingDaren(null)
      
      // 重新加载达人列表
      await loadPeriodDarens(selectedPeriod, currentPage)
      await loadPeriodStats(selectedPeriod)
    } catch (error: any) {
      console.error('删除达人合作失败:', error)
      const errorMessage = error.response?.data?.error || '删除达人合作失败'
      toast.error(errorMessage)
    } finally {
      setDeleting(false)
    }
  }

  /**
   * 清除期数下的所有达人关联记录
   */
  const handleClearAllInfluencers = async () => {
    if (!selectedPeriod) return

    try {
      setDeleting(true)
      const result = await periodApi.clearAllInfluencers(selectedPeriod)
      toast.success(`成功清除 ${result.deletedCount} 个达人关联记录`)
      setClearAllDialogOpen(false)
      
      // 重新加载达人列表和统计数据
      await loadPeriodDarens(selectedPeriod, currentPage)
      await loadPeriodStats(selectedPeriod)
    } catch (error: any) {
      console.error('清除达人关联记录失败:', error)
      const errorMessage = error.response?.data?.error || '清除达人关联记录失败'
      toast.error(errorMessage)
    } finally {
      setDeleting(false)
    }
  }

  /**
   * 打开删除达人确认对话框
   */
  const openDeleteDarenDialog = (daren: PeriodDaren) => {
    setDeletingDaren(daren)
    setDeleteDialogOpen(true)
  }

  /**
   * 打开删除期数确认对话框
   */
  const openDeletePeriodDialog = () => {
    setDeletePeriodDialogOpen(true)
  }

  /**
   * 打开清除所有达人关联记录确认对话框
   */
  const openClearAllDialog = () => {
    setClearAllDialogOpen(true)
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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                共 {periods.length} 个期数
              </Badge>
              {selectedPeriod && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openClearAllDialog}
                    className="flex items-center gap-1 text-orange-600 border-orange-600 hover:bg-orange-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    清除所有达人
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={openDeletePeriodDialog}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    删除期数
                  </Button>
                </div>
              )}
            </div>
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
                        <TableHead>本期报价</TableHead>
                        <TableHead>到店时间</TableHead>
                        <TableHead>作品链接</TableHead>
                        <TableHead>点赞</TableHead>
                        <TableHead>收藏</TableHead>
                        <TableHead>评论</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              加载中...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredDarens.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <div className="text-muted-foreground">
                              {searchTerm ? '没有找到匹配的达人' : '暂无达人数据'}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDarens.map((daren) => {
                          const periodData = daren.currentPeriodData
                          return (
                            <TableRow 
                              key={daren._id} 
                              className="hover:bg-muted/50"
                            >
                              <TableCell>
                                <div 
                                  className="font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                                  onClick={() => handleDarenClick(daren)}
                                >
                                  {daren.nickname}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {periodData?.fee ? formatCurrency(periodData.fee) : '-'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {periodData?.storeArrivalTime ? 
                                    new Date(periodData.storeArrivalTime).toLocaleDateString('zh-CN', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit'
                                    }) : '-'
                                  }
                                </div>
                              </TableCell>
                              <TableCell>
                                {periodData?.mainPublishLink ? (
                                  <a 
                                    href={periodData.mainPublishLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    查看作品
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Heart className="h-4 w-4 text-red-500" />
                                  <span>{formatNumber(periodData?.likes || 0)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Bookmark className="h-4 w-4 text-yellow-500" />
                                  <span>{formatNumber(periodData?.collections || 0)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="h-4 w-4 text-blue-500" />
                                  <span>{formatNumber(periodData?.comments || 0)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditPeriodData(daren)}
                                    className="h-8 w-8 p-0"
                                    title="编辑期数数据"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateWorkData(daren)}
                                    disabled={updatingWorkData.includes(daren._id!) || !daren.currentPeriodData?.mainPublishLink}
                                    className="h-8 w-8 p-0"
                                    title={daren.currentPeriodData?.mainPublishLink ? '更新作品数据' : '无作品链接'}
                                  >
                                    {updatingWorkData.includes(daren._id!) ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                    ) : (
                                      <RefreshCw className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openDeleteDarenDialog(daren)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="删除达人合作"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
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
      
      {/* 编辑期数数据对话框 */}
      <EditPeriodDataDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        daren={editingDaren}
        periodData={editingDaren?.currentPeriodData || null}
        period={selectedPeriod}
        onSuccess={handleEditSuccess}
      />
      
      {/* 删除达人合作确认对话框 */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteDarenFromPeriod}
        title="删除达人合作"
        description="您确定要删除这个达人在当前期数的合作记录吗？此操作不可撤销。"
        itemName={deletingDaren ? `${deletingDaren.nickname} - ${selectedPeriod}` : undefined}
      />
      
      {/* 删除期数确认对话框 */}
      <DeleteConfirmDialog
        open={deletePeriodDialogOpen}
        onOpenChange={setDeletePeriodDialogOpen}
        onConfirm={handleDeletePeriod}
        title="删除期数"
        description="您确定要删除整个期数吗？这将删除该期数下的所有达人合作记录，此操作不可撤销。"
        itemName={selectedPeriod}
      />
      
      {/* 清除所有达人确认对话框 */}
      <DeleteConfirmDialog
        open={clearAllDialogOpen}
        onOpenChange={setClearAllDialogOpen}
        onConfirm={handleClearAllInfluencers}
        title="清除所有达人"
        description="您确定要清除当前期数下的所有达人合作记录吗？此操作不可撤销，但不会删除期数本身。"
        itemName={selectedPeriod ? `${selectedPeriod} - 所有达人记录` : undefined}
      />
    </div>
  )
}

export default PeriodManagement