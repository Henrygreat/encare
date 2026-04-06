'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PLANS, type PlanCode, isTrialEnabled, getTrialDays } from '@/lib/stripe/plans'
import { cn } from '@/lib/utils'

export default function BillingSetupPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<PlanCode>('growth')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trialEnabled = isTrialEnabled()
  const trialDays = getTrialDays()

  const handleSubscribe = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planCode: selectedPlan }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start checkout')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsLoading(false)
    }
  }

  const plans = Object.entries(PLANS) as [PlanCode, typeof PLANS[PlanCode]][]

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="h-14 w-14 mx-auto mb-6 rounded-2xl bg-primary-600 flex items-center justify-center shadow-[0_12px_30px_rgba(2,132,199,0.24)]">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Choose your plan
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Select the perfect plan for your care home. All plans include our core features with no hidden fees.
          </p>
          {trialEnabled && (
            <p className="mt-3 text-primary-600 font-medium">
              Start with a {trialDays}-day free trial. No credit card charged until trial ends.
            </p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-8 max-w-md mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm text-center">
              {error}
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8 max-w-5xl mx-auto">
          {plans.map(([code, plan]) => {
            const isSelected = selectedPlan === code
            const isPopular = 'popular' in plan && plan.popular

            return (
              <div key={code} className="relative">
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-block bg-primary-600 text-white text-sm font-medium px-4 py-1 rounded-full shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                <Card
                  variant={isSelected ? 'elevated' : 'default'}
                  padding="lg"
                  className={cn(
                    'cursor-pointer transition-all duration-300 h-full',
                    isSelected && 'ring-2 ring-primary-500 ring-offset-2',
                    isPopular && 'scale-[1.02]'
                  )}
                  onClick={() => setSelectedPlan(code)}
                >
                  <div className="flex flex-col h-full">
                    {/* Plan header */}
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-slate-900 mb-1">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-slate-500">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-slate-900">
                          {plan.currency === 'GBP' ? '£' : '$'}{plan.price}
                        </span>
                        <span className="text-slate-500">/{plan.interval}</span>
                      </div>
                      {trialEnabled && (
                        <p className="text-sm text-primary-600 mt-1">
                          {trialDays} days free
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8 flex-grow">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-600">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Selection indicator */}
                    <div
                      className={cn(
                        'w-full py-3 rounded-xl text-center font-medium transition-colors',
                        isSelected
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-surface-100 text-slate-500'
                      )}
                    >
                      {isSelected ? 'Selected' : 'Select plan'}
                    </div>
                  </div>
                </Card>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button
            size="lg"
            onClick={handleSubscribe}
            isLoading={isLoading}
            className="min-w-[240px]"
          >
            {trialEnabled ? 'Start free trial' : 'Subscribe now'}
          </Button>
          <p className="mt-4 text-sm text-slate-500">
            Cancel anytime. No long-term contracts.
          </p>
        </div>

        {/* Trust badges */}
        <div className="mt-16 pt-8 border-t border-slate-200">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
              <span>Powered by Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>GDPR Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
