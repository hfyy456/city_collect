'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CookieStorage, type SavedCookie } from '@/lib/cookieStorage'
import { formatDate } from '@/lib/utils'
import { 
  Cookie, 
  Plus, 
  Star, 
  Trash2, 
  Settings, 
  CheckCircle,
  AlertCircle,
  History
} from 'lucide-react'
import { useToast } from '@/components/shared/feedback'

interface CookieManagerProps {
  onCookieSelected?: (cookie: string) => void
}

export function CookieManager({ onCookieSelected }: CookieManagerProps) {
  const [cookies, setCookies] = useState<SavedCookie[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showManageDialog, setShowManageDialog] = useState(false)
  const [newCookieName, setNewCookieName] = useState('')
  const [newCookieValue, setNewCookieValue] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadCookies()
  }, [])

  const loadCookies = () => {
    const cookieHistory = CookieStorage.getCookieHistory()
    setCookies(cookieHistory)
  }

  const handleSaveCookie = async () => {
    if (!newCookieName.trim() || !newCookieValue.trim()) {
      toast.error('请填写Cookie名称和内容')
      return
    }

    setLoading(true)
    try {
      const validation = CookieStorage.validateCookie(newCookieValue)
      if (!validation.isValid) {
        toast.error(validation.message)
        return
      }

      CookieStorage.saveCookie(newCookieName.trim(), newCookieValue.trim())
      loadCookies()
      setNewCookieName('')
      setNewCookieValue('')
      setShowAddDialog(false)
      toast.success(`Cookie "${newCookieName}" 已保存`)
    } catch (error) {
      toast.error('保存Cookie失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCookie = (cookie: SavedCookie) => {
    CookieStorage.setDefaultCookie(cookie.id)
    CookieStorage.useCookie(cookie.id)
    loadCookies()
    onCookieSelected?.(cookie.cookie)
    toast.success(`已选择Cookie: ${cookie.name}`)
  }

  const handleDeleteCookie = (cookieId: string) => {
    try {
      CookieStorage.deleteCookie(cookieId)
      loadCookies()
      toast.success('Cookie已删除')
    } catch (error) {
      toast.error('删除Cookie失败')
    }
  }

  const handleSetDefaultCookie = (cookieId: string) => {
    try {
      CookieStorage.setDefaultCookie(cookieId)
      loadCookies()
      toast.success('已设置为默认Cookie')
    } catch (error) {
      toast.error('设置默认Cookie失败')
    }
  }

  const defaultCookie = cookies.find(c => c.isDefault)

  return (
    <>
      {/* Cookie状态指示器和下拉菜单 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center space-x-2 hover:bg-gray-50 rounded-xl transition-all duration-200"
          >
            <div className="relative">
              <Cookie className="h-4 w-4" />
              {defaultCookie && (
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full" />
              )}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">
              {defaultCookie ? defaultCookie.name : 'Cookie'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Cookie管理</span>
            <Badge variant={defaultCookie ? 'default' : 'secondary'} className="text-xs">
              {cookies.length}/5
            </Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* 当前默认Cookie */}
          {defaultCookie ? (
            <div className="px-2 py-2 border-b">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">{defaultCookie.name}</span>
              </div>
              <div className="text-xs text-gray-500">
                最后使用: {formatDate(defaultCookie.lastUsed)}
              </div>
              <div className="text-xs text-gray-400 font-mono mt-1">
                {CookieStorage.formatCookieDisplay(defaultCookie.cookie, 40)}
              </div>
            </div>
          ) : (
            <div className="px-2 py-3 text-center text-sm text-gray-500">
              未设置默认Cookie
            </div>
          )}
          
          {/* 快速选择其他Cookie */}
          {cookies.filter(c => !c.isDefault).slice(0, 2).map((cookie) => (
            <DropdownMenuItem 
              key={cookie.id}
              onClick={() => handleSelectCookie(cookie)}
              className="flex-col items-start p-3"
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-sm font-medium">{cookie.name}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatDate(cookie.lastUsed)}
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowManageDialog(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>管理所有Cookie</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            <span>添加新Cookie</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 添加Cookie对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              添加新Cookie
            </DialogTitle>
            <DialogDescription>
              添加小红书Cookie以获取更完整的数据解析能力
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cookieName">Cookie名称</Label>
              <Input
                id="cookieName"
                placeholder="例如：主账号、测试账号等"
                value={newCookieName}
                onChange={(e) => setNewCookieName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cookieValue">Cookie内容</Label>
              <Textarea
                id="cookieValue"
                placeholder="请粘贴完整的Cookie字符串..."
                value={newCookieValue}
                onChange={(e) => setNewCookieValue(e.target.value)}
                className="min-h-[120px] text-xs font-mono"
              />
              {newCookieValue && (
                <div className="text-xs text-gray-500">
                  {CookieStorage.validateCookie(newCookieValue).isValid ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      Cookie格式正确
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-600">
                      <AlertCircle className="h-3 w-3" />
                      {CookieStorage.validateCookie(newCookieValue).message}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button 
              onClick={handleSaveCookie} 
              disabled={!newCookieName.trim() || !newCookieValue.trim() || loading}
            >
              {loading ? '保存中...' : '保存Cookie'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cookie管理对话框 */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Cookie管理
            </DialogTitle>
            <DialogDescription>
              管理已保存的Cookie，设置默认Cookie或删除不需要的Cookie
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {cookies.length === 0 ? (
              <div className="text-center py-8">
                <Cookie className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">还没有保存任何Cookie</p>
                <Button onClick={() => {
                  setShowManageDialog(false)
                  setShowAddDialog(true)
                }} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  添加Cookie
                </Button>
              </div>
            ) : (
              cookies.map((cookie) => (
                <div key={cookie.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{cookie.name}</span>
                      {cookie.isDefault && (
                        <Badge variant="default" className="text-xs">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          默认
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!cookie.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefaultCookie(cookie.id)}
                          className="h-8 px-2"
                        >
                          <Star className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCookie(cookie.id)}
                        className="h-8 px-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 space-y-1">
                    <div>创建时间: {formatDate(cookie.createdAt)}</div>
                    <div>最后使用: {formatDate(cookie.lastUsed)}</div>
                  </div>
                  
                  <div className="text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded">
                    {CookieStorage.formatCookieDisplay(cookie.cookie, 80)}
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowManageDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CookieManager