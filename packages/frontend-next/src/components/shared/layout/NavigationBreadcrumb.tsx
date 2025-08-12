'use client'

import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
  active?: boolean
}

interface NavigationBreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function NavigationBreadcrumb({ items, className }: NavigationBreadcrumbProps) {
  return (
    <nav className={cn('flex items-center space-x-2 text-sm', className)} aria-label="Breadcrumb">
      <div className="flex items-center space-x-2">
        <Home className="h-4 w-4 text-gray-400" />
        <span className="text-gray-500">首页</span>
      </div>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span
            className={cn(
              'transition-colors duration-200',
              item.active
                ? 'text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {item.label}
          </span>
        </div>
      ))}
    </nav>
  )
}

export default NavigationBreadcrumb