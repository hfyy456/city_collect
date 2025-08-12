'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { darenApi, type Daren } from '@/lib/api'
import { CookieStorage, type SavedCookie } from '@/lib/cookieStorage'
import { normalizeDarenData } from '@/lib/utils'
import { Plus, Link, Loader2, AlertCircle, CheckCircle, X, Save, History, Trash2, Star } from 'lucide-react'
import { useToast } from '@/components/NotificationSystem'

interface AddDarenDialogProps {
  onSuccess?: (daren: Daren) => void
}

export function AddDarenDialog({ onSuccess }: AddDarenDialogProps) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [parseLoading, setParseLoading] = useState(false)
  const [showCookieInput, setShowCookieInput] = useState(false)
  const [showCookieManager, setShowCookieManager] = useState(false)
  const [parseSuccess, setParseSuccess] = useState(false)
  const [parseError, setParseError] = useState('')
  const [cookieHistory, setCookieHistory] = useState<SavedCookie[]>([])
  const [newCookieName, setNewCookieName] = useState('')
  const [formData, setFormData] = useState({
    nickname: '',
    xiaohongshuId: '',
    homePage: '',
    followers: '',
    ipLocation: '',
    contactInfo: '',
    likesAndCollections: '',
    remarks: '',
    xhsCookie: ''
  })

  // 加载保存的Cookie
  useEffect(() => {
    const defaultCookie = CookieStorage.getDefaultCookie()
    const history = CookieStorage.getCookieHistory()
    
    setCookieHistory(history)
    
    if (defaultCookie) {
      setFormData(prev => ({ ...prev, xhsCookie: defaultCookie }))
    }
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

  // Cookie管理功能
  const handleSaveCookie = () => {
    if (!formData.xhsCookie.trim()) {
      toast.error('请先输入Cookie')
      return
    }
    
    if (!newCookieName.trim()) {
      toast.error('请输入Cookie名称')
      return
    }

    try {
      CookieStorage.saveCookie(newCookieName.trim(), formData.xhsCookie.trim())
      const updatedHistory = CookieStorage.getCookieHistory()
      setCookieHistory(updatedHistory)
      setNewCookieName('')
      toast.success(`Cookie "${newCookieName}" 已保存`)
    } catch (error) {
      toast.error('保存Cookie失败')
    }
  }

  const handleSelectCookie = (cookie: SavedCookie) => {
    setFormData(prev => ({ ...prev, xhsCookie: cookie.cookie || '' }))
    setShowCookieManager(false)
    toast.success(`已选择Cookie: ${cookie.name}`)
  }

  const handleDeleteCookie = (cookieId: string) => {
    try {
      CookieStorage.deleteCookie(cookieId)
      const updatedHistory = CookieStorage.getCookieHistory()
      setCookieHistory(updatedHistory)
      toast.success('Cookie已删除')
    } catch (error) {
      toast.error('删除Cookie失败')
    }
  }

  const handleSetDefaultCookie = (cookieId: string) => {
    try {
      CookieStorage.setDefaultCookie(cookieId)
      const updatedHistory = CookieStorage.getCookieHistory()
      setCookieHistory(updatedHistory)
      toast.success('已设置为默认Cookie')
    } catch (error) {
      toast.error('设置默认Cookie失败')
    }
  }

  const handleParseXhsUrl = async () => {
    if (!formData.homePage) return

    try {
      setParseLoading(true)
      setParseError('')
      setParseSuccess(false)
      
      const result = await darenApi.parseXhsUser(formData.homePage, formData.xhsCookie)
      
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
        console.log('✅ 解析成功:', result.parseMethod)
      } else {
        console.warn('⚠️ 解析不完整:', result.message || '未获取到完整数据')
        setParseError(result.message || '解析失败，请检查链接是否正确')
        if (result.suggestions) {
          console.log('建议:', result.suggestions)
        }
        
        if (result.cookieRequired && !formData.xhsCookie) {
          setShowCookieInput(true)
        }
      }
    } catch (error: any) {
      console.error('解析小红书页面失败:', error)
      setParseError('网络错误或链接格式不正确，请重试')
      if (error.response?.status === 403 || error.response?.status === 401) {
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

      // 标准化数据
      const normalizedData = normalizeDarenData(darenData)
      const newDaren = await darenApi.create(normalizedData)
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
        remarks: '',
        xhsCookie: ''
      })
      setShowCookieInput(false)
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
    <div>
      <Button onClick={() => setOpen(!open)}>
        <Plus className="w-4 h-4 mr-2" />
        添加达人
      </Button>
      {open && (
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
                

                
                {/* Cookie管理界面 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="xhsCookie">小红书Cookie</Label>
                      {formData.xhsCookie.trim() ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          <CheckCircle className="w-3 h-3" />
                          已填入
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                          <AlertCircle className="w-3 h-3" />
                          未填入
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCookieManager(!showCookieManager)}
                      >
                        <History className="w-4 h-4 mr-1" />
                        Cookie管理
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCookieInput(!showCookieInput)}
                      >
                        {showCookieInput ? '隐藏' : '显示'} Cookie输入
                      </Button>
                    </div>
                  </div>
                  
                  {/* Cookie管理界面 */}
                  {showCookieManager && (
                    <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Cookie历史记录</h4>
                        <span className="text-xs text-gray-500">{cookieHistory.length}/5</span>
                      </div>
                      
                      {cookieHistory.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {cookieHistory.map((cookie) => (
                            <div key={cookie.id} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium truncate">{cookie.name}</span>
                                  {cookie.isDefault && (
                                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  保存于: {new Date(cookie.savedAt || cookie.createdAt).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-400 truncate">
                                  {cookie.cookie ? cookie.cookie.substring(0, 50) + '...' : '无Cookie内容'}
                                </div>
                              </div>
                              <div className="flex gap-1 ml-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSelectCookie(cookie)}
                                  className="h-8 px-2"
                                >
                                  选择
                                </Button>
                                {!cookie.isDefault && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSetDefaultCookie(cookie.id)}
                                    className="h-8 px-2"
                                  >
                                    <Star className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCookie(cookie.id)}
                                  className="h-8 px-2 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          暂无保存的Cookie
                        </div>
                      )}
                      
                      {/* 保存新Cookie */}
                      <div className="border-t pt-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Cookie名称"
                            value={newCookieName}
                            onChange={(e) => setNewCookieName(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleSaveCookie}
                            disabled={!formData.xhsCookie.trim() || !newCookieName.trim()}
                          >
                            <Save className="w-4 h-4 mr-1" />
                            保存当前Cookie
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {showCookieInput && (
                    <Textarea
                      id="xhsCookie"
                      placeholder="请输入小红书Cookie（用于解析用户信息）"
                      value={formData.xhsCookie}
                      onChange={(e) => handleInputChange('xhsCookie', e.target.value)}
                      className="min-h-[100px] text-xs"
                    />
                  )}
                  
                  {/* 显示Cookie按钮 */}
                  {!showCookieInput && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCookieInput(true)}
                      className="text-xs text-gray-500 hover:text-gray-700 h-auto p-1"
                    >
                      需要更完整的数据？添加Cookie
                    </Button>
                  )}
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
        </div>
      )}
    </div>
  )
}