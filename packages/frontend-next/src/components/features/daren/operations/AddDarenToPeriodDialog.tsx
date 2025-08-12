'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { darenApi, periodApi, type Daren } from '@/lib/api'
import { formatNumber, normalizeNumber } from '@/lib/utils'
import { Plus, Search, X } from 'lucide-react'
import { useToast } from '@/components/shared/feedback/NotificationSystem'

interface AddDarenToPeriodDialogProps {
  period: string
  onSuccess: () => void
}

export function AddDarenToPeriodDialog({ period, onSuccess }: AddDarenToPeriodDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [allDarens, setAllDarens] = useState<Daren[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDaren, setSelectedDaren] = useState<Daren | null>(null)
  const toast = useToast()
  
  // 期数数据表单
  const [formData, setFormData] = useState({
    fee: '',
    cooperationMethod: '',
    contactPerson: '',
    hasConnection: false,
    inGroup: false,
    arrivedAtStore: false,
    reviewed: false,
    published: false,
    currentStatus: '未到店',
    storeArrivalTime: '',
    mainPublishLink: '',
    syncPublishLink: '',
    exposure: '',
    reads: '',
    likes: '',
    comments: '',
    collections: '',
    forwards: '',
    periodRemarks: ''
  })

  // 加载所有达人
  const loadAllDarens = async () => {
    try {
      const response = await darenApi.list({ limit: 1000 })
      // 过滤掉已经参与当前期数的达人
      const availableDarens = response.items.filter(daren => 
        !daren.periodData?.some(p => p.period === period)
      )
      setAllDarens(availableDarens)
    } catch (error) {
      console.error('加载达人列表失败:', error)
    }
  }

  useEffect(() => {
    if (open) {
      loadAllDarens()
    }
  }, [open, period])

  // 过滤达人
  const filteredDarens = allDarens.filter(daren =>
    daren.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (daren.xiaohongshuId && daren.xiaohongshuId.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDaren) return

    setLoading(true)
    try {
      // 准备期数数据
      const periodData = {
        period,
        fee: formData.fee ? normalizeNumber(formData.fee) : undefined,
        cooperationMethod: formData.cooperationMethod || undefined,
        contactPerson: formData.contactPerson || undefined,
        hasConnection: formData.hasConnection,
        inGroup: formData.inGroup,
        arrivedAtStore: formData.arrivedAtStore,
        reviewed: formData.reviewed,
        published: formData.published,
        storeArrivalTime: formData.storeArrivalTime ? new Date(formData.storeArrivalTime) : undefined,
        mainPublishLink: formData.mainPublishLink || undefined,
        syncPublishLink: formData.syncPublishLink || undefined,
        exposure: formData.exposure ? normalizeNumber(formData.exposure) : undefined,
        reads: formData.reads ? normalizeNumber(formData.reads) : undefined,
        likes: formData.likes ? normalizeNumber(formData.likes) : undefined,
        comments: formData.comments ? normalizeNumber(formData.comments) : undefined,
        collections: formData.collections ? normalizeNumber(formData.collections) : undefined,
        forwards: formData.forwards ? normalizeNumber(formData.forwards) : undefined,
        periodRemarks: formData.periodRemarks || undefined
      }

      // 为达人添加期数数据
      await periodApi.addPeriodData(selectedDaren._id, periodData)
      
      // 重置表单
      setSelectedDaren(null)
      setFormData({
        fee: '',
        cooperationMethod: '',
        contactPerson: '',
        hasConnection: false,
        inGroup: false,
        arrivedAtStore: false,
        reviewed: false,
        published: false,
        storeArrivalTime: '',
        mainPublishLink: '',
        syncPublishLink: '',
        exposure: '',
        reads: '',
        likes: '',
        comments: '',
        collections: '',
        forwards: '',
        periodRemarks: ''
      })
      
      setOpen(false)
      onSuccess()
    } catch (error) {
        console.error('添加达人到期数失败:', error)
        toast.error('添加失败，请重试')
      } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          添加达人到本期
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>添加达人到 {period} 期</DialogTitle>
          <DialogDescription>
            选择现有达人并填写本期合作信息
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 达人选择 */}
          <div className="space-y-4">
            <Label>选择达人</Label>
            
            {!selectedDaren ? (
              <div className="space-y-4">
                {/* 搜索框 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="搜索达人昵称或小红书ID..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* 达人列表 */}
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {filteredDarens.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {searchTerm ? '未找到匹配的达人' : '暂无可添加的达人'}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredDarens.map(daren => (
                        <div
                          key={daren._id}
                          className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                          onClick={() => setSelectedDaren(daren)}
                        >
                          <div>
                            <div className="font-medium">{daren.nickname}</div>
                            <div className="text-sm text-gray-500">
                              {daren.xiaohongshuId} • {formatNumber(daren.followers || 0)} 粉丝
                            </div>
                            {daren.ipLocation && (
                              <div className="text-xs text-gray-400">📍 {daren.ipLocation}</div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {daren.periodData?.map(p => (
                              <Badge key={p._id} variant="secondary" className="text-xs">
                                {p.period}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                <div>
                  <div className="font-medium">{selectedDaren.nickname}</div>
                  <div className="text-sm text-gray-500">
                    {selectedDaren.xiaohongshuId} • {formatNumber(selectedDaren.followers || 0)} 粉丝
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDaren(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {selectedDaren && (
            <>
              {/* 基本合作信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fee">报价 (元)</Label>
                  <Input
                    id="fee"
                    type="number"
                    placeholder="输入报价"
                    value={formData.fee}
                    onChange={(e) => handleInputChange('fee', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="cooperationMethod">合作方式</Label>
                  <Select value={formData.cooperationMethod} onValueChange={(value) => handleInputChange('cooperationMethod', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择合作方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="探店">探店</SelectItem>
                      <SelectItem value="种草">种草</SelectItem>
                      <SelectItem value="直播">直播</SelectItem>
                      <SelectItem value="图文">图文</SelectItem>
                      <SelectItem value="视频">视频</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 联系信息 */}
              <div>
                <Label htmlFor="contactPerson">联系人</Label>
                <Input
                  id="contactPerson"
                  placeholder="输入联系人姓名"
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                />
              </div>

              {/* 合作进度 */}
              <div>
                <Label htmlFor="currentStatus">合作进度</Label>
                <Select value={formData.currentStatus} onValueChange={(value) => handleInputChange('currentStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择合作进度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="未到店">未到店</SelectItem>
                    <SelectItem value="报价不合适">报价不合适</SelectItem>
                    <SelectItem value="已到店">已到店</SelectItem>
                    <SelectItem value="已审稿">已审稿</SelectItem>
                    <SelectItem value="已结款">已结款</SelectItem>
                    <SelectItem value="已发布">已发布</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 到店时间 */}
              <div>
                <Label htmlFor="storeArrivalTime">到店时间</Label>
                <Input
                  id="storeArrivalTime"
                  type="datetime-local"
                  value={formData.storeArrivalTime}
                  onChange={(e) => handleInputChange('storeArrivalTime', e.target.value)}
                />
              </div>

              {/* 作品链接 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mainPublishLink">主发布链接</Label>
                  <Input
                    id="mainPublishLink"
                    placeholder="输入主发布作品链接"
                    value={formData.mainPublishLink}
                    onChange={(e) => handleInputChange('mainPublishLink', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="syncPublishLink">同步发布链接</Label>
                  <Input
                    id="syncPublishLink"
                    placeholder="输入同步发布作品链接"
                    value={formData.syncPublishLink}
                    onChange={(e) => handleInputChange('syncPublishLink', e.target.value)}
                  />
                </div>
              </div>

              {/* 作品数据 */}
              <div className="space-y-3">
                <Label>作品数据</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="exposure" className="text-sm">曝光数</Label>
                    <Input
                      id="exposure"
                      type="number"
                      placeholder="曝光数"
                      value={formData.exposure}
                      onChange={(e) => handleInputChange('exposure', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reads" className="text-sm">阅读数</Label>
                    <Input
                      id="reads"
                      type="number"
                      placeholder="阅读数"
                      value={formData.reads}
                      onChange={(e) => handleInputChange('reads', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="likes" className="text-sm">点赞数</Label>
                    <Input
                      id="likes"
                      type="number"
                      placeholder="点赞数"
                      value={formData.likes}
                      onChange={(e) => handleInputChange('likes', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="comments" className="text-sm">评论数</Label>
                    <Input
                      id="comments"
                      type="number"
                      placeholder="评论数"
                      value={formData.comments}
                      onChange={(e) => handleInputChange('comments', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="collections" className="text-sm">收藏数</Label>
                    <Input
                      id="collections"
                      type="number"
                      placeholder="收藏数"
                      value={formData.collections}
                      onChange={(e) => handleInputChange('collections', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="forwards" className="text-sm">转发数</Label>
                    <Input
                      id="forwards"
                      type="number"
                      placeholder="转发数"
                      value={formData.forwards}
                      onChange={(e) => handleInputChange('forwards', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 备注 */}
              <div>
                <Label htmlFor="periodRemarks">期数备注</Label>
                <Textarea
                  id="periodRemarks"
                  placeholder="输入本期合作的备注信息..."
                  value={formData.periodRemarks}
                  onChange={(e) => handleInputChange('periodRemarks', e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading || !selectedDaren}>
              {loading ? '添加中...' : '添加到本期'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}