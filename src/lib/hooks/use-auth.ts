'use client'

import { useEffect, useCallback, useRef } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth-store'
import type { User, Organisation } from '@/lib/database.types'

function buildFallbackUser(sessionUser: {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}): User {
  const fullName =
    typeof sessionUser.user_metadata?.full_name === 'string'
      ? sessionUser.user_metadata.full_name
      : typeof sessionUser.user_metadata?.name === 'string'
        ? sessionUser.user_metadata.name
        : (sessionUser.email?.split('@')[0] || 'Care Team User')

  const now = new Date().toISOString()

  return {
    id: sessionUser.id,
    organisation_id: 'demo-org',
    email: sessionUser.email || '',
    full_name: fullName,
    role: 'manager',
    avatar_url: null,
    phone: null,
    pin_hash: null,
    is_active: true,
    last_login_at: now,
    preferences: {},
    created_at: now,
    updated_at: now,
  }
}

const fallbackOrganisation: Organisation = {
  id: 'demo-org',
  name: 'EnCare Demo Organisation',
  slug: 'encare-demo',
  logo_url: null,
  settings: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

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

      const fallbackUser = buildFallbackUser(session.user)
      setUser(fallbackUser)
      setOrganisation(fallbackOrganisation)

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (userError) {
        console.warn('User profile lookup failed, using fallback user:', userError.message)
        return
      }

      if (!userData) {
        return
      }

      setUser(userData as User)

      const { data: orgData, error: orgError } = await supabase
        .from('organisations')
        .select('*')
        .eq('id', userData.organisation_id)
        .maybeSingle()

      if (orgError) {
        console.warn('Organisation lookup failed, using fallback organisation:', orgError.message)
        return
      }

      if (orgData) {
        setOrganisation(orgData as Organisation)
      }
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