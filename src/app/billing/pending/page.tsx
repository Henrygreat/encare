'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/lib/hooks/use-auth'

export default function BillingPendingPage() {
  const router = useRouter()
  const { signOut, user, refreshAuth } = useAuth()

  // Periodically check if subscription is now active
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAuth()
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [refreshAuth])

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100 flex items-center justify-center p-4">
      <Card variant="elevated" padding="lg" className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Subscription pending
          </h1>
          <p className="text-slate-600">
            Your organisation administrator needs to set up billing before you can access the app.
          </p>
        </div>

        <div className="bg-surface-100 rounded-xl p-4 mb-6">
          <p className="text-sm text-slate-500 mb-1">Signed in as</p>
          <p className="font-medium text-slate-900">{user?.email}</p>
        </div>

        <div className="space-y-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => refreshAuth()}
          >
            Check again
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={signOut}
          >
            Sign out
          </Button>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          This page will automatically refresh when billing is set up.
        </p>
      </Card>
    </div>
  )
}
