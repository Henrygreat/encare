import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/config'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    getSupabaseEnv().url,
    getSupabaseEnv().key,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password')
  const isProtectedRoute =
    pathname.startsWith('/app') ||
    pathname.startsWith('/dashboard')
  const isBillingRoute = pathname.startsWith('/billing')
  const isWebhookRoute = pathname.startsWith('/api/billing/webhook')

  // Allow webhook requests through without auth
  if (isWebhookRoute) {
    return response
  }

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user && isBillingRoute && pathname !== '/billing/cancel') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/app', request.url))
  }

  // Check subscription status for protected routes
  if (user && (isProtectedRoute || (isBillingRoute && pathname === '/billing/success'))) {
    // Get user profile to check role and organisation
    const { data: userData } = await supabase
      .from('users')
      .select('organisation_id, role')
      .eq('id', user.id)
      .single()

    if (userData) {
      // Check for active subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('organisation_id', userData.organisation_id)
        .in('status', ['active', 'trialing'])
        .limit(1)
        .single()

      const hasActiveSubscription = !!subscription

      // If no active subscription and trying to access protected routes
      if (!hasActiveSubscription && isProtectedRoute) {
        const isAdmin = userData.role === 'admin'
        if (isAdmin) {
          return NextResponse.redirect(new URL('/billing/setup', request.url))
        } else {
          return NextResponse.redirect(new URL('/billing/pending', request.url))
        }
      }

      // If has active subscription and on billing setup/pending, redirect to app
      if (hasActiveSubscription && (pathname === '/billing/setup' || pathname === '/billing/pending')) {
        return NextResponse.redirect(new URL('/app', request.url))
      }
    }
  }

  return response
}
