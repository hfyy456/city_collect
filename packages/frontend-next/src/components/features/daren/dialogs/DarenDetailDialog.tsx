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



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {daren.nickname} 详细信息
          </DialogTitle>
          <DialogDescription>
            查看达人的完整信息和合作历史
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* 基本信息卡片 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
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
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">平台主页</div>
                    <a 
                      href={daren.homePage} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <Badge variant="outline" className="text-xs">
                        小红书主页
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Badge>
                    </a>
                  </div>
                </div>
              )}
              
              {daren.remarks && (
                <div className="mt-3 pt-3 border-t col-span-full">
                  <div className="text-sm text-gray-500 mb-1">备注</div>
                  <div className="text-sm bg-gray-50 p-2 rounded-md">{daren.remarks}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 合作历史 */}
          {daren.periodData && daren.periodData.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">合作历史 ({daren.periodData.length} 期)</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {daren.periodData.map((period) => (
                    <div key={period._id} className="border rounded-lg p-3 space-y-2">
                      {/* 期数和状态 */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <Badge variant="outline" className="text-sm">{period.period}</Badge>

                      </div>
                      
                      {/* 基本信息 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">

                        
                        {period.fee && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">报价:</span>
                            <div className="flex items-center gap-1 font-medium">
                              <DollarSign className="h-3 w-3" />
                              {formatNumber(period.fee)}
                            </div>
                          </div>
                        )}
                        
                        {period.contactPerson && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">联系人:</span>
                            <span className="font-medium">{period.contactPerson}</span>
                          </div>
                        )}
                        
                        {period.storeArrivalTime && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">到店时间:</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="font-medium">{formatDate(period.storeArrivalTime)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* 作品数据 */}
                      {(period.likes !== undefined || period.comments !== undefined || period.collections !== undefined) && (
                        <div>
                          <div className="text-gray-500 text-sm mb-1">作品数据:</div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 text-xs">
                            {period.likes !== undefined && (
                              <div className="bg-red-50 px-2 py-1 rounded">
                                <span className="text-red-600">点赞:</span> <span className="font-medium text-red-700">{formatNumber(period.likes)}</span>
                              </div>
                            )}
                            {period.comments !== undefined && (
                              <div className="bg-blue-50 px-2 py-1 rounded">
                                <span className="text-blue-600">评论:</span> <span className="font-medium text-blue-700">{formatNumber(period.comments)}</span>
                              </div>
                            )}
                            {period.collections !== undefined && (
                              <div className="bg-yellow-50 px-2 py-1 rounded">
                                <span className="text-yellow-600">收藏:</span> <span className="font-medium text-yellow-700">{formatNumber(period.collections)}</span>
                              </div>
                            )}
                            {period.forwards !== undefined && (
                              <div className="bg-green-50 px-2 py-1 rounded">
                                <span className="text-green-600">转发:</span> <span className="font-medium text-green-700">{formatNumber(period.forwards)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
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

        <div className="flex justify-end pt-3 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}