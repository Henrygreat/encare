'use client'

import { ChevronLeft, MoreVertical } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SyncIndicator } from '@/components/ui/sync-status'
import { cn } from '@/lib/utils'

interface MobileHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  backHref?: string
  rightAction?: React.ReactNode
  className?: string
}

export function MobileHeader({
  title,
  subtitle,
  showBack = false,
  backHref,
  rightAction,
  className,
}: MobileHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 bg-white border-b border-surface-200 safe-area-inset-top',
        className
      )}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showBack && (
            <button
              onClick={handleBack}
              className="flex items-center justify-center h-10 w-10 -ml-2 rounded-full hover:bg-surface-100 transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-500 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SyncIndicator />
          {rightAction}
        </div>
      </div>
    </header>
  )
}

interface PageContainerProps {
  children: React.ReactNode
  header?: React.ReactNode
  className?: string
  noPadding?: boolean
}

export function PageContainer({
  children,
  header,
  className,
  noPadding = false,
}: PageContainerProps) {
  return (
    <div className="min-h-screen bg-surface-50 pb-20">
      {header}
      <main className={cn(!noPadding && 'p-4', className)}>
        {children}
      </main>
    </div>
  )
}
