'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth-store'
import type { Subscription, SubscriptionStatus } from '@/lib/database.types'

interface SubscriptionState {
  subscription: Subscription | null
  isLoading: boolean
  isActive: boolean
  isTrialing: boolean
  status: SubscriptionStatus | null
  error: string | null
}

export function useSubscription() {
  const { organisation } = useAuthStore()
  const [state, setState] = useState<SubscriptionState>({
    subscription: null,
    isLoading: true,
    isActive: false,
    isTrialing: false,
    status: null,
    error: null,
  })

  const fetchSubscription = useCallback(async () => {
    if (!organisation?.id) {
      setState((prev) => ({ ...prev, isLoading: false }))
      return
    }

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('organisation_id', organisation.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw error
      }

      const subscription = data as Subscription | null
      const status = subscription?.status || null
      const isActive = status === 'active' || status === 'trialing'
      const isTrialing = status === 'trialing'

      setState({
        subscription,
        isLoading: false,
        isActive,
        isTrialing,
        status,
        error: null,
      })
    } catch (err) {
      console.error('Error fetching subscription:', err)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load subscription',
      }))
    }
  }, [organisation?.id])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const openCustomerPortal = useCallback(async () => {
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Error opening customer portal:', err)
      throw err
    }
  }, [])

  return {
    ...state,
    refresh: fetchSubscription,
    openCustomerPortal,
  }
}

export function isSubscriptionActive(status: SubscriptionStatus | string | null): boolean {
  return status === 'active' || status === 'trialing'
}
