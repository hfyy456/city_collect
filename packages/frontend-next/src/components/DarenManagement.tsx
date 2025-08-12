'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  ExternalLink,
  Eye,
  RefreshCw
} from 'lucide-react'
import { darenApi, type Daren, type SearchParams } from '@/lib/api'
import { formatNumber, formatCurrency } from '@/lib/utils'
import { CookieStorage } from '@/lib/cookieStorage'
import { AddDarenDialog } from '@/components/AddDarenDialog'
import { AddDarenToPeriodDialog } from '@/components/AddDarenToPeriodDialog'
import { EditDarenDialog } from '@/components/EditDarenDialog'
import { DarenDetailDialog } from '@/components/DarenDetailDialog'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { CookieSelectDialog } from '@/components/CookieSelectDialog'
import { AdvancedSearch } from '@/components/AdvancedSearch'
import { BatchOperations } from '@/components/BatchOperations'
import { PerformanceMonitor } from '@/components/PerformanceMonitor'
import { StatsCardSkeleton, TableSkeleton, SearchSkeleton, EmptyState, LoadingSpinner } from '@/components/LoadingStates'
import { useToast } from '@/components/NotificationSystem'

export function DarenManagement() {
  const [darens, setDarens] = useState<Daren[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [updatingHomePage, setUpdatingHomePage] = useState<string | null>(null)
  const [editingDaren, setEditingDaren] = useState<Daren | null>(null)
  const [viewingDaren, setViewingDaren] = useState<Daren | null>(null)
  const [deletingDaren, setDeletingDaren] = useState<Daren | null>(null)
  const [showCookieSelect, setShowCookieSelect] = useState(false)
  const [pendingUpdateDaren, setPendingUpdateDaren] = useState<Daren | null>(null)
  const [searchParams, setSearchParams] = useState<SearchParams>({})
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [stats, setStats] = useState({
    totalInfluencers: 0,
    totalInvestment: 0,
    totalInteractions: 0,
    averageROI: 0
  })
  const toast = useToast()

  const loadDarens = async () => {
    try {
      setLoading(true)
      const response = await darenApi.list(searchParams)
      setDarens(response.items || [])
      
      // 计算统计数据
      const dataArray = response.data || response.items || []
      const totalInfluencers = dataArray.length
      let totalInvestment = 0
      let totalInteractions = 0
      
      dataArray.forEach((daren: Daren) => {
        // 计算总投入（所有期数的费用总和）
        if (daren.periodData && daren.periodData.length > 0) {
          daren.periodData.forEach(period => {
            totalInvestment += (period.fee || 0)
          })
        } else {
          // 兼容旧数据
          totalInvestment += (daren.fee || 0)
        }
        
        // 计算总互动数（所有期数的互动总和）
        const totalLikes = getTotalLikes(daren)
        const totalComments = getTotalComments(daren)
        const totalCollections = getTotalCollections(daren)
        totalInteractions += totalLikes + totalComments + totalCollections
      })
      
      const averageROI = totalInvestment > 0 ? (totalInteractions / totalInvestment * 100) : 0
      
      setStats({
        totalInfluencers,
        totalInvestment,
        totalInteractions,
        averageROI
      })
    } catch (error) {
      console.error('Failed to load darens:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDarens()
  }, [searchParams])

  const handleSearch = (params: SearchParams) => {
    setSearchParams(params)
  }

  const handleBatchDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => darenApi.deleteDaren(id)))
      setSelectedItems([])
      loadDarens()
    } catch (error) {
      console.error('Failed to delete darens:', error)
    }
  }

  // 更新达人主页数据
  const handleUpdateHomePage = async (daren: Daren) => {
    if (!daren.homePage) {
      toast.error('该达人没有设置主页链接，无法更新数据')
      return
    }

    // 获取默认Cookie
    const defaultCookie = CookieStorage.getDefaultCookie()
    
    // 如果没有默认cookie，弹出选择对话框
    if (!defaultCookie) {
      setPendingUpdateDaren(daren)
      setShowCookieSelect(true)
      return
    }

    // 执行更新
    await performUpdateHomePage(daren, defaultCookie)
  }

  // 执行主页数据更新的实际逻辑
  const performUpdateHomePage = async (daren: Daren, cookie: string) => {
    setUpdatingHomePage(daren._id)
    try {
      // 调用解析API获取最新数据，传入cookie参数
      const parseResult = await darenApi.parseXhsUser(daren.homePage, cookie)
      
      if (parseResult.success) {
        // 更新达人信息
        const updateData = {
          nickname: parseResult.nickname || daren.nickname,
          xiaohongshuId: parseResult.xiaohongshuId || daren.xiaohongshuId,
          followers: parseResult.followers || daren.followers,
          likesAndCollections: parseResult.likesAndCollections || daren.likesAndCollections,
          ipLocation: parseResult.ipLocation || daren.ipLocation
        }
        
        await darenApi.update(daren._id, updateData)
        toast.success('主页数据更新成功！')
        loadDarens() // 重新加载数据
      } else {
        toast.error(`更新失败: ${parseResult.message || '无法解析用户信息'}`)
      }
    } catch (error) {
      console.error('更新主页数据失败:', error)
      toast.error('更新主页数据失败，请稍后重试')
    } finally {
      setUpdatingHomePage(null)
    }
  }

  // 处理cookie选择
  const handleCookieSelected = async (cookie: string) => {
    if (pendingUpdateDaren) {
      await performUpdateHomePage(pendingUpdateDaren, cookie)
      setPendingUpdateDaren(null)
    }
  }

  // 处理添加cookie
  const handleAddCookie = () => {
    // 这里可以打开一个添加cookie的对话框或者跳转到cookie管理页面
    // 暂时显示一个提示
    toast.info('请在添加达人页面中管理Cookie设置')
  }

  // 删除达人
  const handleDeleteDaren = async () => {
    if (!deletingDaren) return
    
    try {
      await darenApi.delete(deletingDaren._id)
      toast.success('达人删除成功')
      loadDarens() // 重新加载列表
      // 如果删除的达人在选中列表中，也要移除
      setSelectedItems(prev => prev.filter(id => id !== deletingDaren._id))
    } catch (error) {
      console.error('删除达人失败:', error)
      toast.error('删除失败，请重试')
    }
  }

  const filteredDarens = darens.filter(daren => 
    daren.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 计算总点赞与收藏数的辅助函数
  const getTotalLikesAndCollections = (daren: Daren) => {
    // 优先使用 likesAndCollections 字段
    if (daren.likesAndCollections) {
      return typeof daren.likesAndCollections === 'string' ? parseInt(daren.likesAndCollections) || 0 : daren.likesAndCollections
    }
    
    // 如果没有合并字段，则计算点赞和收藏的总和
    let totalLikes = 0
    let totalCollections = 0
    
    daren.periodData?.forEach(period => {
      totalLikes += (period.likes || 0)
      totalCollections += (period.collections || 0)
    })
    
    if (totalLikes === 0 && totalCollections === 0) {
      totalLikes = (daren.likes || 0)
      totalCollections = (daren.collections || 0)
    }
    
    return totalLikes + totalCollections
  }

  // 计算总评论数的辅助函数
  const getTotalComments = (daren: Daren) => {
    let total = 0
    daren.periodData?.forEach(period => {
      total += (period.comments || 0)
    })
    if (total === 0) {
      total = (daren.comments || 0)
    }
    return total
  }

  // 为了兼容性保留的函数
  const getTotalLikes = (daren: Daren) => {
    let total = 0
    daren.periodData?.forEach(period => {
      total += (period.likes || 0)
    })
    if (total === 0) {
      total = (daren.likes || 0)
    }
    return total
  }

  const getTotalCollections = (daren: Daren) => {
    let total = 0
    daren.periodData?.forEach(period => {
      total += (period.collections || 0)
    })
    if (total === 0) {
      total = (daren.collections || 0)
    }
    return total
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PerformanceMonitor />
        <StatsCardSkeleton />
        <SearchSkeleton />
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 性能监控 */}
      <PerformanceMonitor />
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总达人数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInfluencers}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% 较上月
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
              +8.2% 较上月
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
              +15.3% 较上月
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均ROI</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageROI.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% 较上月
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>达人管理</CardTitle>
              <CardDescription>管理和查看所有达人信息</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              >
                <Filter className="h-4 w-4 mr-2" />
                高级搜索
              </Button>
              <AddDarenDialog onSuccess={() => loadDarens()} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 基础搜索 */}
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

            {/* 高级搜索 */}
            {showAdvancedSearch && (
              <AdvancedSearch onSearch={handleSearch} />
            )}

            {/* 批量操作 */}
            {selectedItems.length > 0 && (
              <BatchOperations
                selectedItems={selectedItems}
                onBatchDelete={handleBatchDelete}
                onClearSelection={() => setSelectedItems([])}
              />
            )}

            <Separator />

            {/* 达人列表 */}
            {filteredDarens.length === 0 ? (
              <EmptyState
                title="暂无达人数据"
                description="开始添加达人来管理你的合作伙伴"
                action={
                  <AddDarenDialog onSuccess={() => loadDarens()}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      添加达人
                    </Button>
                  </AddDarenDialog>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItems.length === darens.length && darens.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedItems(darens.map(d => d._id))
                          } else {
                            setSelectedItems([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>达人信息</TableHead>
                    <TableHead>平台</TableHead>
                    <TableHead>粉丝数</TableHead>
                    <TableHead>点赞与收藏</TableHead>
                    <TableHead>往期 & 报价</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {darens.map((daren) => (
                    <TableRow key={daren._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(daren._id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedItems(prev => [...prev, daren._id])
                            } else {
                              setSelectedItems(prev => prev.filter(id => id !== daren._id))
                            }
                          }}
                        />
                      </TableCell>
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
                        {daren.homePage ? (
                          <a 
                            href={daren.homePage} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-block"
                          >
                            <Badge variant="outline" className="hover:bg-blue-50 cursor-pointer">
                              {daren.platform || '小红书'}
                            </Badge>
                          </a>
                        ) : (
                          <Badge variant="outline">{daren.platform || '小红书'}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatNumber(daren.followers || '0')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium text-purple-600">
                            💖 {formatNumber(getTotalLikesAndCollections(daren))}
                          </div>
                          <div className="text-xs text-gray-500">
                            点赞与收藏
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {daren.periodData && daren.periodData.length > 0 ? (
                            <div>
                              <div className="font-medium text-blue-600">
                                {daren.periodData.length} 期合作
                              </div>
                              <div className="text-gray-500">
                                总费用: {formatCurrency(
                                  daren.periodData.reduce((sum, period) => sum + (period.fee || 0), 0)
                                )}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium text-green-600">
                                {daren.fee ? formatCurrency(daren.fee) : '未设置'}
                              </div>
                              <div className="text-gray-500">
                                {daren.period || '未分配期数'}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>


                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">打开菜单</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingDaren(daren)}>
                              <Edit className="mr-2 h-4 w-4" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setViewingDaren(daren)}>
                              <Eye className="mr-2 h-4 w-4" />
                              查看详情
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleUpdateHomePage(daren)}
                              disabled={updatingHomePage === daren._id || !daren.homePage}
                            >
                              {updatingHomePage === daren._id ? (
                                <LoadingSpinner className="mr-2 h-4 w-4" />
                              ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                              )}
                              更新主页数据
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => setDeletingDaren(daren)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 对话框 */}
      {editingDaren && (
        <EditDarenDialog
          daren={editingDaren}
          open={!!editingDaren}
          onOpenChange={(open) => !open && setEditingDaren(null)}
          onSuccess={() => {
            setEditingDaren(null)
            loadDarens()
          }}
        />
      )}

      {viewingDaren && (
        <DarenDetailDialog
          daren={viewingDaren}
          open={!!viewingDaren}
          onOpenChange={(open) => !open && setViewingDaren(null)}
        />
      )}

      {deletingDaren && (
        <DeleteConfirmDialog
          open={!!deletingDaren}
          onOpenChange={(open) => !open && setDeletingDaren(null)}
          onConfirm={handleDeleteDaren}
          title="删除达人"
          description={`确定要删除达人 "${deletingDaren.nickname}" 吗？此操作不可撤销。`}
        />
      )}

      <CookieSelectDialog
        open={showCookieSelect}
        onOpenChange={setShowCookieSelect}
        onCookieSelected={handleCookieSelected}
        onAddCookie={handleAddCookie}
      />
    </div>
  )
}