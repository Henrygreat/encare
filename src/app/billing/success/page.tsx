'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function BillingSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(5)

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/app')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100 flex items-center justify-center p-4">
      <Card variant="elevated" padding="lg" className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center relative">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <Sparkles className="h-5 w-5 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            You&apos;re all set!
          </h1>
          <p className="text-slate-600">
            Your subscription is now active. Welcome to EnCare!
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-green-800 text-sm">
            Your team can now access all features. You can manage your subscription anytime from settings.
          </p>
        </div>

        <Button
          fullWidth
          onClick={() => router.push('/app')}
        >
          Go to dashboard
        </Button>

        <p className="mt-4 text-sm text-slate-400">
          Redirecting in {countdown} seconds...
        </p>
      </Card>
    </div>
  )
}
