'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  Save, 
  Trash2,
  RotateCcw,
  Calendar
} from 'lucide-react'
import { darenApi, type SearchParams } from '@/lib/api'
import { useToast } from '@/components/shared/feedback/NotificationSystem'

interface AdvancedSearchProps {
  onSearch: (params: SearchParams) => void
  initialParams?: SearchParams
}

interface SavedSearch {
  id: string
  name: string
  params: SearchParams
  createdAt: string
}

export function AdvancedSearch({ onSearch, initialParams = {} }: AdvancedSearchProps) {
  const toast = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [searchParams, setSearchParams] = useState<SearchParams>(initialParams)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [periods, setPeriods] = useState<string[]>([])
  const [ipLocations, setIpLocations] = useState<string[]>([])
  const [saveSearchName, setSaveSearchName] = useState('')

  // 加载选项数据
  useEffect(() => {
    loadOptions()
    loadSavedSearches()
  }, [])

  const loadOptions = async () => {
    try {
      const [periodsData, locationsData] = await Promise.all([
        darenApi.getPeriods(),
        darenApi.getIpLocations()
      ])
      setPeriods(periodsData)
      setIpLocations(locationsData)
    } catch (error) {
      console.error('加载选项失败:', error)
    }
  }

  const loadSavedSearches = () => {
    try {
      const saved = localStorage.getItem('savedSearches')
      if (saved) {
        setSavedSearches(JSON.parse(saved))
      }
    } catch (error) {
      console.error('加载保存的搜索失败:', error)
    }
  }

  const handleParamChange = (key: keyof SearchParams, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value,
      page: 1 // 重置页码
    }))
  }

  const handleSearch = () => {
    onSearch(searchParams)
    toast.info('搜索已更新', '正在加载搜索结果...')
  }

  const handleReset = () => {
    const resetParams: SearchParams = { page: 1, limit: 20 }
    setSearchParams(resetParams)
    onSearch(resetParams)
    toast.info('搜索已重置', '已清除所有筛选条件')
  }

  const handleSaveSearch = () => {
    if (!saveSearchName.trim()) {
      toast.warning('请输入搜索名称')
      return
    }

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: saveSearchName.trim(),
      params: searchParams,
      createdAt: new Date().toISOString()
    }

    const updated = [...savedSearches, newSearch]
    setSavedSearches(updated)
    localStorage.setItem('savedSearches', JSON.stringify(updated))
    setSaveSearchName('')
    toast.success('搜索已保存', `"${newSearch.name}" 已保存到常用搜索`)
  }

  const handleLoadSearch = (search: SavedSearch) => {
    setSearchParams(search.params)
    onSearch(search.params)
    toast.info('搜索已加载', `已加载 "${search.name}" 的搜索条件`)
  }

  const handleDeleteSearch = (id: string) => {
    const updated = savedSearches.filter(s => s.id !== id)
    setSavedSearches(updated)
    localStorage.setItem('savedSearches', JSON.stringify(updated))
    toast.success('搜索已删除')
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (searchParams.nickname) count++
    if (searchParams.periods?.length) count++
    if (searchParams.feeMin || searchParams.feeMax) count++
    if (searchParams.likesMin || searchParams.likesMax) count++
    if (searchParams.startDate || searchParams.endDate) count++
    if (searchParams.ipLocations?.length) count++
    if (searchParams.cooperationMethod) count++
    return count
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>高级搜索</span>
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary">
                  {getActiveFiltersCount()} 个筛选条件
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              使用多种条件精确筛选达人数据
            </CardDescription>
          </div>
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                {isOpen ? '收起' : '展开'}
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </CardHeader>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* 基础搜索 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">达人昵称</Label>
                <Input
                  id="nickname"
                  placeholder="输入达人昵称"
                  value={searchParams.nickname || ''}
                  onChange={(e) => handleParamChange('nickname', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>期数</Label>
                <Select
                  value={searchParams.periods?.[0] || ''}
                  onValueChange={(value) => handleParamChange('periods', value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择期数" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部期数</SelectItem>
                    {periods.map(period => (
                      <SelectItem key={period} value={period}>{period}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>IP属地</Label>
                <Select
                  value={searchParams.ipLocations?.[0] || ''}
                  onValueChange={(value) => handleParamChange('ipLocations', value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择地区" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部地区</SelectItem>
                    {ipLocations.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* 数值范围筛选 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">数值范围筛选</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>费用范围</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      placeholder="最低费用"
                      value={searchParams.feeMin || ''}
                      onChange={(e) => handleParamChange('feeMin', e.target.value ? Number(e.target.value) : undefined)}
                    />
                    <span className="text-gray-500">-</span>
                    <Input
                      type="number"
                      placeholder="最高费用"
                      value={searchParams.feeMax || ''}
                      onChange={(e) => handleParamChange('feeMax', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>点赞数范围</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      placeholder="最低点赞数"
                      value={searchParams.likesMin || ''}
                      onChange={(e) => handleParamChange('likesMin', e.target.value ? Number(e.target.value) : undefined)}
                    />
                    <span className="text-gray-500">-</span>
                    <Input
                      type="number"
                      placeholder="最高点赞数"
                      value={searchParams.likesMax || ''}
                      onChange={(e) => handleParamChange('likesMax', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 时间范围 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>时间范围</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>开始日期</Label>
                  <Input
                    type="date"
                    value={searchParams.startDate || ''}
                    onChange={(e) => handleParamChange('startDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>结束日期</Label>
                  <Input
                    type="date"
                    value={searchParams.endDate || ''}
                    onChange={(e) => handleParamChange('endDate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* 保存的搜索 */}
            {savedSearches.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">常用搜索</h4>
                <div className="flex flex-wrap gap-2">
                  {savedSearches.map(search => (
                    <div key={search.id} className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadSearch(search)}
                      >
                        {search.name}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSearch(search.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 保存搜索 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">保存当前搜索</h4>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="输入搜索名称"
                  value={saveSearchName}
                  onChange={(e) => setSaveSearchName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSaveSearch} disabled={!saveSearchName.trim()}>
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </Button>
              </div>
            </div>

            <Separator />

            {/* 操作按钮 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4 mr-2" />
                  搜索
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  重置
                </Button>
              </div>
              
              <div className="text-sm text-gray-500">
                {getActiveFiltersCount() > 0 ? `已设置 ${getActiveFiltersCount()} 个筛选条件` : '未设置筛选条件'}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}