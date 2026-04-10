'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { useMyPolicies, usePolicyActions } from '@/lib/hooks'
import { formatDate, formatRelativeTime } from '@/lib/utils'

export default function StaffPolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { policies, isLoading, refetch } = useMyPolicies()
  const { acknowledgePolicy, isLoading: ackLoading } = usePolicyActions()

  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const policy = policies.find((p) => p.id === resolvedParams.id)

  const handleAcknowledge = async () => {
    if (!policy) return
    setError(null)

    try {
      await acknowledgePolicy(policy.id, policy.version)
      setShowSuccess(true)
      await refetch()
    } catch (err) {
      console.error('Error acknowledging:', err)
      setError(err instanceof Error ? err.message : 'Failed to acknowledge policy')
    }
  }

  // Reset success state when navigating away
  useEffect(() => {
    return () => setShowSuccess(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50 p-4">
        <div className="h-10 w-64 animate-pulse rounded bg-slate-200" />
        <Card className="mt-4 animate-pulse">
          <CardContent className="p-6">
            <div className="h-6 w-1/3 rounded bg-slate-200" />
            <div className="mt-4 h-32 rounded bg-slate-100" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!policy) {
    return (
      <div className="min-h-screen bg-surface-50 p-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-lg font-semibold text-slate-900">Policy not found</h2>
          <p className="mt-1 text-slate-600">
            This policy may have been removed or you don&apos;t have access.
          </p>
          <Link href="/app/policies" className="mt-4">
            <Button variant="secondary">Back to Policies</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-surface-50 pb-20">
        <div className="flex items-center gap-3 border-b border-surface-200 bg-white px-4 py-4">
          <Link
            href="/app/policies"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">Policy Acknowledged</h1>
        </div>

        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Thank you</h2>
          <p className="mt-2 text-slate-600">
            You have acknowledged that you have read and understood the policy:
          </p>
          <p className="mt-2 font-medium text-slate-900">{policy.title}</p>
          <p className="mt-4 text-sm text-slate-500">
            Acknowledged on {formatDate(new Date().toISOString())}
          </p>

          <Link href="/app/policies" className="mt-8">
            <Button>Back to Policies</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-50 pb-32">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-surface-200 bg-white px-4 py-4">
        <Link
          href="/app/policies"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="truncate text-lg font-semibold text-slate-900">{policy.title}</h1>
          {policy.version > 1 && (
            <span className="text-xs text-slate-500">Version {policy.version}</span>
          )}
        </div>
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
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {policy.summary && (
          <Card>
            <CardContent className="p-4">
              <p className="text-slate-600">{policy.summary}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
              <FileText className="h-5 w-5" />
              Policy Content
            </h2>
            {policy.content ? (
              <div className="prose prose-slate max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                {policy.content}
              </div>
            ) : policy.file_url ? (
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <FileText className="h-8 w-8 text-slate-400" />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    {policy.file_name || 'Attached Document'}
                  </p>
                  <p className="text-sm text-slate-500">Tap to open the policy document</p>
                </div>
                <a
                  href={policy.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-full bg-primary-100 px-4 py-2 text-sm font-medium text-primary-700"
                >
                  Open <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ) : (
              <p className="text-slate-500">No content available.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Assigned</dt>
                <dd className="font-medium text-slate-900">
                  {formatRelativeTime(policy.assignment.assigned_at)}
                </dd>
              </div>
              {policy.assignment.due_at && (
                <div>
                  <dt className="text-slate-500">Due by</dt>
                  <dd className="font-medium text-slate-900">
                    {formatDate(policy.assignment.due_at)}
                  </dd>
                </div>
              )}
              {policy.is_acknowledged && policy.acknowledgement && (
                <div className="col-span-2">
                  <dt className="text-slate-500">Acknowledged</dt>
                  <dd className="font-medium text-emerald-600">
                    {formatDate(policy.acknowledgement.acknowledged_at)}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      {!policy.is_acknowledged && policy.requires_acknowledgement && (
        <div className="fixed bottom-16 left-0 right-0 border-t border-surface-200 bg-white p-4 safe-area-inset-bottom">
          <Button
            fullWidth
            size="tap"
            onClick={handleAcknowledge}
            disabled={ackLoading}
            isLoading={ackLoading}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            I have read and understood this policy
          </Button>
        </div>
      )}

      {policy.is_acknowledged && (
        <div className="fixed bottom-16 left-0 right-0 border-t border-surface-200 bg-emerald-50 p-4 safe-area-inset-bottom">
          <div className="flex items-center justify-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">
              Acknowledged {policy.acknowledgement ? formatRelativeTime(policy.acknowledgement.acknowledged_at) : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
