'use client'

import { useState, useEffect } from 'react'
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
  Search, 
  RotateCcw,
  Save,
  Trash2
} from 'lucide-react'
import { type SearchParams } from '@/lib/api'
import { useToast } from '@/components/shared/feedback/NotificationSystem'

interface AdvancedSearchPanelProps {
  onSearch: (params: SearchParams) => void
  initialParams?: SearchParams
  periods: string[]
  ipLocations: string[]
}

interface SavedSearch {
  id: string
  name: string
  params: SearchParams
  createdAt: string
}

export function AdvancedSearchPanel({ 
  onSearch, 
  initialParams = {}, 
  periods, 
  ipLocations 
}: AdvancedSearchPanelProps) {
  const toast = useToast()
  const [searchParams, setSearchParams] = useState<SearchParams>(initialParams)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [saveSearchName, setSaveSearchName] = useState('')

  useEffect(() => {
    loadSavedSearches()
  }, [])

  useEffect(() => {
    setSearchParams(initialParams)
  }, [initialParams])

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
      [key]: value
    }))
  }

  const handleSearch = () => {
    onSearch(searchParams)
  }

  const handleReset = () => {
    setSearchParams({})
    onSearch({})
  }

  const handleSaveSearch = () => {
    if (!saveSearchName.trim()) {
      toast.error('请输入搜索方案名称')
      return
    }

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: saveSearchName,
      params: searchParams,
      createdAt: new Date().toISOString()
    }

    const updatedSearches = [...savedSearches, newSearch]
    setSavedSearches(updatedSearches)
    localStorage.setItem('savedSearches', JSON.stringify(updatedSearches))
    setSaveSearchName('')
    toast.success('搜索方案保存成功')
  }

  const handleLoadSearch = (search: SavedSearch) => {
    setSearchParams(search.params)
    toast.success(`已加载搜索方案: ${search.name}`)
  }

  const handleDeleteSearch = (searchId: string) => {
    const updatedSearches = savedSearches.filter(s => s.id !== searchId)
    setSavedSearches(updatedSearches)
    localStorage.setItem('savedSearches', JSON.stringify(updatedSearches))
    toast.success('搜索方案删除成功')
  }

  const getActiveFiltersCount = () => {
    return Object.values(searchParams).filter(value => {
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return value !== undefined && value !== null && value !== ''
    }).length
  }

  return (
    <div className="space-y-6">
      {/* 保存的搜索方案 */}
      {savedSearches.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">保存的搜索方案</Label>
          <div className="flex flex-wrap gap-2">
            {savedSearches.map(search => (
              <div key={search.id} className="flex items-center gap-1 bg-gray-100 rounded-lg px-3 py-1">
                <button
                  onClick={() => handleLoadSearch(search)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {search.name}
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSearch(search.id)}
                  className="h-auto p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

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
            <Label>粉丝数范围</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="最少粉丝数"
                value={searchParams.fansMin || ''}
                onChange={(e) => handleParamChange('fansMin', e.target.value ? Number(e.target.value) : undefined)}
              />
              <span className="text-gray-500">-</span>
              <Input
                type="number"
                placeholder="最多粉丝数"
                value={searchParams.fansMax || ''}
                onChange={(e) => handleParamChange('fansMax', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>点赞数范围</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="最少点赞数"
                value={searchParams.likesMin || ''}
                onChange={(e) => handleParamChange('likesMin', e.target.value ? Number(e.target.value) : undefined)}
              />
              <span className="text-gray-500">-</span>
              <Input
                type="number"
                placeholder="最多点赞数"
                value={searchParams.likesMax || ''}
                onChange={(e) => handleParamChange('likesMax', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>评论数范围</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="最少评论数"
                value={searchParams.commentsMin || ''}
                onChange={(e) => handleParamChange('commentsMin', e.target.value ? Number(e.target.value) : undefined)}
              />
              <span className="text-gray-500">-</span>
              <Input
                type="number"
                placeholder="最多评论数"
                value={searchParams.commentsMax || ''}
                onChange={(e) => handleParamChange('commentsMax', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* 保存搜索方案 */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">保存当前搜索方案</Label>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="输入搜索方案名称"
            value={saveSearchName}
            onChange={(e) => setSaveSearchName(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSaveSearch} variant="outline">
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
    </div>
  )
}

export default AdvancedSearchPanel