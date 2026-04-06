// Client-safe plan configuration
// This file can be safely imported in client components

export const PLANS = {
  starter: {
    code: 'starter',
    name: 'Starter',
    description: 'Perfect for small care homes',
    priceId: process.env.STRIPE_PRICE_ID_STARTER || '',
    price: 49,
    currency: 'GBP',
    interval: 'month' as const,
    features: [
      'Up to 20 residents',
      '5 staff accounts',
      'Basic reporting',
      'Email support',
    ],
  },
  growth: {
    code: 'growth',
    name: 'Growth',
    description: 'For growing care organisations',
    priceId: process.env.STRIPE_PRICE_ID_GROWTH || '',
    price: 99,
    currency: 'GBP',
    interval: 'month' as const,
    features: [
      'Up to 50 residents',
      '15 staff accounts',
      'Advanced reporting',
      'Priority support',
      'Care plan templates',
    ],
    popular: true,
  },
  pro: {
    code: 'pro',
    name: 'Professional',
    description: 'For large care providers',
    priceId: process.env.STRIPE_PRICE_ID_PRO || '',
    price: 199,
    currency: 'GBP',
    interval: 'month' as const,
    features: [
      'Unlimited residents',
      'Unlimited staff',
      'Custom reporting',
      '24/7 phone support',
      'API access',
      'Dedicated account manager',
    ],
  },
} as const

export type PlanCode = keyof typeof PLANS
export type Plan = typeof PLANS[PlanCode]

export function getPlanByPriceId(priceId: string): Plan | undefined {
  return Object.values(PLANS).find(plan => plan.priceId === priceId)
}

export function getTrialDays(): number {
  return parseInt(process.env.STRIPE_TRIAL_DAYS || '14', 10)
}

export function isTrialEnabled(): boolean {
  return getTrialDays() > 0
}
