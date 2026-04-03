'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth-store'
import type { Resident, DailyLog } from '@/lib/database.types'

export type ResidentWithStatus = Resident & {
  statuses?: Array<{ type: 'med_due' | 'incident' | 'no_meal' | 'overdue_task' | 'alert'; label: string }>
  isAssigned?: boolean
}

export function useResidents() {
  const [residents, setResidents] = useState<ResidentWithStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()

  const fetchResidents = useCallback(async () => {
    if (!user?.organisation_id) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Fetch residents for the organisation
      const { data: residentsData, error: residentsError } = await supabase
        .from('residents')
        .select('*')
        .eq('organisation_id', user.organisation_id)
        .eq('status', 'active')
        .order('first_name')

      if (residentsError) throw residentsError

      // Fetch today's assignments for current user
      const today = new Date().toISOString().split('T')[0]
      const { data: assignments } = await supabase
        .from('staff_assignments')
        .select('resident_id')
        .eq('user_id', user.id)
        .eq('shift_date', today)

      const assignedIds = new Set(assignments?.map((a: any) => a.resident_id) || [])

      // Fetch today's logs to determine statuses
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const { data: todayLogs } = await supabase
        .from('daily_logs')
        .select('resident_id, log_type')
        .eq('organisation_id', user.organisation_id)
        .gte('logged_at', startOfDay.toISOString())

      // Group logs by resident
      const logsByResident = new Map<string, Set<string>>()
      todayLogs?.forEach((log: any) => {
        if (!logsByResident.has(log.resident_id)) {
          logsByResident.set(log.resident_id, new Set())
        }
        logsByResident.get(log.resident_id)!.add(log.log_type)
      })

      // Fetch overdue tasks
      const { data: overdueTasks } = await supabase
        .from('tasks')
        .select('resident_id')
        .eq('organisation_id', user.organisation_id)
        .eq('status', 'pending')
        .lt('due_at', new Date().toISOString())

      const residentsWithOverdueTasks = new Set(overdueTasks?.map((t: any) => t.resident_id).filter(Boolean) || [])

      // Build resident list with statuses
      const enrichedResidents: ResidentWithStatus[] = (residentsData || []).map((resident: any) => {
        const statuses: ResidentWithStatus['statuses'] = []
        const residentLogs = logsByResident.get(resident.id)

        // Check for missing meal log
        if (!residentLogs?.has('meal')) {
          const hour = new Date().getHours()
          if (hour >= 9) { // After breakfast time
            statuses.push({ type: 'no_meal', label: 'No meal' })
          }
        }

        // Check for overdue tasks
        if (residentsWithOverdueTasks.has(resident.id)) {
          statuses.push({ type: 'overdue_task', label: 'Overdue' })
        }

        return {
          ...resident,
          isAssigned: assignedIds.has(resident.id),
          statuses: statuses.length > 0 ? statuses : undefined,
        }
      })

      setResidents(enrichedResidents)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch residents'))
    } finally {
      setIsLoading(false)
    }
  }, [user?.organisation_id, user?.id])

  useEffect(() => {
    fetchResidents()
  }, [fetchResidents])

  return { residents, isLoading, error, refetch: fetchResidents }
}

export function useResident(id: string) {
  const [resident, setResident] = useState<Resident | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchResident() {
      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from('residents')
          .select('*')
          .eq('id', id)
          .single()

        if (fetchError) throw fetchError
        setResident(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch resident'))
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchResident()
    }
  }, [id])

  return { resident, isLoading, error }
}
