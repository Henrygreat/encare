'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useOfflineStore } from '@/lib/stores/offline-store'
import { generateOfflineId } from '@/lib/utils'
import type { DailyLog, DailyLogInsert, LogType, TimelineEvent } from '@/lib/database.types'

export type TimelineEventWithUser = TimelineEvent & {
  user_name?: string
}

export function useResidentTimeline(residentId: string, limit = 20) {
  const [events, setEvents] = useState<TimelineEventWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTimeline = useCallback(async () => {
    if (!residentId) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data: logs, error: logsError } = await supabase
        .from('daily_logs')
        .select(`
          id,
          resident_id,
          log_type,
          log_data,
          notes,
          logged_by,
          logged_at,
          created_at,
          users:logged_by (full_name)
        `)
        .eq('resident_id', residentId)
        .order('logged_at', { ascending: false })
        .limit(limit)

      if (logsError) throw logsError

      const events: TimelineEventWithUser[] = (logs || []).map((log: any) => ({
        id: log.id,
        resident_id: log.resident_id,
        event_type: 'log',
        sub_type: log.log_type,
        data: log.log_data,
        notes: log.notes,
        user_id: log.logged_by,
        occurred_at: log.logged_at,
        created_at: log.created_at,
        user_name: log.users?.full_name || 'Unknown',
      }))

      setEvents(events)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch timeline'))
    } finally {
      setIsLoading(false)
    }
  }, [residentId, limit])

  useEffect(() => {
    fetchTimeline()
  }, [fetchTimeline])

  return { events, isLoading, error, refetch: fetchTimeline }
}

export function useCreateLog() {
  const { user, organisation, isLoading: authLoading } = useAuth()
  const { isOnline, addToQueue } = useOfflineStore()
  const [isLoading, setIsLoading] = useState(false)

  const createLog = useCallback(
    async (data: {
      residentId: string
      logType: LogType
      logData: Record<string, any>
      notes?: string
      taskId?: string
    }) => {
      if (authLoading) {
        return { success: false, error: 'Still loading your account. Please try again.' }
      }

      if (!user?.id || !organisation?.id) {
        return { success: false, error: 'Not authenticated' }
      }

      setIsLoading(true)

      const logEntry: DailyLogInsert = {
        organisation_id: organisation.id,
        resident_id: data.residentId,
        logged_by: user.id,
        log_type: data.logType,
        log_data: data.logData,
        notes: data.notes || null,
        logged_at: new Date().toISOString(),
        task_id: data.taskId || null,
        sync_status: isOnline ? 'synced' : 'pending',
        offline_id: generateOfflineId(),
      }

      try {
        if (isOnline) {
          const supabase = createClient()
          const { error } = await supabase.from('daily_logs').insert(logEntry)

          if (error) throw error
        } else {
          addToQueue({
            ...logEntry,
            id: logEntry.offline_id!,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            queued_at: Date.now(),
          } as any)
        }

        return { success: true, isOffline: !isOnline }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to create log',
        }
      } finally {
        setIsLoading(false)
      }
    },
    [authLoading, user?.id, organisation?.id, isOnline, addToQueue],
  )

  return { createLog, isLoading, authLoading }
}

export function useTodayLogs(residentId?: string) {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, organisation, isLoading: authLoading } = useAuth()

  useEffect(() => {
    async function fetchLogs() {
      if (authLoading) return

      const organisationId = organisation?.id || user?.organisation_id
      if (!organisationId) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const supabase = createClient()
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        let query = supabase
          .from('daily_logs')
          .select('*')
          .eq('organisation_id', organisationId)
          .gte('logged_at', startOfDay.toISOString())
          .order('logged_at', { ascending: false })

        if (residentId) {
          query = query.eq('resident_id', residentId)
        }

        const { data, error } = await query

        if (error) throw error
        setLogs(data || [])
      } catch (err) {
        console.error('Failed to fetch today logs:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogs()
  }, [authLoading, organisation?.id, user?.organisation_id, residentId])

  return { logs, isLoading }
}