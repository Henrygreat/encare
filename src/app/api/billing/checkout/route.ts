import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateStripeCustomer, createCheckoutSession } from '@/lib/stripe/server'
import { PLANS, type PlanCode } from '@/lib/stripe/config'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile with organisation
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*, organisations(*)')
      .eq('id', authUser.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only admins can manage billing
    if (userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can manage billing' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { planCode } = body as { planCode: PlanCode }

    if (!planCode || !PLANS[planCode]) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    const plan = PLANS[planCode]

    if (!plan.priceId) {
      return NextResponse.json(
        { error: 'Plan price not configured' },
        { status: 500 }
      )
    }

    const organisation = userData.organisations as { id: string; name: string }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      organisation.id,
      userData.email,
      organisation.name
    )

    // Create checkout session
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''
    const successUrl = `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin}/billing/cancel`

    const session = await createCheckoutSession(
      customerId,
      organisation.id,
      plan.priceId,
      successUrl,
      cancelUrl
    )

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
