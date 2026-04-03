'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth-store'
import type { User } from '@/lib/database.types'

export function useAuth() {
  const router = useRouter()
  const { user, organisation, isLoading, isAuthenticated, setUser, setOrganisation, setIsLoading, clear } = useAuthStore()

  // Initialize auth state from Supabase session
  const initializeAuth = useCallback(async () => {
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        clear()
        setIsLoading(false)
        return
      }

      // Fetch user profile from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (userError || !userData) {
        console.error('Failed to fetch user profile:', userError)
        clear()
        setIsLoading(false)
        return
      }

      setUser(userData)

      // Fetch organisation
      const { data: orgData } = await supabase
        .from('organisations')
        .select('*')
        .eq('id', userData.organisation_id)
        .single()

      if (orgData) {
        setOrganisation(orgData)
      }
    } catch (err) {
      console.error('Auth initialization error:', err)
      clear()
    } finally {
      setIsLoading(false)
    }
  }, [setUser, setOrganisation, setIsLoading, clear])

  // Listen for auth state changes
  useEffect(() => {
    const supabase = createClient()

    // Initialize on mount
    initializeAuth()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === 'SIGNED_OUT') {
        clear()
        router.push('/login')
      } else if (event === 'SIGNED_IN' && session?.user) {
        await initializeAuth()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [initializeAuth, clear, router])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clear()
    router.push('/login')
  }, [clear, router])

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return { success: false, error: error.message }
    }

    await initializeAuth()
    return { success: true }
  }, [initializeAuth])

  return {
    user,
    organisation,
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
    refreshAuth: initializeAuth,
  }
}

// Hook for protected routes
export function useRequireAuth(redirectTo = '/login') {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  return { isAuthenticated, isLoading }
}

// Hook for manager/admin only routes
export function useRequireManager(redirectTo = '/app') {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && user) {
      const isManager = user.role === 'admin' || user.role === 'manager'
      if (!isManager) {
        router.push(redirectTo)
      }
    }
  }, [user, isLoading, router, redirectTo])

  return {
    isManager: user?.role === 'admin' || user?.role === 'manager',
    isLoading
  }
}
