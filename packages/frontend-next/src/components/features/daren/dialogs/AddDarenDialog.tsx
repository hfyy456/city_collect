'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { darenApi, type Daren } from '@/lib/api'
import { CookieStorage } from '@/lib/cookieStorage'
// 移除了 normalizeDarenData 导入，现在由后端处理数据标准化
import { Plus, Link, Loader2, AlertCircle, CheckCircle, X, Cookie } from 'lucide-react'
import { useToast } from '@/components/shared/feedback/NotificationSystem'

interface AddDarenDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: (daren: Daren) => void
}

export function AddDarenDialog({ open: externalOpen, onOpenChange, onSuccess }: AddDarenDialogProps) {
  const toast = useToast()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const [loading, setLoading] = useState(false)
  const [parseLoading, setParseLoading] = useState(false)

  // 防止滚动穿透
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  const [parseSuccess, setParseSuccess] = useState(false)
  const [parseError, setParseError] = useState('')

  const [formData, setFormData] = useState({
    nickname: '',
    xiaohongshuId: '',
    homePage: '',
    followers: '',
    ipLocation: '',
    contactInfo: '',
    likesAndCollections: '',
    remarks: '',

  })

  // 重置表单数据
  useEffect(() => {
  }, [open])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (parseSuccess) {
      setParseSuccess(false)
    }
    if (parseError) {
      setParseError('')
    }
  }



  const handleParseXhsUrl = async () => {
    if (!formData.homePage) return

    try {
      setParseLoading(true)
      setParseError('')
      setParseSuccess(false)
      
      console.log('🔍 [DEBUG] 开始解析小红书页面:', formData.homePage)
      
      // 获取默认Cookie
      console.log('🍪 [DEBUG] 开始获取默认Cookie...')
      const defaultCookie = await CookieStorage.getDefaultCookie()
      console.log('🍪 [DEBUG] 获取到的Cookie:', defaultCookie ? `长度: ${defaultCookie.length}` : '空值')
      
      // 获取Cookie历史记录进行调试
      const cookieHistory = await CookieStorage.getCookieHistory()
      console.log('📋 [DEBUG] Cookie历史记录数量:', cookieHistory.length)
      console.log('📋 [DEBUG] Cookie历史记录:', cookieHistory.map(c => ({
        name: c.name,
        isDefault: c.isDefault,
        isExpired: c.isExpired,
        lastUsed: c.lastUsed,
        cookieLength: c.cookie?.length || 0
      })))
      
      // 获取默认Cookie记录
      const defaultRecord = await CookieStorage.getDefaultCookieRecord()
      console.log('🎯 [DEBUG] 默认Cookie记录:', defaultRecord ? {
        name: defaultRecord.name,
        isDefault: defaultRecord.isDefault,
        isExpired: defaultRecord.isExpired,
        cookieLength: defaultRecord.cookie?.length || 0
      } : '无默认记录')
      
      console.log('🚀 [DEBUG] 开始调用解析API...')
      const result = await darenApi.parseXhsUser(formData.homePage, defaultCookie)
      console.log('📊 [DEBUG] 解析结果:', result)
      
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          nickname: result.nickname || prev.nickname,
          xiaohongshuId: result.xiaohongshuId || prev.xiaohongshuId,
          followers: result.followers || prev.followers,
          ipLocation: result.ipLocation || prev.ipLocation,
          likesAndCollections: result.likesAndCollections || prev.likesAndCollections
        }))
        
        setParseSuccess(true)
        console.log('✅ [DEBUG] 解析成功:', result.parseMethod)
      } else {
        console.log('❌ [DEBUG] 解析失败:', result.message || '未获取到完整数据')
        setParseError(result.message || '解析失败，请检查链接是否正确')
        if (result.suggestions) {
          console.log('💡 [DEBUG] 建议:', result.suggestions)
        }
        
        if (result.cookieRequired && !defaultCookie) {
          console.log('🍪 [DEBUG] 需要Cookie但未获取到默认Cookie')
          setParseError('需要Cookie才能获取完整数据，请在导航栏中设置Cookie')
        }
      }
    } catch (error: any) {
      console.error('💥 [DEBUG] 解析小红书页面失败:', error)
      setParseError('网络错误或链接格式不正确，请重试')
      if (error.response?.status === 403 || error.response?.status === 401) {
        console.log('🔒 [DEBUG] 认证错误，显示Cookie输入框')
        setShowCookieInput(true)
      }
    } finally {
      setParseLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nickname) {
      toast.warning('请填写达人昵称', '昵称是必填字段')
      return
    }
    
    try {
      setLoading(true)
      
      const darenData: Partial<Daren> = {
        nickname: formData.nickname,
        xiaohongshuId: formData.xiaohongshuId,
        homePage: formData.homePage,
        followers: formData.followers,
        ipLocation: formData.ipLocation,
        contactInfo: formData.contactInfo,
        likesAndCollections: formData.likesAndCollections,
        remarks: formData.remarks,
        periodData: []
      }

      // 直接发送数据，让后端处理标准化
      const newDaren = await darenApi.create(darenData)
      toast.success('添加达人成功', `${formData.nickname} 已成功添加到系统`)
      onSuccess?.(newDaren)
      setOpen(false)
      
      // 重置表单
      setFormData({
        nickname: '',
        xiaohongshuId: '',
        homePage: '',
        followers: '',
        ipLocation: '',
        contactInfo: '',
        likesAndCollections: '',
        remarks: ''
      })
      setParseSuccess(false)
      setParseError('')
    } catch (error) {
      console.error('创建达人失败:', error)
      toast.error('创建达人失败', '请检查网络连接或联系技术支持')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {externalOpen === undefined && (
        <Button onClick={() => setOpen(!open)}>
          <Plus className="w-4 h-4 mr-2" />
          添加达人
        </Button>
      )}
      {open && createPortal(
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">添加新达人</h2>
                <p className="text-sm text-gray-600 mt-1">
                  填写达人基本信息，或输入小红书主页链接自动解析
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 小红书主页链接 */}
              <div className="space-y-2">
                <Label htmlFor="homePage">小红书主页链接</Label>
                <div className="flex space-x-2">
                  <Input
                    id="homePage"
                    placeholder="https://www.xiaohongshu.com/user/profile/..."
                    value={formData.homePage}
                    onChange={(e) => handleInputChange('homePage', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleParseXhsUrl}
                    disabled={!formData.homePage || parseLoading}
                    className="shrink-0"
                  >
                    {parseLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : parseSuccess ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : parseError ? (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <Link className="w-4 h-4" />
                    )}
                    <span className="ml-2">
                      {parseLoading ? '解析中...' : parseSuccess ? '解析成功' : '解析'}
                    </span>
                  </Button>
                </div>
                
                {/* 解析状态提示 */}
                {parseError && (
                  <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{parseError}</span>
                  </div>
                )}
                
                {parseSuccess && !parseError && (
                  <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-3 rounded-md">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>解析成功！信息已自动填充</span>
                  </div>
                )}
                

                
                {/* Cookie状态提示 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Cookie className="h-4 w-4" />
                    <span>Cookie管理已移至导航栏，解析时将自动使用默认Cookie</span>
                  </div>
                </div>


              </div>

              {/* 基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname">昵称 *</Label>
                  <Input
                    id="nickname"
                    required
                    value={formData.nickname}
                    onChange={(e) => handleInputChange('nickname', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="xiaohongshuId">小红书号</Label>
                  <Input
                    id="xiaohongshuId"
                    value={formData.xiaohongshuId}
                    onChange={(e) => handleInputChange('xiaohongshuId', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="followers">粉丝数</Label>
                  <Input
                    id="followers"
                    placeholder="如：10.5万"
                    value={formData.followers}
                    onChange={(e) => handleInputChange('followers', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ipLocation">IP属地</Label>
                  <Input
                    id="ipLocation"
                    value={formData.ipLocation}
                    onChange={(e) => handleInputChange('ipLocation', e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="likesAndCollections">点赞与收藏</Label>
                  <Input
                    id="likesAndCollections"
                    placeholder="如：5.8万"
                    value={formData.likesAndCollections}
                    onChange={(e) => handleInputChange('likesAndCollections', e.target.value)}
                  />
                </div>
              </div>

              {/* 联系信息 */}
              <div className="space-y-2">
                <Label htmlFor="contactInfo">联系方式</Label>
                <Input
                  id="contactInfo"
                  placeholder="微信、电话等联系方式"
                  value={formData.contactInfo}
                  onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                />
              </div>

              {/* 备注 */}
              <div className="space-y-2">
                <Label htmlFor="remarks">备注</Label>
                <Textarea
                  id="remarks"
                  placeholder="其他备注信息..."
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={loading || !formData.nickname}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    '创建达人'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}