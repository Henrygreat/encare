'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth-store'
import type { HandoverNote } from '@/lib/database.types'

export type HandoverWithSummary = HandoverNote & {
  created_by_name?: string
  read_by_list?: Array<{ user_id: string; name: string; read_at: string }>
}

function getTodayDateString() {
  return new Date().toISOString().split('T')[0]
}

function getDefaultShiftType() {
  const hour = new Date().getHours()

  if (hour < 12) return 'morning'
  if (hour < 18) return 'day'
  return 'night'
}

function buildDefaultAutoSummary() {
  return {
    total_logs: 0,
    residents_logged: 0,
    tasks_completed: 0,
    tasks_pending: 0,
    incidents: 0,
  }
}

async function enrichHandover(
  supabase: ReturnType<typeof createClient>,
  handoverData: any
): Promise<HandoverWithSummary> {
  const readByData = (handoverData.read_by as any[] | null) || []
  let readByList: Array<{ user_id: string; name: string; read_at: string }> = []

  if (readByData.length > 0) {
    const { data: userData } = await supabase
      .from('users')
      .select('id, full_name')
      .in(
        'id',
        readByData.map((r: any) => r.user_id || r)
      )

    readByList = (userData || []).map((u: any) => ({
      user_id: u.id,
      name: u.full_name,
      read_at:
        readByData.find((r: any) => (r.user_id || r) === u.id)?.read_at ||
        new Date().toISOString(),
    }))
  }

  const createdByUser = Array.isArray(handoverData.users)
    ? handoverData.users[0]
    : handoverData.users

  return {
    ...handoverData,
    created_by_name: createdByUser?.full_name,
    read_by_list: readByList,
  }
}

export function useTodayHandover() {
  const [handover, setHandover] = useState<HandoverWithSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()

  useEffect(() => {
    async function fetchOrCreateHandover() {
      if (!user?.organisation_id || !user?.id) {
        setHandover(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        const today = getTodayDateString()

        const { data: existingHandover, error: handoverError } = await supabase
          .from('handover_notes')
          .select(`
            *,
            users!created_by (full_name)
          `)
          .eq('organisation_id', user.organisation_id)
          .eq('shift_date', today)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (handoverError) throw handoverError

        if (existingHandover) {
          const enriched = await enrichHandover(supabase, existingHandover)
          setHandover(enriched)
          return
        }

        const newHandoverPayload = {
          organisation_id: user.organisation_id,
          shift_date: today,
          shift_type: getDefaultShiftType(),
          auto_summary: buildDefaultAutoSummary(),
          priority_items: [],
          manual_notes: '',
          read_by: [],
          created_by: user.id,
        }

        const { data: createdHandover, error: createError } = await supabase
          .from('handover_notes')
          .insert(newHandoverPayload)
          .select(`
            *,
            users!created_by (full_name)
          `)
          .single()

        if (createError) throw createError

        const enriched = await enrichHandover(supabase, createdHandover)
        setHandover(enriched)
      } catch (err) {
        console.error('Failed to fetch or create handover:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch handover'))
        setHandover(null)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchOrCreateHandover()
  }, [user?.organisation_id, user?.id])

  return { handover, isLoading, error }
}

export function usePreviousHandovers() {
  const [handovers, setHandovers] = useState<HandoverWithSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()

  useEffect(() => {
    async function fetchHandovers() {
      if (!user?.organisation_id) {
        setHandovers([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        const today = getTodayDateString()

        const { data: handoverData, error: handoverError } = await supabase
          .from('handover_notes')
          .select(`
            *,
            users!created_by (full_name)
          `)
          .eq('organisation_id', user.organisation_id)
          .lt('shift_date', today)
          .order('shift_date', { ascending: false })
          .limit(10)

        if (handoverError) throw handoverError

        const enriched = (handoverData || []).map((h: any) => {
          const createdByUser = Array.isArray(h.users) ? h.users[0] : h.users
          return {
            ...h,
            created_by_name: createdByUser?.full_name,
          }
        })

        setHandovers(enriched)
      } catch (err) {
        console.error('Failed to fetch previous handovers:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch handovers'))
      } finally {
        setIsLoading(false)
      }
    }

    void fetchHandovers()
  }, [user?.organisation_id])

  return { handovers, isLoading, error }
}

export function useHandoverActions() {
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuthStore()

  const updateManualNotes = useCallback(
    async (
      handoverId: string,
      notes: string
    ): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true)

      try {
        const supabase = createClient()

        const { error } = await supabase
          .from('handover_notes')
          .update({
            manual_notes: notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', handoverId)

        if (error) throw error

        return { success: true }
      } catch (err) {
        console.error('Failed to update handover notes:', err)
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to update notes',
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const markAsRead = useCallback(
    async (handoverId: string): Promise<{ success: boolean; error?: string }> => {
      if (!user?.id) {
        return { success: false, error: 'Not authenticated' }
      }

      setIsLoading(true)

      try {
        const supabase = createClient()

        const { data: handover, error: fetchError } = await supabase
          .from('handover_notes')
          .select('read_by')
          .eq('id', handoverId)
          .single()

        if (fetchError) throw fetchError

        const readBy = (handover?.read_by as any[] | null) || []

        const alreadyRead = readBy.some((r: any) => (r.user_id || r) === user.id)

        if (!alreadyRead) {
          readBy.push({
            user_id: user.id,
            read_at: new Date().toISOString(),
          })
        }

        const { error: updateError } = await supabase
          .from('handover_notes')
          .update({
            read_by: readBy,
            updated_at: new Date().toISOString(),
          })
          .eq('id', handoverId)

        if (updateError) throw updateError

        return { success: true }
      } catch (err) {
        console.error('Failed to mark handover as read:', err)
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to mark as read',
        }
      } finally {
        setIsLoading(false)
      }
    },
    [user?.id]
  )

  return { updateManualNotes, markAsRead, isLoading }
}