'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { CookieStorage, type SavedCookie } from '@/lib/cookieStorage'
import { formatDate } from '@/lib/utils'
import { Cookie, Plus } from 'lucide-react'

interface CookieSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCookieSelected: (cookie: string) => void
  onAddCookie?: () => void
  title?: string
  description?: string
}

export function CookieSelectDialog({
  open,
  onOpenChange,
  onCookieSelected,
  onAddCookie,
  title = '选择Cookie',
  description = '请选择一个Cookie来获取完整的数据'
}: CookieSelectDialogProps) {
  const [cookies, setCookies] = useState<SavedCookie[]>([])
  const [selectedCookieId, setSelectedCookieId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadCookies()
    }
  }, [open])

  const loadCookies = () => {
    const cookieHistory = CookieStorage.getCookieHistory()
    setCookies(cookieHistory)
    
    // 如果有默认cookie，自动选中
    const defaultCookie = cookieHistory.find(c => c.isDefault)
    if (defaultCookie) {
      setSelectedCookieId(defaultCookie.id)
    } else if (cookieHistory.length > 0) {
      setSelectedCookieId(cookieHistory[0].id)
    }
  }

  const handleConfirm = async () => {
    if (!selectedCookieId) return
    
    setLoading(true)
    try {
      const selectedCookie = cookies.find(c => c.id === selectedCookieId)
      if (selectedCookie) {
        // 设置为默认cookie
        CookieStorage.setDefaultCookie(selectedCookieId)
        // 更新使用时间
        CookieStorage.useCookie(selectedCookieId)
        // 返回选中的cookie
        onCookieSelected(selectedCookie.cookie)
        onOpenChange(false)
      }
    } catch (error) {
      console.error('设置默认Cookie失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCookie = () => {
    onOpenChange(false)
    onAddCookie?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {cookies.length === 0 ? (
            <div className="text-center py-8">
              <Cookie className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">还没有保存任何Cookie</p>
              <Button onClick={handleAddCookie} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                添加Cookie
              </Button>
            </div>
          ) : (
            <>
              <Label>选择要使用的Cookie：</Label>
              <RadioGroup value={selectedCookieId} onValueChange={setSelectedCookieId}>
                {cookies.map((cookie) => (
                  <div key={cookie.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={cookie.id} id={cookie.id} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={cookie.id} className="font-medium cursor-pointer">
                          {cookie.name}
                        </Label>
                        {cookie.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            默认
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        创建时间: {formatDate(cookie.createdAt)}
                      </div>
                      <div className="text-sm text-gray-500">
                        最后使用: {formatDate(cookie.lastUsed)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 font-mono">
                        {CookieStorage.formatCookieDisplay(cookie.cookie, 60)}
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
              
              <div className="flex justify-center pt-2">
                <Button onClick={handleAddCookie} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  添加新Cookie
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedCookieId || loading}
            className="min-w-[80px]"
          >
            {loading ? '设置中...' : '确认使用'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}