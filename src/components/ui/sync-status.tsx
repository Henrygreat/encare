'use client'

import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react'
import { useOfflineStore } from '@/lib/stores/offline-store'
import { cn } from '@/lib/utils'

export function SyncStatus() {
  const { isOnline, queuedLogs, syncInProgress } = useOfflineStore()

  const pendingCount = queuedLogs.length

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
        <CloudOff className="h-4 w-4" />
        <span>Offline</span>
        {pendingCount > 0 && (
          <span className="bg-amber-200 px-1.5 rounded-full text-xs">
            {pendingCount}
          </span>
        )}
      </div>
    )
  }

  if (syncInProgress) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Syncing</span>
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
        <AlertCircle className="h-4 w-4" />
        <span>{pendingCount} pending</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
      <Cloud className="h-4 w-4" />
      <span>Synced</span>
    </div>
  )
}

// Minimal indicator for header
export function SyncIndicator({ className }: { className?: string }) {
  const { isOnline, queuedLogs, syncInProgress } = useOfflineStore()

  return (
    <div
      className={cn(
        'h-2.5 w-2.5 rounded-full',
        !isOnline && 'bg-amber-500',
        isOnline && syncInProgress && 'bg-blue-500 animate-pulse',
        isOnline && !syncInProgress && queuedLogs.length > 0 && 'bg-amber-500',
        isOnline && !syncInProgress && queuedLogs.length === 0 && 'bg-green-500',
        className
      )}
      title={
        !isOnline
          ? 'Offline'
          : syncInProgress
          ? 'Syncing...'
          : queuedLogs.length > 0
          ? `${queuedLogs.length} pending`
          : 'Synced'
      }
    />
  )
}
