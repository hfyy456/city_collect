'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { periodApi, type Daren } from '@/lib/api'
import { useToast } from '@/components/shared/feedback/NotificationSystem'
import { LoadingSpinner } from '@/components/shared/feedback/LoadingStates'

interface QuickAddToPeriodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  daren: Daren
}

export function QuickAddToPeriodDialog({ open, onOpenChange, daren }: QuickAddToPeriodDialogProps) {
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('')
  const [fee, setFee] = useState('')
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([])
  const toast = useToast()

  // 生成期数选项 (YYYY,MM,Q1\Q2\Q3\Q4格式)
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

  // 加载可用期数
  const loadAvailablePeriods = async () => {
    try {
      const periods = generatePeriodOptions()
      setAvailablePeriods(periods)
    } catch (error) {
      console.error('加载期数列表失败:', error)
    }
  }

  useEffect(() => {
    if (open) {
      // 初始化期数选项并设置默认值
      const periods = generatePeriodOptions()
      setAvailablePeriods(periods)
      // 默认选择当前月份的第一次合作（Q1）
      if (periods.length > 0) {
        const currentYear = new Date().getFullYear()
        const currentMonth = new Date().getMonth() + 1
        const currentPeriod = `${currentYear},${currentMonth.toString().padStart(2, '0')},Q1`
        const foundPeriod = periods.find(p => p === currentPeriod)
        setPeriod(foundPeriod || periods[0])
      } else {
        setPeriod('')
      }
      // 重置费用
      setFee('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!period || !fee) {
      toast.error('请填写完整信息')
      return
    }

    setLoading(true)
    try {
      // 准备期数数据
      const periodData = {
        period,
        fee: parseFloat(fee) || 0,

        contactPerson: '', // 空联系人
        isContacted: false,
        isConfirmed: false,
        isCompleted: false,
        isPaid: false
      }

      await periodApi.addPeriodData(daren._id, periodData)
      
      toast.success(`成功将 ${daren.nickname} 添加到 ${period} 期`)
      onOpenChange(false)
      
      // 刷新页面数据
      window.location.reload()
    } catch (error) {
      console.error('添加到期数失败:', error)
      toast.error('添加失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>快速添加到期数</DialogTitle>
          <DialogDescription>
            将 {daren.nickname} 添加到指定期数，只需填写报价即可。
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="period">选择期数</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="请选择期数" />
              </SelectTrigger>
              <SelectContent>
                {availablePeriods.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fee">报价 (元)</Label>
            <Input
              id="fee"
              type="number"
              placeholder="请输入报价"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading || !period || !fee}>
              {loading && <LoadingSpinner className="mr-2 h-4 w-4" />}
              添加
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}