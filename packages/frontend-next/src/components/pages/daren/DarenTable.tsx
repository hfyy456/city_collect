'use client'

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DarenTableRow } from './DarenTableRow'
import { type Daren } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/feedback/LoadingStates'

interface DarenTableProps {
  darens: Daren[]
  updatingItems: string[]
  loading?: boolean
  onEdit: (daren: Daren) => void
  onView: (daren: Daren) => void
  onDelete: (daren: Daren) => void
  onUpdateHomePage: (daren: Daren) => void
}

export function DarenTable({
  darens,
  updatingItems,
  loading = false,
  onEdit,
  onView,
  onDelete,
  onUpdateHomePage
}: DarenTableProps) {

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (darens.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium mb-2">暂无达人数据</h3>
          <p className="text-sm">开始添加您的第一个达人吧</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>达人信息</TableHead>
            <TableHead>主页链接</TableHead>
            <TableHead>平台</TableHead>
            <TableHead>粉丝数</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {darens.map((daren) => (
            <DarenTableRow
              key={daren._id}
              daren={daren}
              isUpdating={updatingItems.includes(daren._id)}
              onEdit={() => onEdit(daren)}
              onView={() => onView(daren)}
              onDelete={() => onDelete(daren)}
              onUpdateHomePage={() => onUpdateHomePage(daren)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}