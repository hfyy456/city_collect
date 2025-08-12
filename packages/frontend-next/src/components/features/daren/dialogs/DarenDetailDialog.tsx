'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Daren } from '@/lib/api'
import { formatNumber, formatDate } from '@/lib/utils'
import { 
  User, 
  MapPin, 
  Users, 
  Heart, 
  Calendar, 
  ExternalLink,
  MessageSquare,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface DarenDetailDialogProps {
  daren: Daren | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DarenDetailDialog({ daren, open, onOpenChange }: DarenDetailDialogProps) {
  if (!daren) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已发布':
        return 'bg-green-100 text-green-800'
      case '已结款':
        return 'bg-blue-100 text-blue-800'
      case '已审稿':
        return 'bg-purple-100 text-purple-800'
      case '已到店':
        return 'bg-yellow-100 text-yellow-800'
      case '报价不合适':
        return 'bg-red-100 text-red-800'
      case '未到店':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCooperationMethodColor = (method: string) => {
    switch (method) {
      case '探店':
        return 'bg-orange-100 text-orange-800'
      case '种草':
        return 'bg-green-100 text-green-800'
      case '直播':
        return 'bg-red-100 text-red-800'
      case '图文':
        return 'bg-blue-100 text-blue-800'
      case '视频':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {daren.nickname} 详细信息
          </DialogTitle>
          <DialogDescription>
            查看达人的完整信息和合作历史
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">基本信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">达人昵称</div>
                    <div className="font-medium">{daren.nickname}</div>
                  </div>
                </div>
                
                {daren.xiaohongshuId && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">小红书ID</div>
                      <div className="font-medium">{daren.xiaohongshuId}</div>
                    </div>
                  </div>
                )}
                
                {daren.followers && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">粉丝数</div>
                      <div className="font-medium">{formatNumber(daren.followers)}</div>
                    </div>
                  </div>
                )}
                
                {daren.likesAndCollections && (
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">点赞与收藏</div>
                      <div className="font-medium">{formatNumber(daren.likesAndCollections)}</div>
                    </div>
                  </div>
                )}
                
                {daren.ipLocation && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">IP归属地</div>
                      <div className="font-medium">{daren.ipLocation}</div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">创建时间</div>
                    <div className="font-medium">{formatDate(daren.createdAt)}</div>
                  </div>
                </div>
              </div>
              
              {daren.homePage && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-500 mb-2">小红书主页</div>
                  <a 
                    href={daren.homePage} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline"
                  >
                    {daren.homePage}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              
              {daren.remarks && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-500 mb-2">备注</div>
                  <div className="text-sm bg-gray-50 p-3 rounded-md">{daren.remarks}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 合作历史 */}
          {daren.periodData && daren.periodData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">合作历史 ({daren.periodData.length} 期)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>期数</TableHead>
                        <TableHead>合作方式</TableHead>
                        <TableHead>报价</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>联系人</TableHead>
                        <TableHead>到店时间</TableHead>
                        <TableHead>作品数据</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {daren.periodData.map((period) => (
                        <TableRow key={period._id}>
                          <TableCell>
                            <Badge variant="outline">{period.period}</Badge>
                          </TableCell>
                          <TableCell>
                            {period.cooperationMethod && (
                              <Badge className={getCooperationMethodColor(period.cooperationMethod)}>
                                {period.cooperationMethod}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {period.fee && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatNumber(period.fee)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {period.currentStatus && (
                              <Badge className={getStatusColor(period.currentStatus)}>
                                {period.currentStatus}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{period.contactPerson || '-'}</TableCell>
                          <TableCell>
                            {period.storeArrivalTime ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-3 w-3" />
                                {formatDate(period.storeArrivalTime)}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-xs">
                              {period.exposure && <div>曝光: {formatNumber(period.exposure)}</div>}
                              {period.reads && <div>阅读: {formatNumber(period.reads)}</div>}
                              {period.likes && <div>点赞: {formatNumber(period.likes)}</div>}
                              {period.comments && <div>评论: {formatNumber(period.comments)}</div>}
                              {period.collections && <div>收藏: {formatNumber(period.collections)}</div>}
                              {period.forwards && <div>转发: {formatNumber(period.forwards)}</div>}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 如果没有合作历史 */}
          {(!daren.periodData || daren.periodData.length === 0) && (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <div className="text-lg font-medium mb-2">暂无合作历史</div>
                  <div className="text-sm">该达人还没有参与任何期数的合作</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}