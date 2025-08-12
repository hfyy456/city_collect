import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ErrorBoundary, { PageErrorFallback } from '@/components/ErrorBoundary'
import { NotificationProvider, NotificationInitializer } from '@/components/NotificationSystem'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'City Collect - 达人管理系统',
  description: '专业的达人管理和数据分析平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <ErrorBoundary fallback={PageErrorFallback}>
          <NotificationProvider>
            <NotificationInitializer />
            {children}
          </NotificationProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}