'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Filter,
  RefreshCw,
  X
} from 'lucide-react'
import { darenApi, type Daren, type SearchParams } from '@/lib/api'
import { CookieStorage } from '@/lib/cookieStorage'
import { calculateStats, filterDarens } from '@/lib/daren-utils'
import { AddDarenDialog, EditDarenDialog, DarenDetailDialog, DeleteConfirmDialog } from '@/components/features/daren/dialogs'
import { SearchAndFilter } from '@/components/features/search'
import { LoadingSpinner } from '@/components/shared/feedback'
import { useToast } from '@/components/shared/feedback'
import { StatsCards, type StatsData, PaginationControls } from '@/components/shared/layout'
import { DarenTable } from './DarenTable'

export function DarenManagement() {
  // 状态管理
  const [darens, setDarens] = useState<Daren[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchParams, setSearchParams] = useState<SearchParams>({})

  const [updatingItems, setUpdatingItems] = useState<string[]>([])
  const [stats, setStats] = useState<StatsData>({
    totalInfluencers: 0,
    totalInvestment: 0,
    totalInteractions: 0,
    averageROI: 0
  })
  const [periods, setPeriods] = useState<string[]>([])
  const [ipLocations, setIpLocations] = useState<string[]>([])
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  // 对话框状态
  const [selectedDaren, setSelectedDaren] = useState<Daren | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)


  const toast = useToast()

  const loadDarens = async () => {
    try {
      setLoading(true)
      const response = await darenApi.search({
        ...searchParams,
        page: currentPage,
        limit: pageSize
      })
      
      setDarens(response.items || [])
      setTotalPages(Math.ceil((response.total || 0) / pageSize))
      setTotalItems(response.total || 0)
      
      // 计算统计数据
      const dataArray = response.items || []
      const stats = calculateStats(dataArray)
      setStats(stats)
      
    } catch (error) {
      console.error('Failed to load darens:', error)
      toast.error('加载达人数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载基础数据
  const loadBasicData = async () => {
    try {
      const [periodsRes, locationsRes] = await Promise.all([
        darenApi.getPeriods(),
        darenApi.getIpLocations()
      ])
      setPeriods(periodsRes || [])
      setIpLocations(locationsRes || [])
    } catch (error) {
      console.error('Failed to load basic data:', error)
    }
  }

  useEffect(() => {
    loadBasicData()
  }, [])

  useEffect(() => {
    loadDarens()
  }, [searchParams, currentPage, pageSize])

  const handleSearch = () => {
    setCurrentPage(1)
    loadDarens()
  }

  const handleClearFilters = () => {
    setSearchParams({})
    setSearchTerm('')
    setCurrentPage(1)
  }

  const handleBatchDelete = async () => {
    try {
      await Promise.all(selectedItems.map(id => darenApi.delete(id)))
      setSelectedItems([])
      toast.success(`成功删除 ${selectedItems.length} 个达人`)
      loadDarens()
    } catch (error) {
      console.error('Failed to delete darens:', error)
      toast.error('批量删除失败')
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
    
    // 如果没有默认cookie，提示用户设置
    if (!defaultCookie) {
      toast.error('请先在导航栏中设置默认Cookie')
      return
    }

    // 执行更新
    await performUpdateHomePage(daren, defaultCookie)
  }

  // 执行主页数据更新的实际逻辑
  const performUpdateHomePage = async (daren: Daren, cookie: string) => {
    setUpdatingItems(prev => [...prev, daren._id!])
    try {
      // 调用解析API获取最新数据，传入cookie参数
      const parseResult = await darenApi.parseXhsUser(daren.homePage!, cookie)
      
      if (parseResult.success) {
        // 更新达人信息
        const updateData = {
          nickname: parseResult.nickname || daren.nickname,
          xiaohongshuId: parseResult.xiaohongshuId || daren.xiaohongshuId,
          followers: parseResult.followers || daren.followers,
          likesAndCollections: parseResult.likesAndCollections || daren.likesAndCollections,
          ipLocation: parseResult.ipLocation || daren.ipLocation
        }
        
        await darenApi.update(daren._id!, updateData)
        toast.success('主页数据更新成功！')
        loadDarens() // 重新加载数据
      } else {
        toast.error(`更新失败: ${parseResult.message || '无法解析用户信息'}`)
      }
    } catch (error) {
      console.error('更新主页数据失败:', error)
      toast.error('更新主页数据失败，请稍后重试')
    } finally {
      setUpdatingItems(prev => prev.filter(id => id !== daren._id))
    }
  }



  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }



  // 删除达人
  const handleDeleteDaren = async (daren: Daren) => {
    setSelectedDaren(daren)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!selectedDaren) return
    
    try {
      await darenApi.delete(selectedDaren._id!)
      toast.success('达人删除成功')
      loadDarens() // 重新加载列表
    } catch (error) {
      console.error('删除达人失败:', error)
      toast.error('删除失败，请重试')
    } finally {
      setShowDeleteDialog(false)
      setSelectedDaren(null)
    }
  }

  const filteredDarens = filterDarens(darens, searchTerm)

  // 编辑相关的处理函数
  const handleEditDaren = (daren: Daren) => {
    setSelectedDaren(daren)
    setShowEditDialog(true)
  }

  const handleViewDaren = (daren: Daren) => {
    setSelectedDaren(daren)
    setShowViewDialog(true)
  }

  return (
    <div className="space-y-6">
      {/* 头部操作栏 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">达人管理</h1>
          <p className="text-muted-foreground">
            管理您的达人资源和合作数据
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            添加达人
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <StatsCards stats={stats} loading={loading} />

      {/* 搜索和筛选 */}
      <SearchAndFilter
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        searchParams={searchParams}
        onSearchParamsChange={setSearchParams}
        periods={periods}
        ipLocations={ipLocations}
        onSearch={handleSearch}
        onClearFilters={handleClearFilters}

      />



      {/* 达人表格 */}
      <DarenTable
        darens={filteredDarens}
        updatingItems={updatingItems}
        loading={loading}
        onEdit={handleEditDaren}
        onView={handleViewDaren}
        onDelete={handleDeleteDaren}
        onUpdateHomePage={handleUpdateHomePage}
      />

      {/* 分页控制 */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* 对话框组件 */}
      <AddDarenDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          loadDarens()
          setShowAddDialog(false)
        }} 
      />
      
      <EditDarenDialog 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog}
        daren={selectedDaren}
        onSuccess={() => {
          loadDarens()
          setShowEditDialog(false)
        }} 
      />
      
      <DarenDetailDialog 
        open={showViewDialog} 
        onOpenChange={setShowViewDialog}
        daren={selectedDaren}
      />
      
      <DeleteConfirmDialog 
        open={showDeleteDialog} 
        onOpenChange={setShowDeleteDialog}
        daren={selectedDaren}
        onConfirm={confirmDelete}
      />
      

      

    </div>
  )
}

export default DarenManagement