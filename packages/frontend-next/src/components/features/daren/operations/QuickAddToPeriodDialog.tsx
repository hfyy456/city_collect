'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { darenApi, periodApi, type Daren } from '@/lib/api'
import { useToast } from '@/components/shared/feedback/NotificationSystem'
import { formatNumber } from '@/lib/utils'

interface QuickAddToPeriodDialogProps {
  period: string
  onSuccess: () => void
  children: React.ReactNode
}

export function QuickAddToPeriodDialog({ period, onSuccess, children }: QuickAddToPeriodDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [allDarens, setAllDarens] = useState<Daren[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDaren, setSelectedDaren] = useState<Daren | null>(null)
  const [fee, setFee] = useState('')
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const toast = useToast()

  // 生成期数选项 (YYYY,MM,Q1\Q2\Q3\Q4格式，Q1-Q4代表每月的第1-4次合作)
  const generatePeriodOptions = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const periods: string[] = []
    
    // 生成当前月和下个月的期数
    for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
      const targetDate = new Date(currentYear, currentMonth - 1 + monthOffset, 1)
      const year = targetDate.getFullYear()
      const month = targetDate.getMonth() + 1
      const monthStr = month.toString().padStart(2, '0')
      
      // 每个月生成4次合作机会：Q1, Q2, Q3, Q4 代表第一次、第二次、第三次、第四次
      for (let count = 1; count <= 4; count++) {
        const period = `${year},${monthStr},Q${count}`
        periods.push(period)
      }
    }
    
    return periods.sort().reverse() // 最新的在前面
  }

  // 过滤达人
  const filteredDarens = allDarens.filter(daren =>
    daren.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (daren.xiaohongshuId && daren.xiaohongshuId.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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
      // 初始化期数选项
      const periods = generatePeriodOptions()
      setAvailablePeriods(periods)
      // 默认选择当前月份的期数
      if (periods.length > 0) {
        setSelectedPeriod(periods[0])
      }
    }
  }, [open, period])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDaren || !fee) return

    setLoading(true)
    try {
      // 准备期数数据，只包含报价
      const periodData = {
        period: selectedPeriod,
        fee: parseFloat(fee),
        contactPerson: ''
      }

      // 为达人添加期数数据
      await periodApi.addPeriodData(selectedDaren._id, periodData)
      
      toast.success('添加成功', `已将 ${selectedDaren.nickname} 添加到 ${selectedPeriod}`)
      
      // 重置表单
      setSelectedDaren(null)
      setFee('')
      setSearchTerm('')
      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error('添加达人到期数失败:', error)
      toast.error('添加失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedDaren(null)
    setFee('')
    setSearchTerm('')
    setSelectedPeriod('')
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) {
        resetForm()
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>快速添加达人到 {period}</DialogTitle>
          <DialogDescription>
            选择达人并填写报价即可快速添加
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 达人选择 */}
          <div className="space-y-3">
            <Label>选择达人</Label>
            
            {!selectedDaren ? (
              <div className="space-y-3">
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
                <div className="border rounded-lg max-h-48 overflow-y-auto">
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
                            {daren.periodData?.slice(0, 2).map(p => (
                              <Badge key={p._id} variant="secondary" className="text-xs">
                                {p.period}
                              </Badge>
                            ))}
                            {(daren.periodData?.length || 0) > 2 && (
                              <Badge variant="secondary" className="text-xs">+{(daren.periodData?.length || 0) - 2}</Badge>
                            )}
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

          {/* 期数选择 */}
          <div>
            <Label htmlFor="period">选择期数 *</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="选择期数" />
              </SelectTrigger>
              <SelectContent>
                {availablePeriods.map(period => (
                  <SelectItem key={period} value={period}>
                    {period}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 报价输入 */}
          {selectedDaren && (
            <div>
              <Label htmlFor="fee">报价 (元) *</Label>
              <Input
                id="fee"
                type="number"
                placeholder="输入报价"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                required
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading || !selectedDaren || !fee || !selectedPeriod}>
              {loading ? '添加中...' : '快速添加'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}