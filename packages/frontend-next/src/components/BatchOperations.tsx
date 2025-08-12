'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Trash2, 
  Download, 
  FileText, 
  Users, 
  MoreHorizontal,
  CheckSquare,
  Square,
  Loader2,
  Archive,
  Tag
} from 'lucide-react'
import { darenApi, type Daren } from '@/lib/api'
import { useToast } from '@/components/NotificationSystem'

interface BatchOperationsProps {
  selectedItems: string[]
  allItems: Daren[]
  onSelectionChange: (selected: string[]) => void
  onOperationComplete: () => void
}

export function BatchOperations({ 
  selectedItems, 
  allItems, 
  onSelectionChange, 
  onOperationComplete 
}: BatchOperationsProps) {
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [operation, setOperation] = useState<string | null>(null)

  const selectedData = allItems.filter(item => selectedItems.includes(item._id))
  const isAllSelected = allItems.length > 0 && selectedItems.length === allItems.length
  const isPartialSelected = selectedItems.length > 0 && selectedItems.length < allItems.length

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(allItems.map(item => item._id))
    }
  }

  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return

    setIsLoading(true)
    setOperation('delete')
    
    try {
      await darenApi.batchDelete(selectedItems)
      toast.success('批量删除成功', `已删除 ${selectedItems.length} 个达人记录`)
      onSelectionChange([])
      onOperationComplete()
    } catch (error) {
      console.error('批量删除失败:', error)
      toast.error('批量删除失败', '请稍后重试')
    } finally {
      setIsLoading(false)
      setOperation(null)
    }
  }

  const handleExportData = async (format: 'csv' | 'json' | 'excel') => {
    if (selectedItems.length === 0) return

    setIsLoading(true)
    setOperation('export')

    try {
      const data = selectedData
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `darens_${timestamp}.${format}`

      if (format === 'json') {
        const jsonData = JSON.stringify(data, null, 2)
        downloadFile(jsonData, filename, 'application/json')
      } else if (format === 'csv') {
        const csvData = convertToCSV(data)
        downloadFile(csvData, filename, 'text/csv')
      } else if (format === 'excel') {
        // 简化的Excel导出（实际项目中可能需要使用专门的库）
        const csvData = convertToCSV(data)
        downloadFile(csvData, filename.replace('.excel', '.csv'), 'text/csv')
      }

      toast.success('导出成功', `已导出 ${selectedItems.length} 条记录`)
    } catch (error) {
      console.error('导出失败:', error)
      toast.error('导出失败', '请稍后重试')
    } finally {
      setIsLoading(false)
      setOperation(null)
    }
  }

  const convertToCSV = (data: Daren[]): string => {
    const headers = [
      'ID', '昵称', '粉丝数', 'IP属地', '点赞收藏数', 
      '费用', '联系方式', '合作方式', '期数', '备注', '创建时间'
    ]
    
    const rows = data.map(item => [
      item._id,
      item.nickname,
      item.followerCount,
      item.ipLocation,
      item.likesAndCollections,
      item.fee || '',
      item.contactInfo || '',
      item.cooperationMethod || '',
      item.period || '',
      item.remarks || '',
      new Date(item.createdAt).toLocaleString()
    ])

    return [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n')
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleBatchArchive = async () => {
    if (selectedItems.length === 0) return

    setIsLoading(true)
    setOperation('archive')

    try {
      // 这里假设有归档API，实际实现时需要添加
      // await darenApi.batchArchive(selectedItems)
      toast.info('归档功能', '归档功能正在开发中')
      onSelectionChange([])
    } catch (error) {
      console.error('批量归档失败:', error)
      toast.error('批量归档失败', '请稍后重试')
    } finally {
      setIsLoading(false)
      setOperation(null)
    }
  }

  const getSelectionStats = () => {
    if (selectedItems.length === 0) return null

    const totalFee = selectedData.reduce((sum, item) => sum + (item.fee || 0), 0)
    const totalFollowers = selectedData.reduce((sum, item) => sum + (item.followerCount || 0), 0)
    const avgFee = totalFee / selectedData.length

    return {
      count: selectedItems.length,
      totalFee,
      totalFollowers,
      avgFee
    }
  }

  const stats = getSelectionStats()

  if (allItems.length === 0) {
    return null
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex items-center space-x-2"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4" />
              ) : isPartialSelected ? (
                <div className="w-4 h-4 border-2 border-primary bg-primary/20 rounded-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-sm" />
                </div>
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>
                {isAllSelected ? '取消全选' : '全选'}
              </span>
            </Button>
            
            {selectedItems.length > 0 && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>已选择 {selectedItems.length} 项</span>
              </Badge>
            )}
          </div>

          {selectedItems.length > 0 && (
            <div className="flex items-center space-x-2">
              {/* 导出菜单 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={isLoading}
                  >
                    {isLoading && operation === 'export' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    导出
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExportData('csv')}>
                    <FileText className="w-4 h-4 mr-2" />
                    导出为 CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportData('json')}>
                    <FileText className="w-4 h-4 mr-2" />
                    导出为 JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportData('excel')}>
                    <FileText className="w-4 h-4 mr-2" />
                    导出为 Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 更多操作 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleBatchArchive}>
                    <Archive className="w-4 h-4 mr-2" />
                    批量归档
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Tag className="w-4 h-4 mr-2" />
                    批量标签
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <div className="flex items-center w-full">
                          <Trash2 className="w-4 h-4 mr-2" />
                          批量删除
                        </div>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认批量删除</AlertDialogTitle>
                          <AlertDialogDescription>
                            您确定要删除选中的 {selectedItems.length} 个达人记录吗？此操作不可撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleBatchDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isLoading}
                          >
                            {isLoading && operation === 'delete' ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            确认删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardHeader>

      {stats && (
        <CardContent className="pt-0">
          <Separator className="mb-3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-lg">{stats.count}</div>
              <div className="text-gray-500">选中项目</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-lg">{stats.totalFollowers.toLocaleString()}</div>
              <div className="text-gray-500">总粉丝数</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-lg">¥{stats.totalFee.toLocaleString()}</div>
              <div className="text-gray-500">总费用</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-lg">¥{Math.round(stats.avgFee).toLocaleString()}</div>
              <div className="text-gray-500">平均费用</div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}