'use client'

import { ArrowLeft, Building2, Shield } from 'lucide-react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BillingSettings } from '@/components/billing/billing-settings'
import { useAuthStore } from '@/lib/stores/auth-store'

export default function DashboardSettingsPage() {
  const { user, organisation } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-white/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 -ml-2 rounded-full hover:bg-surface-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Workspace Settings
            </h1>
            <p className="text-sm text-slate-500">{organisation?.name}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Organisation Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">Name</p>
                <p className="font-medium text-slate-900">{organisation?.name || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Slug</p>
                <p className="font-medium text-slate-900">{organisation?.slug || 'Not set'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing - Admin only */}
        {isAdmin && <BillingSettings />}

        {/* Non-admin notice */}
        {!isAdmin && (
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-3 text-slate-500">
                <Shield className="h-5 w-5" />
                <p className="text-sm">
                  Billing settings are only available to administrators.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Placeholder for future settings */}
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
          <CardContent className="py-8 text-center">
            <p className="text-slate-400 text-sm">
              More settings coming soon: branding, permission presets, task templates, and reporting.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
