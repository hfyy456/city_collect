'use client'

import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Edit,
  Trash2,
  RefreshCw,
  Plus
} from 'lucide-react'
import { QuickAddToPeriodDialog } from './QuickAddToPeriodDialog'
import { type Daren } from '@/lib/api'
import { formatNumber, formatCurrency } from '@/lib/utils'
import { LoadingSpinner } from '@/components/shared/feedback/LoadingStates'
import { useState } from 'react'


interface DarenTableRowProps {
  daren: Daren
  isUpdating: boolean
  onEdit: () => void
  onView: () => void
  onDelete: () => void
  onUpdateHomePage: () => void
}

// 计算总点赞与收藏数的辅助函数
function getTotalLikesAndCollections(daren: Daren): number {
  // 优先使用 likesAndCollections 字段
  if (daren.likesAndCollections) {
    return typeof daren.likesAndCollections === 'string' 
      ? parseInt(daren.likesAndCollections) || 0 
      : daren.likesAndCollections
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

export function DarenTableRow({
  daren,
  isUpdating,
  onEdit,
  onView,
  onDelete,
  onUpdateHomePage
}: DarenTableRowProps) {
  const [showQuickAddDialog, setShowQuickAddDialog] = useState(false)
  return (
    <TableRow>
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-sm cursor-help">
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
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <div className="space-y-2">
                <div className="font-semibold text-sm">合作详情</div>
                {daren.periodData && daren.periodData.length > 0 ? (
                  <div className="space-y-2">
                    {daren.periodData.map((period, index) => (
                      <div key={period._id || index} className="border-b border-gray-200 pb-2 last:border-b-0">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="text-xs">
                            {period.period}
                          </Badge>
                          <span className="text-sm font-medium text-green-600">
                            {period.fee ? formatCurrency(period.fee) : '未设置'}
                          </span>
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    <div>期数: {daren.period || '未分配'}</div>
                    <div>报价: {daren.fee ? formatCurrency(daren.fee) : '未设置'}</div>
                    <div className="text-xs text-gray-500 mt-1">暂无合作历史</div>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onEdit}
            className="h-8 px-2"
          >
            <Edit className="h-3 w-3 mr-1" />
            编辑
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onUpdateHomePage}
            disabled={isUpdating || !daren.homePage}
            className="h-8 px-2"
          >
            {isUpdating ? (
              <LoadingSpinner className="h-3 w-3 mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            更新
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowQuickAddDialog(true)}
            className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <Plus className="h-3 w-3 mr-1" />
            快速添加
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDelete}
            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            删除
          </Button>
        </div>
      </TableCell>
      
      <QuickAddToPeriodDialog
        open={showQuickAddDialog}
        onOpenChange={setShowQuickAddDialog}
        daren={daren}
      />
    </TableRow>
  )
}