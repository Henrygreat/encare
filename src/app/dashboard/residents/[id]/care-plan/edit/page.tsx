'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Send,
  FileText,
  Calendar,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  CarePlanSectionEdit,
  CarePlanStatusBadge,
} from '@/components/care-plan/care-plan-section'
import {
  useDraftCarePlan,
  useCarePlan,
  useCarePlanActions,
  useRequireManager,
} from '@/lib/hooks'
import { useResident } from '@/lib/hooks/use-residents'
import { useToast } from '@/components/providers/toast-provider'
import type { CarePlanSection } from '@/lib/database.types'

export default function EditCarePlanPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { showToast } = useToast()
  const { isManager, isLoading: authLoading } = useRequireManager('/dashboard')
  const { resident, isLoading: residentLoading } = useResident(params.id)
  const { carePlan: draftCarePlan, isLoading: draftLoading, refetch: refetchDraft } = useDraftCarePlan(params.id)
  const { carePlan: activeCarePlan, isLoading: activeLoading } = useCarePlan(params.id)
  const {
    updateCarePlan,
    updateSections,
    publishCarePlan,
    createDraftCarePlan,
    isLoading: actionLoading,
  } = useCarePlanActions()

  // Form state
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [reviewDate, setReviewDate] = useState('')
  const [nextReviewDate, setNextReviewDate] = useState('')
  const [sectionContents, setSectionContents] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Determine which care plan to edit
  const carePlanToEdit = draftCarePlan || activeCarePlan
  const isEditingActive = !draftCarePlan && activeCarePlan
  const isLoading = authLoading || residentLoading || draftLoading || activeLoading

  // Initialize form from care plan
  useEffect(() => {
    if (carePlanToEdit) {
      setTitle(carePlanToEdit.title || '')
      setSummary(carePlanToEdit.summary || '')
      setReviewDate(carePlanToEdit.review_date ? carePlanToEdit.review_date.split('T')[0] : '')
      setNextReviewDate(carePlanToEdit.next_review_date ? carePlanToEdit.next_review_date.split('T')[0] : '')

      const contents: Record<string, string> = {}
      carePlanToEdit.sections?.forEach((section) => {
        contents[section.id] = section.content || ''
      })
      setSectionContents(contents)
      setHasChanges(false)
    }
  }, [carePlanToEdit])

  const handleSectionChange = useCallback((sectionId: string, content: string) => {
    setSectionContents((prev) => ({ ...prev, [sectionId]: content }))
    setHasChanges(true)
  }, [])

  const handleFieldChange = useCallback(() => {
    setHasChanges(true)
  }, [])

  const handleSave = async () => {
    if (!carePlanToEdit) return

    setIsSaving(true)

    try {
      // If editing an active plan, create a draft first
      if (isEditingActive) {
        const result = await createDraftCarePlan(params.id, {
          title,
          summary,
          review_date: reviewDate || undefined,
          next_review_date: nextReviewDate || undefined,
        })

        if (result.error) {
          showToast({ title: result.error, variant: 'error' })
          setIsSaving(false)
          return
        }

        // Refetch to get the new draft with sections
        await refetchDraft()

        showToast({
          title: 'New draft version created',
          description: 'Continue editing the draft, then publish when ready.',
          variant: 'success',
        })
        setIsSaving(false)
        return
      }

      // Update care plan details
      const updateResult = await updateCarePlan(carePlanToEdit.id, {
        title,
        summary: summary || null,
        review_date: reviewDate || null,
        next_review_date: nextReviewDate || null,
      })

      if (!updateResult.success) {
        showToast({ title: updateResult.error || 'Failed to save', variant: 'error' })
        setIsSaving(false)
        return
      }

      // Update sections
      const sectionUpdates = Object.entries(sectionContents).map(([id, content]) => ({
        id,
        content: content.trim() || null,
      }))

      const sectionsResult = await updateSections(carePlanToEdit.id, sectionUpdates)

      if (!sectionsResult.success) {
        showToast({ title: sectionsResult.error || 'Failed to save sections', variant: 'error' })
        setIsSaving(false)
        return
      }

      showToast({ title: 'Care plan saved', variant: 'success' })
      setHasChanges(false)
      await refetchDraft()
    } catch (err) {
      showToast({ title: 'Failed to save', variant: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!draftCarePlan) return

    // Save first if there are changes
    if (hasChanges) {
      await handleSave()
    }

    const result = await publishCarePlan(draftCarePlan.id)
    if (result.error) {
      showToast({ title: result.error, variant: 'error' })
    } else {
      showToast({ title: 'Care plan published', variant: 'success' })
      setShowPublishConfirm(false)
      router.push(`/dashboard/residents/${params.id}/care-plan`)
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
          You do not have permission to edit care plans.
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

  if (!carePlanToEdit) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <h2 className="text-lg font-semibold text-slate-900">No Care Plan to Edit</h2>
        <p className="mt-2 text-slate-500">Create a care plan first before editing.</p>
        <Link href={`/dashboard/residents/${params.id}/care-plan`} className="mt-4">
          <Button variant="secondary">Back to Care Plan</Button>
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
                Edit Care Plan
              </h1>
              <CarePlanStatusBadge status={carePlanToEdit.status} />
              <span className="text-sm text-slate-500">v{carePlanToEdit.version}</span>
              {hasChanges && (
                <span className="text-sm text-amber-600">• Unsaved changes</span>
              )}
            </div>
            <p className="mt-1 text-slate-600">
              {displayName} {resident.last_name}
              {resident.room_number && ` · Room ${resident.room_number}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleSave}
            disabled={isSaving || actionLoading}
            isLoading={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isEditingActive ? 'Create Draft' : 'Save Draft'}
          </Button>
          {draftCarePlan && (
            <Button
              onClick={() => setShowPublishConfirm(true)}
              disabled={actionLoading}
            >
              <Send className="mr-2 h-4 w-4" />
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Editing Active Warning */}
      {isEditingActive && (
        <Card className="border-amber-200 bg-amber-50" padding="md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900">
                Editing Active Care Plan
              </p>
              <p className="text-sm text-amber-700">
                Saving changes will create a new draft version. The current active version will remain
                visible to staff until you publish the draft.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Details */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Care Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    handleFieldChange()
                  }}
                  placeholder="Care Plan"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Summary
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => {
                    setSummary(e.target.value)
                    handleFieldChange()
                  }}
                  placeholder="Brief overview of the resident's care needs..."
                  className="min-h-[100px] w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Care Plan Sections</h2>
            {carePlanToEdit.sections?.map((section) => (
              <CarePlanSectionEdit
                key={section.id}
                section={section}
                value={sectionContents[section.id] || ''}
                onChange={(value) => handleSectionChange(section.id, value)}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Review Dates */}
          <Card padding="md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Review Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Last Review Date
                </label>
                <Input
                  type="date"
                  value={reviewDate}
                  onChange={(e) => {
                    setReviewDate(e.target.value)
                    handleFieldChange()
                  }}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Next Review Date
                </label>
                <Input
                  type="date"
                  value={nextReviewDate}
                  onChange={(e) => {
                    setNextReviewDate(e.target.value)
                    handleFieldChange()
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={handleSave}
                disabled={isSaving || actionLoading}
                isLoading={isSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                {isEditingActive ? 'Create Draft' : 'Save Draft'}
              </Button>
              {draftCarePlan && (
                <Button
                  fullWidth
                  onClick={() => setShowPublishConfirm(true)}
                  disabled={actionLoading}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Publish Care Plan
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Publish Confirmation Modal */}
      {showPublishConfirm && draftCarePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="mx-4 w-full max-w-md" padding="lg">
            <h3 className="text-lg font-semibold text-slate-900">Publish Care Plan?</h3>
            <p className="mt-2 text-slate-600">
              This will make version {draftCarePlan.version} the active care plan for {displayName}.
              {activeCarePlan && ' The current active plan will be archived.'}
            </p>
            {hasChanges && (
              <p className="mt-2 text-sm text-amber-600">
                You have unsaved changes. They will be saved before publishing.
              </p>
            )}
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
