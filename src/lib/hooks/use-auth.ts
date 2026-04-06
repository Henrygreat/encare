'use client'

import { useEffect, useCallback, useRef } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth-store'
import type { User, Organisation } from '@/lib/database.types'

export function useAuth() {
  const router = useRouter()
  const isInitializingRef = useRef(false)

  const {
    user,
    organisation,
    isLoading,
    isAuthenticated,
    setUser,
    setOrganisation,
    setIsLoading,
    clear,
  } = useAuthStore()

  const initializeAuth = useCallback(async () => {
    if (isInitializingRef.current) return
    isInitializingRef.current = true
    setIsLoading(true)

    try {
      const supabase = createClient()
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Session error:', sessionError)
        clear()
        return
      }

      if (!session?.user) {
        clear()
        return
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (userError) {
        console.error('User profile lookup failed:', userError.message)
        clear()
        return
      }

      if (!userData) {
        console.error('No user profile found for authenticated session')
        clear()
        return
      }

      setUser(userData as User)

      const { data: orgData, error: orgError } = await supabase
        .from('organisations')
        .select('*')
        .eq('id', userData.organisation_id)
        .maybeSingle()

      if (orgError) {
        console.error('Organisation lookup failed:', orgError.message)
        clear()
        return
      }

      if (!orgData) {
        console.error('No organisation found for user')
        clear()
        return
      }

      setOrganisation(orgData as Organisation)
    } catch (err) {
      console.error('Auth initialization error:', err)
      clear()
    } finally {
      setIsLoading(false)
      isInitializingRef.current = false
    }
  }, [setUser, setOrganisation, setIsLoading, clear])

  useEffect(() => {
    const supabase = createClient()

    void initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_OUT') {
        clear()
        router.replace('/login')
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          void initializeAuth()
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [initializeAuth, clear, router])

  const signOut = useCallback(async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Sign out error:', err)
    } finally {
      clear()
      router.replace('/login')
    }
  }, [clear, router])

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
          return { success: false, error: error.message }
        }

        await initializeAuth()
        return { success: true }
      } catch (err) {
        console.error('Sign in error:', err)
        return { success: false, error: 'Unable to sign in right now.' }
      }
    },
    [initializeAuth]
  )

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

export function useRequireAuth(redirectTo = '/login') {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  return { isAuthenticated, isLoading }
}

export function useRequireManager(redirectTo = '/app') {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && user) {
      const isManager = user.role === 'admin' || user.role === 'manager'
      if (!isManager) {
        router.replace(redirectTo)
      }
    }
  }, [user, isLoading, router, redirectTo])

  return {
    isManager: user?.role === 'admin' || user?.role === 'manager',
    isLoading,
  }
}