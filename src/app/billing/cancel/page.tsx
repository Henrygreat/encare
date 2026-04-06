'use client'

import { useRouter } from 'next/navigation'
import { XCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function BillingCancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100 flex items-center justify-center p-4">
      <Card variant="elevated" padding="lg" className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Checkout cancelled
          </h1>
          <p className="text-slate-600">
            No worries! Your payment was not processed. You can try again whenever you&apos;re ready.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            fullWidth
            onClick={() => router.push('/billing/setup')}
          >
            Return to plans
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => router.push('/login')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to login
          </Button>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Have questions? Contact support@encare.app
        </p>
      </Card>
    </div>
  )
}
