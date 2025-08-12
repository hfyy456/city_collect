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
import { darenApi, type Daren, type PeriodData } from '@/lib/api'
import { normalizeNumber } from '@/lib/utils'
import { SquarePen } from 'lucide-react'
import { useToast } from '@/components/shared/feedback/NotificationSystem'

interface EditPeriodDataDialogProps {
  daren: Daren
  period: string
  periodData: PeriodData
  onSuccess: () => void
}

export function EditPeriodDataDialog({ daren, period, periodData, onSuccess }: EditPeriodDataDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  
  // 期数数据表单
  const [formData, setFormData] = useState({
    fee: '',
    cooperationMethod: '',
    contactPerson: '',
    currentStatus: '待联系',
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

  // 初始化表单数据
  useEffect(() => {
    if (open && periodData) {
      setFormData({
        fee: periodData.fee?.toString() || '',
        cooperationMethod: periodData.cooperationMethod || '',
        contactPerson: periodData.contactPerson || '',
        currentStatus: periodData.currentStatus || '未到店',
        hasConnection: periodData.hasConnection || false,
        inGroup: periodData.inGroup || false,
        arrivedAtStore: periodData.arrivedAtStore || false,
        reviewed: periodData.reviewed || false,
        published: periodData.published || false,
        storeArrivalTime: periodData.storeArrivalTime ? 
          new Date(periodData.storeArrivalTime).toISOString().slice(0, 16) : '',
        mainPublishLink: periodData.mainPublishLink || '',
        syncPublishLink: periodData.syncPublishLink || '',
        exposure: periodData.exposure?.toString() || '',
        reads: periodData.reads?.toString() || '',
        likes: periodData.likes?.toString() || '',
        comments: periodData.comments?.toString() || '',
        collections: periodData.collections?.toString() || '',
        forwards: periodData.forwards?.toString() || '',
        periodRemarks: periodData.periodRemarks || ''
      })
    }
  }, [open, periodData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    try {
      // 准备更新数据
      const updateData = {
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

      // 更新期数数据
      await darenApi.updatePeriodData(daren._id, period, updateData)
      
      setOpen(false)
      onSuccess()
    } catch (error) {
        console.error('更新期数数据失败:', error)
        toast.error('更新失败，请重试')
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
        <Button variant="ghost" size="sm">
          <SquarePen className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑 {daren.nickname} 在 {period} 期的数据</DialogTitle>
          <DialogDescription>
            修改达人在本期的合作信息和作品数据
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存修改'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}