'use client'

import { useEffect, useCallback } from 'react'
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
    last_login_at: new Date().toISOString(),
    preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
  const { user, organisation, isLoading, isAuthenticated, setUser, setOrganisation, setIsLoading, clear } = useAuthStore()

  const initializeAuth = useCallback(async () => {
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.user) {
        clear()
        return
      }

      const fallbackUser = buildFallbackUser(session.user)
      setUser(fallbackUser)
      setOrganisation(fallbackOrganisation)

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (userData) {
        setUser(userData as User)

        const { data: orgData } = await supabase
          .from('organisations')
          .select('*')
          .eq('id', userData.organisation_id)
          .maybeSingle()

        if (orgData) {
          setOrganisation(orgData as Organisation)
        }
      }
    } catch (err) {
      console.error('Auth initialization error:', err)
      clear()
    } finally {
      setIsLoading(false)
    }
  }, [setUser, setOrganisation, setIsLoading, clear])

  useEffect(() => {
    const supabase = createClient()

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_OUT') {
        clear()
        router.push('/login')
      } else if (session?.user) {
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
    isLoading,
  }
}
