'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { periodApi, type PeriodData, type Daren } from '@/lib/api'
import { normalizeNumber } from '@/lib/utils'
import { Loader2, Edit3 } from 'lucide-react'
import { useToast } from '@/components/shared/feedback/NotificationSystem'

interface EditPeriodDataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  daren: Daren | null
  periodData: PeriodData | null
  period: string
  onSuccess: () => void
}

export function EditPeriodDataDialog({ 
  open, 
  onOpenChange, 
  daren, 
  periodData, 
  period, 
  onSuccess 
}: EditPeriodDataDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fee: '',
    contactPerson: '',
    storeArrivalTime: '',
    mainPublishLink: '',
    syncPublishLink: '',
    likes: '',
    comments: '',
    collections: '',
    periodRemarks: ''
  })
  
  const toast = useToast()

  // 初始化表单数据
  useEffect(() => {
    if (periodData && open) {
      setFormData({
        fee: periodData.fee?.toString() || '',
        contactPerson: periodData.contactPerson || '',
        storeArrivalTime: periodData.storeArrivalTime ? 
          new Date(periodData.storeArrivalTime).toISOString().slice(0, 16) : '',
        mainPublishLink: periodData.mainPublishLink || '',
        syncPublishLink: periodData.syncPublishLink || '',
        likes: periodData.likes?.toString() || '',
        comments: periodData.comments?.toString() || '',
        collections: periodData.collections?.toString() || '',
        periodRemarks: periodData.periodRemarks || ''
      })
    }
  }, [periodData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!daren) return

    setLoading(true)
    try {
      const updateData = {
        fee: formData.fee ? normalizeNumber(formData.fee) : undefined,
        contactPerson: formData.contactPerson || undefined,
        storeArrivalTime: formData.storeArrivalTime ? new Date(formData.storeArrivalTime) : undefined,
        mainPublishLink: formData.mainPublishLink || undefined,
        syncPublishLink: formData.syncPublishLink || undefined,
        likes: formData.likes ? normalizeNumber(formData.likes) : undefined,
        comments: formData.comments ? normalizeNumber(formData.comments) : undefined,
        collections: formData.collections ? normalizeNumber(formData.collections) : undefined,
        periodRemarks: formData.periodRemarks || undefined
      }

      await periodApi.updatePeriodData(daren._id!, period, updateData)
      toast.success('期数数据更新成功')
      onOpenChange(false)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            编辑期数数据
          </DialogTitle>
          <DialogDescription>
            编辑 {daren?.nickname} 在 {period} 的数据
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">基本信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="fee">报价（元）</Label>
                <Input
                  id="fee"
                  type="number"
                  placeholder="输入报价"
                  value={formData.fee}
                  onChange={(e) => handleInputChange('fee', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="contactPerson">联系人</Label>
                <Input
                  id="contactPerson"
                  placeholder="输入联系人"
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 到店时间 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="storeArrivalTime">到店时间</Label>
              <Input
                id="storeArrivalTime"
                type="datetime-local"
                value={formData.storeArrivalTime}
                onChange={(e) => handleInputChange('storeArrivalTime', e.target.value)}
              />
            </div>
          </div>

          {/* 作品链接 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">作品链接</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mainPublishLink">主发布链接</Label>
                <Input
                  id="mainPublishLink"
                  placeholder="输入主发布链接"
                  value={formData.mainPublishLink}
                  onChange={(e) => handleInputChange('mainPublishLink', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="syncPublishLink">同步发布链接</Label>
                <Input
                  id="syncPublishLink"
                  placeholder="输入同步发布链接"
                  value={formData.syncPublishLink}
                  onChange={(e) => handleInputChange('syncPublishLink', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 作品数据 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">作品数据</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="likes">点赞数</Label>
                <Input
                  id="likes"
                  type="number"
                  placeholder="点赞数"
                  value={formData.likes}
                  onChange={(e) => handleInputChange('likes', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="comments">评论数</Label>
                <Input
                  id="comments"
                  type="number"
                  placeholder="评论数"
                  value={formData.comments}
                  onChange={(e) => handleInputChange('comments', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="collections">收藏数</Label>
                <Input
                  id="collections"
                  type="number"
                  placeholder="收藏数"
                  value={formData.collections}
                  onChange={(e) => handleInputChange('collections', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 备注 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">备注</h3>
            <div>
              <Label htmlFor="periodRemarks">期数备注</Label>
              <Textarea
                id="periodRemarks"
                placeholder="输入期数备注"
                value={formData.periodRemarks}
                onChange={(e) => handleInputChange('periodRemarks', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存更改
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditPeriodDataDialog