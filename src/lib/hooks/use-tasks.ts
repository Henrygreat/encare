'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth-store'
import type { Task, TaskStatus } from '@/lib/database.types'

export type TaskWithResident = Task & {
  resident_name?: string
  resident_room?: string
}

export function useTasks(options?: { status?: TaskStatus; residentId?: string; assignedToMe?: boolean }) {
  const [tasks, setTasks] = useState<TaskWithResident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()

  const fetchTasks = useCallback(async () => {
    if (!user?.organisation_id) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      let query = supabase
        .from('tasks')
        .select(`
          *,
          residents:resident_id (first_name, last_name, preferred_name, room_number)
        `)
        .eq('organisation_id', user.organisation_id)

      if (options?.status) {
        query = query.eq('status', options.status)
      }

      if (options?.residentId) {
        query = query.eq('resident_id', options.residentId)
      }

      if (options?.assignedToMe) {
        query = query.eq('assigned_to', user.id)
      }

      // Get tasks due today or earlier for pending tasks
      const today = new Date()
      today.setHours(23, 59, 59, 999)

      if (!options?.status || options.status === 'pending') {
        query = query.lte('due_at', today.toISOString())
      }

      query = query.order('due_at', { ascending: true })

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const enrichedTasks: TaskWithResident[] = (data || []).map((task: any) => ({
        ...task,
        resident_name: task.residents
          ? `${task.residents.preferred_name || task.residents.first_name} ${task.residents.last_name}`
          : undefined,
        resident_room: task.residents?.room_number,
        residents: undefined, // Remove the nested object
      }))

      setTasks(enrichedTasks)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tasks'))
    } finally {
      setIsLoading(false)
    }
  }, [user?.organisation_id, user?.id, options?.status, options?.residentId, options?.assignedToMe])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return { tasks, isLoading, error, refetch: fetchTasks }
}

export function useTaskActions() {
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const completeTask = useCallback(async (taskId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user.id,
        })
        .eq('id', taskId)

      if (error) throw error
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to complete task' }
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const snoozeTask = useCallback(async (taskId: string, snoozeUntil: Date, reason?: string) => {
    if (!user) return { success: false, error: 'Not authenticated' }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'snoozed',
          snoozed_until: snoozeUntil.toISOString(),
          snooze_reason: reason || null,
        })
        .eq('id', taskId)

      if (error) throw error
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to snooze task' }
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const escalateTask = useCallback(async (taskId: string, escalateTo?: string) => {
    if (!user) return { success: false, error: 'Not authenticated' }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'escalated',
          escalated_at: new Date().toISOString(),
          escalated_to: escalateTo || null,
        })
        .eq('id', taskId)

      if (error) throw error
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to escalate task' }
    } finally {
      setIsLoading(false)
    }
  }, [user])

  return { completeTask, snoozeTask, escalateTask, isLoading }
}
