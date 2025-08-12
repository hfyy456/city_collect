'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DarenManagement } from '@/components/DarenManagement'
import { PeriodManagement } from '@/components/PeriodManagement'

export default function HomePage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">City Collect</h1>
        <p className="text-muted-foreground">达人管理系统</p>
      </div>
      
      <Tabs defaultValue="darens" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="darens">达人管理</TabsTrigger>
          <TabsTrigger value="periods">期数管理</TabsTrigger>
        </TabsList>
        
        <TabsContent value="darens" className="space-y-6">
          <DarenManagement />
        </TabsContent>
        
        <TabsContent value="periods" className="space-y-6">
          <PeriodManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}