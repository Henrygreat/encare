'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CarePlanSectionView,
  CarePlanStatusBadge,
} from '@/components/care-plan/care-plan-section'
import {
  useCarePlanById,
  useRequireManager,
  HIGHLIGHTED_SECTIONS,
} from '@/lib/hooks'
import { useResident } from '@/lib/hooks/use-residents'
import { formatDate, formatDateTime } from '@/lib/utils'

export default function ViewCarePlanPage({
  params,
}: {
  params: { id: string; carePlanId: string }
}) {
  const { isManager, isLoading: authLoading } = useRequireManager('/dashboard')
  const { resident, isLoading: residentLoading } = useResident(params.id)
  const { carePlan, isLoading: carePlanLoading } = useCarePlanById(params.carePlanId)

  const isLoading = authLoading || residentLoading || carePlanLoading

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
          You do not have permission to view care plans.
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

  if (!carePlan) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <h2 className="text-lg font-semibold text-slate-900">Care plan not found</h2>
        <Link href={`/dashboard/residents/${params.id}/care-plan/history`} className="mt-4">
          <Button variant="secondary">Back to History</Button>
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
            href={`/dashboard/residents/${params.id}/care-plan/history`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                Care Plan
              </h1>
              <CarePlanStatusBadge status={carePlan.status} />
              <span className="text-sm text-slate-500">v{carePlan.version}</span>
            </div>
            <p className="mt-1 text-slate-600">
              {displayName} {resident.last_name}
              {resident.room_number && ` · Room ${resident.room_number}`}
            </p>
          </div>
        </div>

        <Link href={`/dashboard/residents/${params.id}/care-plan/history`}>
          <Button variant="secondary">
            Back to History
          </Button>
        </Link>
      </div>

      {/* Read-only notice for archived plans */}
      {carePlan.status === 'archived' && (
        <Card className="border-slate-200 bg-slate-50" padding="md">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-slate-500" />
            <p className="text-sm text-slate-600">
              This is an archived version of the care plan (v{carePlan.version}). It is read-only.
            </p>
          </div>
        </Card>
      )}

      {/* Care Plan Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Summary Card */}
          <Card padding="md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {carePlan.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {carePlan.summary ? (
                <p className="text-slate-700">{carePlan.summary}</p>
              ) : (
                <p className="italic text-slate-400">No summary provided</p>
              )}
            </CardContent>
          </Card>

          {/* Sections */}
          <div className="space-y-3">
            {carePlan.sections?.map((section) => (
              <CarePlanSectionView
                key={section.id}
                section={section}
                defaultExpanded={HIGHLIGHTED_SECTIONS.includes(
                  section.section_key as (typeof HIGHLIGHTED_SECTIONS)[number]
                )}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Details Card */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-slate-500">Status</dt>
                  <dd className="mt-1">
                    <CarePlanStatusBadge status={carePlan.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Version</dt>
                  <dd className="font-medium text-slate-900">v{carePlan.version}</dd>
                </div>
                {carePlan.published_at && (
                  <div>
                    <dt className="text-sm text-slate-500">Published</dt>
                    <dd className="font-medium text-slate-900">
                      {formatDateTime(carePlan.published_at)}
                    </dd>
                  </div>
                )}
                {carePlan.review_date && (
                  <div>
                    <dt className="flex items-center gap-1 text-sm text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      Last Review
                    </dt>
                    <dd className="font-medium text-slate-900">
                      {formatDate(carePlan.review_date)}
                    </dd>
                  </div>
                )}
                {carePlan.next_review_date && (
                  <div>
                    <dt className="flex items-center gap-1 text-sm text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      Next Review
                    </dt>
                    <dd className="font-medium text-slate-900">
                      {formatDate(carePlan.next_review_date)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-slate-500">Created</dt>
                  <dd className="font-medium text-slate-900">
                    {formatDate(carePlan.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Last Updated</dt>
                  <dd className="font-medium text-slate-900">
                    {formatDateTime(carePlan.updated_at)}
                  </dd>
                </div>
                {carePlan.created_by_name && (
                  <div>
                    <dt className="text-sm text-slate-500">Created By</dt>
                    <dd className="font-medium text-slate-900">
                      {carePlan.created_by_name}
                    </dd>
                  </div>
                )}
                {carePlan.updated_by_name && (
                  <div>
                    <dt className="text-sm text-slate-500">Updated By</dt>
                    <dd className="font-medium text-slate-900">
                      {carePlan.updated_by_name}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
