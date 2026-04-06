import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripeInstance, getStripeEnv } from '@/lib/stripe/config'
import { handleWebhookEvent } from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  const stripe = getStripeInstance()
  const { webhookSecret } = getStripeEnv()

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    )
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    )
  }

  try {
    await handleWebhookEvent(event)
    return NextResponse.json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook handler error:', message)
    return NextResponse.json(
      { error: `Webhook handler failed: ${message}` },
      { status: 500 }
    )
  }
}

// Disable body parsing, we need raw body for signature verification
export const runtime = 'nodejs'
