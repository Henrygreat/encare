'use client'

import { useEffect, type ReactNode } from 'react'
import { useSync } from '@/lib/hooks/use-sync'
import { useAuthStore } from '@/lib/stores/auth-store'

interface SyncProviderProps {
  children: ReactNode
}

export function SyncProvider({ children }: SyncProviderProps) {
  const { isAuthenticated } = useAuthStore()
  const { syncQueuedLogs, isOnline, queueLength } = useSync()

  // Attempt sync on mount if there are queued items
  useEffect(() => {
    if (isAuthenticated && isOnline && queueLength > 0) {
      syncQueuedLogs()
    }
  }, [isAuthenticated, isOnline, queueLength, syncQueuedLogs])

  return <>{children}</>
}
