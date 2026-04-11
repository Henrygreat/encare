'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  FileText,
  Plus,
  Edit,
  History,
  Send,
  Calendar,
  User,
  Clock,
  AlertTriangle,
  Phone,
  Archive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import {
  CarePlanSectionView,
  CarePlanStatusBadge,
} from '@/components/care-plan/care-plan-section'
import {
  useCarePlan,
  useDraftCarePlan,
  useCarePlanActions,
  useRequireManager,
  HIGHLIGHTED_SECTIONS,
} from '@/lib/hooks'
import { useResident } from '@/lib/hooks/use-residents'
import { formatDate, formatDateTime } from '@/lib/utils'
import { useToast } from '@/components/providers/toast-provider'

export default function DashboardCarePlanPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { showToast } = useToast()
  const { isManager, isLoading: authLoading } = useRequireManager('/dashboard')
  const { resident, isLoading: residentLoading } = useResident(params.id)
  const { carePlan: activeCarePlan, isLoading: activeLoading, refetch: refetchActive } = useCarePlan(params.id)
  const { carePlan: draftCarePlan, isLoading: draftLoading, refetch: refetchDraft } = useDraftCarePlan(params.id)
  const { createDraftCarePlan, publishCarePlan, archiveCarePlan, isLoading: actionLoading } = useCarePlanActions()

  const [showPublishConfirm, setShowPublishConfirm] = useState(false)

  const isLoading = authLoading || residentLoading || activeLoading || draftLoading

  const handleCreateDraft = async () => {
    const result = await createDraftCarePlan(params.id)
    if (result.error) {
      showToast({ title: result.error, variant: 'error' })
    } else if (result.carePlan) {
      showToast({ title: 'Draft care plan created', variant: 'success' })
      router.push(`/dashboard/residents/${params.id}/care-plan/edit`)
    }
  }

  const handlePublish = async () => {
    if (!draftCarePlan) return
    const result = await publishCarePlan(draftCarePlan.id)
    if (result.error) {
      showToast({ title: result.error, variant: 'error' })
    } else {
      showToast({ title: 'Care plan published', variant: 'success' })
      setShowPublishConfirm(false)
      await refetchActive()
      await refetchDraft()
    }
  }

  const handleArchive = async () => {
    if (!activeCarePlan) return
    if (!window.confirm('Are you sure you want to archive this care plan?')) return
    const result = await archiveCarePlan(activeCarePlan.id)
    if (result.error) {
      showToast({ title: result.error, variant: 'error' })
    } else {
      showToast({ title: 'Care plan archived', variant: 'success' })
      await refetchActive()
    }
  }

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
          You do not have permission to manage care plans.
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
            href={`/dashboard/residents/${params.id}`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                Care Plan
              </h1>
              {activeCarePlan && (
                <>
                  <CarePlanStatusBadge status="active" />
                  <span className="text-sm text-slate-500">v{activeCarePlan.version}</span>
                </>
              )}
            </div>
            <p className="mt-1 text-slate-600">
              {displayName} {resident.last_name}
              {resident.room_number && ` · Room ${resident.room_number}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/dashboard/residents/${params.id}/care-plan/history`}>
            <Button variant="ghost" size="sm">
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
          </Link>
          {activeCarePlan && (
            <Link href={`/dashboard/residents/${params.id}/care-plan/edit`}>
              <Button variant="secondary" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
          {!activeCarePlan && !draftCarePlan && (
            <Button onClick={handleCreateDraft} disabled={actionLoading} isLoading={actionLoading}>
              <Plus className="mr-2 h-4 w-4" />
              Create Care Plan
            </Button>
          )}
        </div>
      </div>

      {/* Draft Banner */}
      {draftCarePlan && (
        <Card className="border-amber-200 bg-amber-50" padding="md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">
                  Draft Care Plan (v{draftCarePlan.version})
                </p>
                <p className="text-sm text-amber-700">
                  This draft is not yet visible to staff. Edit and publish when ready.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/residents/${params.id}/care-plan/edit`}>
                <Button variant="secondary" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Draft
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowPublishConfirm(true)}
                disabled={actionLoading}
              >
                <Send className="mr-2 h-4 w-4" />
                Publish
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* No Care Plan State */}
      {!activeCarePlan && !draftCarePlan && (
        <Card padding="lg">
          <div className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h2 className="text-lg font-semibold text-slate-900">No Care Plan</h2>
            <p className="mt-2 text-slate-500">
              This resident doesn&apos;t have a care plan yet. Create one to document their care needs.
            </p>
            <Button
              className="mt-6"
              onClick={handleCreateDraft}
              disabled={actionLoading}
              isLoading={actionLoading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Care Plan
            </Button>
          </div>
        </Card>
      )}

      {/* Active Care Plan */}
      {activeCarePlan && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {/* Summary Card */}
            <Card padding="md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {activeCarePlan.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeCarePlan.summary ? (
                  <p className="text-slate-700">{activeCarePlan.summary}</p>
                ) : (
                  <p className="italic text-slate-400">No summary provided</p>
                )}
              </CardContent>
            </Card>

            {/* Sections */}
            <div className="space-y-3">
              {activeCarePlan.sections?.map((section) => (
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
                      <CarePlanStatusBadge status={activeCarePlan.status} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Version</dt>
                    <dd className="font-medium text-slate-900">v{activeCarePlan.version}</dd>
                  </div>
                  {activeCarePlan.published_at && (
                    <div>
                      <dt className="text-sm text-slate-500">Published</dt>
                      <dd className="font-medium text-slate-900">
                        {formatDateTime(activeCarePlan.published_at)}
                      </dd>
                    </div>
                  )}
                  {activeCarePlan.review_date && (
                    <div>
                      <dt className="flex items-center gap-1 text-sm text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        Last Review
                      </dt>
                      <dd className="font-medium text-slate-900">
                        {formatDate(activeCarePlan.review_date)}
                      </dd>
                    </div>
                  )}
                  {activeCarePlan.next_review_date && (
                    <div>
                      <dt className="flex items-center gap-1 text-sm text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        Next Review
                      </dt>
                      <dd className="font-medium text-slate-900">
                        {formatDate(activeCarePlan.next_review_date)}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm text-slate-500">Created</dt>
                    <dd className="font-medium text-slate-900">
                      {formatDate(activeCarePlan.created_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Last Updated</dt>
                    <dd className="font-medium text-slate-900">
                      {formatDateTime(activeCarePlan.updated_at)}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card padding="md">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!draftCarePlan && (
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={handleCreateDraft}
                    disabled={actionLoading}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Version
                  </Button>
                )}
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={handleArchive}
                  disabled={actionLoading}
                  className="text-slate-500 hover:text-red-600"
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive Care Plan
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {showPublishConfirm && draftCarePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="mx-4 w-full max-w-md" padding="lg">
            <h3 className="text-lg font-semibold text-slate-900">Publish Care Plan?</h3>
            <p className="mt-2 text-slate-600">
              This will make version {draftCarePlan.version} the active care plan for {displayName}.
              {activeCarePlan && ' The current active plan will be archived.'}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowPublishConfirm(false)}>
                Cancel
              </Button>
              <Button
                onClick={handlePublish}
                disabled={actionLoading}
                isLoading={actionLoading}
              >
                <Send className="mr-2 h-4 w-4" />
                Publish
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
