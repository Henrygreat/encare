'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CreditCard, ExternalLink, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { cn } from '@/lib/utils'

export function BillingSettings() {
  const { subscription, isLoading, isActive, isTrialing, status, openCustomerPortal } = useSubscription()
  const [isPortalLoading, setIsPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleManageBilling = async () => {
    setIsPortalLoading(true)
    setError(null)

    try {
      await openCustomerPortal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal')
      setIsPortalLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-4 w-48 bg-slate-200 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = () => {
    if (!status) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          <Clock className="h-3.5 w-3.5" />
          No subscription
        </span>
      )
    }

    if (isTrialing) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          <Clock className="h-3.5 w-3.5" />
          Trial
        </span>
      )
    }

    if (isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Active
        </span>
      )
    }

    if (status === 'past_due') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5" />
          Past due
        </span>
      )
    }

    if (status === 'canceled' || status === 'unpaid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <AlertTriangle className="h-3.5 w-3.5" />
          {status === 'canceled' ? 'Canceled' : 'Unpaid'}
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
        {status}
      </span>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {subscription ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {subscription.current_period_end && (
                <div>
                  <p className="text-sm text-slate-500">
                    {subscription.cancel_at_period_end ? 'Cancels on' : 'Renews on'}
                  </p>
                  <p className="font-medium text-slate-900">
                    {format(new Date(subscription.current_period_end), 'MMMM d, yyyy')}
                  </p>
                </div>
              )}

              {isTrialing && subscription.trial_ends_at && (
                <div>
                  <p className="text-sm text-slate-500">Trial ends on</p>
                  <p className="font-medium text-slate-900">
                    {format(new Date(subscription.trial_ends_at), 'MMMM d, yyyy')}
                  </p>
                </div>
              )}
            </div>

            {subscription.cancel_at_period_end && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  Your subscription is set to cancel at the end of the billing period.
                  You can reactivate it from the billing portal.
                </p>
              </div>
            )}

            <Button
              variant="secondary"
              onClick={handleManageBilling}
              isLoading={isPortalLoading}
              className="w-full sm:w-auto"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage billing
            </Button>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-slate-500 mb-4">
              No active subscription. Subscribe to access all features.
            </p>
            <Button onClick={() => window.location.href = '/billing/setup'}>
              Choose a plan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
