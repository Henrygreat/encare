'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth-store'
import type { CarePlan } from '@/lib/database.types'

export type CarePlanWithResident = CarePlan & {
  resident_name?: string
  has_viewed?: boolean
}

export function useCarePlan(residentId: string) {
  const [carePlan, setCarePlan] = useState<CarePlanWithResident | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()

  useEffect(() => {
    async function fetchCarePlan() {
      if (!residentId) return

      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        // Fetch care plan with resident info
        const { data: carePlanData, error: carePlanError } = await supabase
          .from('care_plans')
          .select(`
            *,
            residents (
              first_name,
              last_name,
              preferred_name
            )
          `)
          .eq('resident_id', residentId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (carePlanError) {
          if (carePlanError.code === 'PGRST116') {
            // No care plan found - not an error
            setCarePlan(null)
          } else {
            throw carePlanError
          }
          return
        }

        // Check if current user has viewed this care plan
        let hasViewed = false
        if (user?.id && carePlanData) {
          const { data: viewData } = await supabase
            .from('care_plan_views')
            .select('id')
            .eq('care_plan_id', carePlanData.id)
            .eq('user_id', user.id)
            .limit(1)

          hasViewed = (viewData && viewData.length > 0) || false
        }

        const resident = Array.isArray(carePlanData.residents)
          ? carePlanData.residents[0]
          : carePlanData.residents

        const residentName = resident
          ? `${resident.preferred_name || resident.first_name} ${resident.last_name}`
          : undefined

        setCarePlan({
          ...carePlanData,
          resident_name: residentName,
          has_viewed: hasViewed,
        })
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch care plan'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchCarePlan()
  }, [residentId, user?.id])

  return { carePlan, isLoading, error }
}

export function useMarkCarePlanViewed() {
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuthStore()

  const markAsViewed = useCallback(async (carePlanId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Check if already viewed
      const { data: existing } = await supabase
        .from('care_plan_views')
        .select('id')
        .eq('care_plan_id', carePlanId)
        .eq('user_id', user.id)
        .limit(1)

      if (existing && existing.length > 0) {
        // Already viewed, just return success
        return { success: true }
      }

      // Insert view record
      const { error } = await supabase
        .from('care_plan_views')
        .insert({
          care_plan_id: carePlanId,
          user_id: user.id,
          viewed_at: new Date().toISOString(),
        })

      if (error) throw error

      return { success: true }
    } catch (err) {
      console.error('Failed to mark care plan as viewed:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to record view',
      }
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  return { markAsViewed, isLoading }
}
