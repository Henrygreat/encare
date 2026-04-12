'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  History,
  FileText,
  Clock,
  User,
  CheckCircle2,
  Archive,
  Edit3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CarePlanStatusBadge,
} from '@/components/care-plan/care-plan-section'
import {
  useCarePlanVersions,
  useCarePlanAuditLogs,
  useCarePlan,
  useRequireManager,
} from '@/lib/hooks'
import { useResident } from '@/lib/hooks/use-residents'
import { formatDate, formatDateTime, formatRelativeTime } from '@/lib/utils'
import type { CarePlanStatus } from '@/lib/database.types'

const actionLabels: Record<string, { label: string; icon: typeof FileText }> = {
  created: { label: 'Created', icon: FileText },
  updated: { label: 'Updated', icon: Edit3 },
  section_updated: { label: 'Section updated', icon: Edit3 },
  sections_updated: { label: 'Sections updated', icon: Edit3 },
  published: { label: 'Published', icon: CheckCircle2 },
  archived: { label: 'Archived', icon: Archive },
}

export default function CarePlanHistoryPage({
  params,
}: {
  params: { id: string }
}) {
  const { isManager, isLoading: authLoading } = useRequireManager('/dashboard')
  const { resident, isLoading: residentLoading } = useResident(params.id)
  const { versions, isLoading: versionsLoading } = useCarePlanVersions(params.id)
  const { carePlan: activeCarePlan } = useCarePlan(params.id)
  const { logs, isLoading: logsLoading } = useCarePlanAuditLogs(activeCarePlan?.id || null)

  const isLoading = authLoading || residentLoading || versionsLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded bg-slate-200" />
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-6 w-1/3 rounded bg-slate-200" />
            <div className="mt-4 h-32 rounded bg-slate-100" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isManager) {
    return (
      <Card padding="lg">
        <p className="text-center text-slate-500">
          You do not have permission to view care plan history.
        </p>
      </Card>
    )
  }

  if (!resident) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Resident not found</h2>
        <Link href="/dashboard/residents" className="mt-4">
          <Button variant="secondary">Back to Residents</Button>
        </Link>
      </div>
    )
  }

  const displayName = resident.preferred_name || resident.first_name

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/residents/${params.id}/care-plan`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                Care Plan History
              </h1>
            </div>
            <p className="mt-1 text-slate-600">
              {displayName} {resident.last_name}
              {resident.room_number && ` · Room ${resident.room_number}`}
            </p>
          </div>
        </div>

        <Link href={`/dashboard/residents/${params.id}/care-plan`}>
          <Button variant="secondary">
            <FileText className="mr-2 h-4 w-4" />
            View Current
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Versions */}
        <Card padding="md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Versions ({versions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {versions.length === 0 ? (
              <div className="py-8 text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="text-slate-500">No care plan versions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          version.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : version.status === 'draft'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span className="text-sm font-bold">v{version.version}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            Version {version.version}
                          </span>
                          <CarePlanStatusBadge status={version.status} />
                        </div>
                        <p className="text-sm text-slate-500">
                          {version.status === 'active' && version.published_at
                            ? `Published ${formatRelativeTime(version.published_at)}`
                            : `Created ${formatRelativeTime(version.created_at)}`}
                          {version.created_by_name && ` by ${version.created_by_name}`}
                        </p>
                      </div>
                    </div>
                    {(version.status === 'active' || version.status === 'archived') && (
                      <Link href={`/dashboard/residents/${params.id}/care-plan/${version.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card padding="md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="py-8 text-center">
                <Clock className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="text-slate-500">No activity recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => {
                  const actionConfig = actionLabels[log.action] || {
                    label: log.action,
                    icon: FileText,
                  }
                  const Icon = actionConfig.icon

                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 rounded-xl border border-slate-100 p-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                        <Icon className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {actionConfig.label}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatRelativeTime(log.created_at)}
                          {log.actor_name && ` by ${log.actor_name}`}
                        </p>
                        {log.details && typeof log.details === 'object' && (
                          <div className="mt-1 text-xs text-slate-400">
                            {(log.details as any).section_label && (
                              <span>{(log.details as any).section_label}</span>
                            )}
                            {(log.details as any).sections_count && (
                              <span>{(log.details as any).sections_count} sections</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
