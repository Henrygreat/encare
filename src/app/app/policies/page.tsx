'use client'

import Link from 'next/link'
import { FileText, CheckCircle2, Clock, ChevronRight, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { MobileHeader } from '@/components/layout/mobile-header'
import { useMyPolicies } from '@/lib/hooks'
import { formatRelativeTime } from '@/lib/utils'

export default function StaffPoliciesPage() {
  const { policies, isLoading, error } = useMyPolicies()

  const pendingCount = policies.filter((p) => !p.is_acknowledged).length

  if (error) {
    return (
      <div className="min-h-screen bg-surface-50">
        <MobileHeader title="Policies" />
        <div className="p-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            Failed to load policies. Please try again.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-50 pb-20">
      <MobileHeader
        title="Policies"
        subtitle={pendingCount > 0 ? `${pendingCount} pending` : 'All read'}
      />

      <div className="p-4 space-y-4">
        {pendingCount > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              You have {pendingCount} {pendingCount === 1 ? 'policy' : 'policies'} to read and acknowledge
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-5 w-2/3 rounded bg-slate-200" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : policies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No policies</h3>
              <p className="mt-1 text-slate-600">
                You don&apos;t have any policies assigned to you yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {policies.map((policy) => (
              <Link key={policy.id} href={`/app/policies/${policy.id}`}>
                <Card className={`transition-shadow hover:shadow-md ${
                  !policy.is_acknowledged ? 'border-l-4 border-l-amber-400' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-semibold text-slate-900">
                            {policy.title}
                          </h3>
                          {policy.version > 1 && (
                            <span className="text-xs text-slate-500">v{policy.version}</span>
                          )}
                        </div>
                        {policy.summary && (
                          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                            {policy.summary}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-3">
                          {policy.is_acknowledged ? (
                            <Chip variant="success" size="sm">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Read
                            </Chip>
                          ) : (
                            <Chip variant="warning" size="sm">
                              <Clock className="mr-1 h-3 w-3" />
                              Pending
                            </Chip>
                          )}
                          <span className="text-xs text-slate-500">
                            Assigned {formatRelativeTime(policy.assignment.assigned_at)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
