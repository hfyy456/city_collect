'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter, X } from 'lucide-react'
import { type SearchParams } from '@/lib/api'

interface SearchAndFilterProps {
  searchTerm: string
  onSearchTermChange: (value: string) => void
  searchParams: SearchParams
  onSearchParamsChange: (params: SearchParams) => void
  periods: string[]
  ipLocations: string[]
  onSearch: () => void
  onClearFilters: () => void
}

export function SearchAndFilter({
  searchTerm,
  onSearchTermChange,
  searchParams,
  onSearchParamsChange,
  periods,
  ipLocations,
  onSearch,
  onClearFilters
}: SearchAndFilterProps) {
  const [showFilters, setShowFilters] = useState(false)

  const hasActiveFilters = Object.values(searchParams).some(value => 
    value !== undefined && value !== '' && value !== null
  )

  const getActiveFiltersCount = () => {
    return Object.values(searchParams).filter(value => 
      value !== undefined && value !== '' && value !== null
    ).length
  }

  const handleClearFilters = () => {
    onClearFilters()
    setShowFilters(false)
  }

  return (
    <div className="space-y-4">
      {/* 主搜索栏 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="搜索达人昵称..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10"
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>
        <Button onClick={onSearch} className="px-6">
          搜索
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          筛选
          {hasActiveFilters && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>

      </div>

      {/* 快速筛选器 */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">期数</label>
              <Select
                value={searchParams.period || ''}
                onValueChange={(value) => 
                  onSearchParamsChange({ ...searchParams, period: value || undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择期数" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部期数</SelectItem>
                  {periods.map((period) => (
                    <SelectItem key={period} value={period}>
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">IP归属地</label>
              <Select
                value={searchParams.ipLocation || ''}
                onValueChange={(value) => 
                  onSearchParamsChange({ ...searchParams, ipLocation: value || undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择地区" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部地区</SelectItem>
                  {ipLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">粉丝数范围</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="最小值"
                  value={searchParams.minFollowers || ''}
                  onChange={(e) => 
                    onSearchParamsChange({ 
                      ...searchParams, 
                      minFollowers: e.target.value ? Number(e.target.value) : undefined 
                    })
                  }
                />
                <span className="flex items-center text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="最大值"
                  value={searchParams.maxFollowers || ''}
                  onChange={(e) => 
                    onSearchParamsChange({ 
                      ...searchParams, 
                      maxFollowers: e.target.value ? Number(e.target.value) : undefined 
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">费用范围</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="最小值"
                  value={searchParams.minFee || ''}
                  onChange={(e) => 
                    onSearchParamsChange({ 
                      ...searchParams, 
                      minFee: e.target.value ? Number(e.target.value) : undefined 
                    })
                  }
                />
                <span className="flex items-center text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="最大值"
                  value={searchParams.maxFee || ''}
                  onChange={(e) => 
                    onSearchParamsChange({ 
                      ...searchParams, 
                      maxFee: e.target.value ? Number(e.target.value) : undefined 
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={onSearch} size="sm">
              应用筛选
            </Button>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearFilters}
              >
                <X className="h-4 w-4 mr-1" />
                清除筛选
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 活跃筛选器标签 */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">当前筛选:</span>
          {searchParams.period && (
            <Badge variant="secondary" className="flex items-center gap-1">
              期数: {searchParams.period}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onSearchParamsChange({ ...searchParams, period: undefined })}
              />
            </Badge>
          )}
          {searchParams.ipLocation && (
            <Badge variant="secondary" className="flex items-center gap-1">
              地区: {searchParams.ipLocation}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onSearchParamsChange({ ...searchParams, ipLocation: undefined })}
              />
            </Badge>
          )}

          {(searchParams.minFollowers || searchParams.maxFollowers) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              粉丝: {searchParams.minFollowers || 0} - {searchParams.maxFollowers || '∞'}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onSearchParamsChange({ 
                  ...searchParams, 
                  minFollowers: undefined, 
                  maxFollowers: undefined 
                })}
              />
            </Badge>
          )}
          {(searchParams.minFee || searchParams.maxFee) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              费用: {searchParams.minFee || 0} - {searchParams.maxFee || '∞'}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onSearchParamsChange({ 
                  ...searchParams, 
                  minFee: undefined, 
                  maxFee: undefined 
                })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}