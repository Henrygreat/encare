'use client'

import { useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOfflineStore } from '@/lib/stores/offline-store'
import { useAuthStore } from '@/lib/stores/auth-store'

export function useSync() {
  const {
    isOnline,
    queuedLogs,
    syncInProgress,
    lastSyncAt,
    removeFromQueue,
    setSyncInProgress,
    setLastSyncAt,
  } = useOfflineStore()

  const { user } = useAuthStore()
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const syncQueuedLogs = useCallback(async () => {
    if (!isOnline || syncInProgress || queuedLogs.length === 0 || !user) {
      return { synced: 0, failed: 0 }
    }

    setSyncInProgress(true)

    let synced = 0
    let failed = 0

    const supabase = createClient()

    // Sort by queued_at to process in order
    const sortedLogs = [...queuedLogs].sort((a, b) => a.queued_at - b.queued_at)

    for (const log of sortedLogs) {
      try {
        // Remove the queued_at field before inserting
        const { offline_id, queued_at, ...logData } = log as any

        const { error } = await supabase
          .from('daily_logs')
          .insert({
            ...logData,
            offline_id,
            sync_status: 'synced',
          })

        if (error) {
          // Check if it's a duplicate (already synced)
          if (error.code === '23505') {
            // Unique constraint violation - already exists
            removeFromQueue(log.offline_id!)
            synced++
          } else {
            console.error('Failed to sync log:', error)
            failed++
          }
        } else {
          removeFromQueue(log.offline_id!)
          synced++
        }
      } catch (err) {
        console.error('Sync error:', err)
        failed++
      }
    }

    setLastSyncAt(Date.now())
    setSyncInProgress(false)

    return { synced, failed }
  }, [isOnline, syncInProgress, queuedLogs, user, removeFromQueue, setSyncInProgress, setLastSyncAt])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && queuedLogs.length > 0 && !syncInProgress) {
      // Small delay to ensure connection is stable
      syncTimeoutRef.current = setTimeout(() => {
        syncQueuedLogs()
      }, 2000)
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [isOnline, queuedLogs.length, syncInProgress, syncQueuedLogs])

  return {
    syncQueuedLogs,
    isOnline,
    queueLength: queuedLogs.length,
    syncInProgress,
    lastSyncAt,
  }
}

// Hook to track sync status and show notifications
export function useSyncStatus() {
  const { isOnline, queuedLogs, syncInProgress, lastSyncAt } = useOfflineStore()

  const getStatusMessage = useCallback(() => {
    if (!isOnline) {
      return {
        status: 'offline' as const,
        message: 'You\'re offline',
        detail: queuedLogs.length > 0
          ? `${queuedLogs.length} item${queuedLogs.length > 1 ? 's' : ''} waiting to sync`
          : undefined,
      }
    }

    if (syncInProgress) {
      return {
        status: 'syncing' as const,
        message: 'Syncing...',
        detail: `${queuedLogs.length} item${queuedLogs.length > 1 ? 's' : ''} remaining`,
      }
    }

    if (queuedLogs.length > 0) {
      return {
        status: 'pending' as const,
        message: 'Sync pending',
        detail: `${queuedLogs.length} item${queuedLogs.length > 1 ? 's' : ''} to sync`,
      }
    }

    return {
      status: 'synced' as const,
      message: 'All synced',
      detail: lastSyncAt
        ? `Last sync: ${new Date(lastSyncAt).toLocaleTimeString()}`
        : undefined,
    }
  }, [isOnline, queuedLogs.length, syncInProgress, lastSyncAt])

  return {
    isOnline,
    queueLength: queuedLogs.length,
    syncInProgress,
    lastSyncAt,
    ...getStatusMessage(),
  }
}
