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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { darenApi, type Daren } from '@/lib/api'
import { normalizeNumber } from '@/lib/utils'
import { SquarePen, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'
import { useToast } from '@/components/shared/feedback/NotificationSystem'

interface EditDarenDialogProps {
  daren: Daren
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditDarenDialog({ daren, open, onOpenChange, onSuccess }: EditDarenDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nickname: '',
    xiaohongshuId: '',
    homePage: '',
    followers: '',
    likesAndCollections: '',
    ipLocation: '',
    remarks: ''
  })
  const toast = useToast()

  // 初始化表单数据
  useEffect(() => {
    if (daren && open) {
      setFormData({
        nickname: daren.nickname || '',
        xiaohongshuId: daren.xiaohongshuId || '',
        homePage: daren.homePage || '',
        followers: daren.followers?.toString() || '',
        likesAndCollections: daren.likesAndCollections?.toString() || '',
        ipLocation: daren.ipLocation || '',
        remarks: daren.remarks || ''
      })
    }
  }, [daren, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nickname.trim()) {
      toast.error('请输入达人昵称')
      return
    }

    setLoading(true)
    try {
      const updateData = {
        nickname: formData.nickname.trim(),
        xiaohongshuId: formData.xiaohongshuId.trim(),
        homePage: formData.homePage.trim(),
        followers: formData.followers ? normalizeNumber(formData.followers) : undefined,
        likesAndCollections: formData.likesAndCollections ? normalizeNumber(formData.likesAndCollections) : undefined,
        ipLocation: formData.ipLocation.trim(),
        remarks: formData.remarks.trim()
      }

      await darenApi.update(daren._id, updateData)
      toast.success('达人信息更新成功')
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('更新达人信息失败:', error)
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑达人信息</DialogTitle>
          <DialogDescription>
            修改达人的基本信息和联系方式
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nickname">达人昵称 *</Label>
              <Input
                id="nickname"
                placeholder="输入达人昵称"
                value={formData.nickname}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="xiaohongshuId">小红书ID</Label>
              <Input
                id="xiaohongshuId"
                placeholder="输入小红书ID"
                value={formData.xiaohongshuId}
                onChange={(e) => handleInputChange('xiaohongshuId', e.target.value)}
              />
            </div>
          </div>

          {/* 主页链接 */}
          <div>
            <Label htmlFor="homePage">小红书主页链接</Label>
            <Input
              id="homePage"
              placeholder="https://www.xiaohongshu.com/user/profile/..."
              value={formData.homePage}
              onChange={(e) => handleInputChange('homePage', e.target.value)}
            />
          </div>

          {/* 数据信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="followers">粉丝数</Label>
              <Input
                id="followers"
                type="number"
                placeholder="输入粉丝数"
                value={formData.followers}
                onChange={(e) => handleInputChange('followers', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="likesAndCollections">点赞与收藏</Label>
              <Input
                id="likesAndCollections"
                type="number"
                placeholder="输入点赞与收藏数"
                value={formData.likesAndCollections}
                onChange={(e) => handleInputChange('likesAndCollections', e.target.value)}
              />
            </div>
          </div>

          {/* IP归属地 */}
          <div>
            <Label htmlFor="ipLocation">IP归属地</Label>
            <Input
              id="ipLocation"
              placeholder="输入IP归属地"
              value={formData.ipLocation}
              onChange={(e) => handleInputChange('ipLocation', e.target.value)}
            />
          </div>

          {/* 备注 */}
          <div>
            <Label htmlFor="remarks">备注</Label>
            <Textarea
              id="remarks"
              placeholder="其他备注信息..."
              value={formData.remarks}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading || !formData.nickname.trim()}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  更新中...
                </>
              ) : (
                '更新信息'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}