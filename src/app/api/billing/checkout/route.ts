import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getOrCreateStripeCustomer,
  createCustomerPortalSession,
} from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*, organisations(*)')
      .eq('id', authUser.id)
      .single()

    if (userError || !userData) {
      console.error('Portal user lookup error:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can manage billing' },
        { status: 403 }
      )
    }

    const organisationRaw = userData.organisations as
      | { id: string; name: string }
      | Array<{ id: string; name: string }>
      | null

    const organisation = Array.isArray(organisationRaw)
      ? organisationRaw[0]
      : organisationRaw

    if (!organisation?.id) {
      console.error('Portal organisation missing:', {
        userId: authUser.id,
        organisations: userData.organisations,
      })

      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      )
    }

    const email = userData.email || authUser.email

    if (!email) {
      return NextResponse.json(
        { error: 'No billing email available for this account' },
        { status: 400 }
      )
    }

    const customerId = await getOrCreateStripeCustomer(
      organisation.id,
      email,
      organisation.name || 'Organisation'
    )

    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      ''

    const returnUrl = `${origin}/dashboard/billing`

    const session = await createCustomerPortalSession(customerId, returnUrl)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Portal error FULL:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create portal session',
      },
      { status: 500 }
    )
  }
}