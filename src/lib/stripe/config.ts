import Stripe from 'stripe'

// Re-export client-safe plan config
export * from './plans'

// Server-only configuration below
// DO NOT import this file in client components - import from './plans' instead

export function getStripeEnv() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is required')
  }

  return {
    secretKey,
    publishableKey: publishableKey || '',
    webhookSecret: webhookSecret || '',
  }
}

export function getStripeInstance(): Stripe {
  const { secretKey } = getStripeEnv()

  return new Stripe(secretKey, {
    apiVersion: '2024-06-20',
    typescript: true,
  })
}
