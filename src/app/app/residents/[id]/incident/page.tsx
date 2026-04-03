'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Check, Clock, MapPin, Users, Camera } from 'lucide-react'
import { MobileHeader, PageContainer } from '@/components/layout/mobile-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Chip } from '@/components/ui/chip'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth-store'
import type { IncidentSeverity } from '@/lib/database.types'

const INCIDENT_TYPES = [
  { value: 'fall', label: 'Fall', icon: '⚠️' },
  { value: 'behaviour', label: 'Behaviour', icon: '!' },
  { value: 'medical', label: 'Medical', icon: '🏥' },
  { value: 'medication_error', label: 'Medication Error', icon: '💊' },
  { value: 'safeguarding', label: 'Safeguarding', icon: '🛡' },
  { value: 'property', label: 'Property Damage', icon: '🔧' },
  { value: 'other', label: 'Other', icon: '•' },
]

const SEVERITY_OPTIONS: { value: IncidentSeverity; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200' },
]

export default function IncidentReportPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuthStore()

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Form state
  const [incidentType, setIncidentType] = useState<string>('')
  const [severity, setSeverity] = useState<IncidentSeverity>('low')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [occurredAt, setOccurredAt] = useState(() => {
    const now = new Date()
    return now.toISOString().slice(0, 16) // Format for datetime-local input
  })
  const [witnesses, setWitnesses] = useState('')
  const [immediateAction, setImmediateAction] = useState('')
  const [followUpRequired, setFollowUpRequired] = useState(false)

  const canProceed = () => {
    if (step === 1) return incidentType !== ''
    if (step === 2) return description.trim().length >= 10
    return true
  }

  const handleSubmit = async () => {
    if (!user) return

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from('incidents').insert({
        organisation_id: user.organisation_id,
        resident_id: params.id,
        reported_by: user.id,
        incident_type: incidentType,
        severity,
        description,
        location: location || null,
        occurred_at: new Date(occurredAt).toISOString(),
        witnesses: witnesses ? witnesses.split(',').map(w => w.trim()) : [],
        immediate_action: immediateAction || null,
        follow_up_required: followUpRequired,
      })

      if (error) throw error

      setShowSuccess(true)
      setTimeout(() => {
        router.push(`/app/residents/${params.id}`)
      }, 1500)
    } catch (err) {
      console.error('Failed to submit incident:', err)
      alert('Failed to submit incident. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showSuccess) {
    return (
      <PageContainer
        header={<MobileHeader title="Report Incident" showBack />}
      >
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="h-20 w-20 rounded-full bg-care-green flex items-center justify-center mb-4">
            <Check className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Incident Reported</h2>
          <p className="text-gray-500 mt-1">
            Manager will be notified
          </p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      header={
        <MobileHeader
          title="Report Incident"
          subtitle={`Step ${step} of 3`}
          showBack
          backHref={`/app/residents/${params.id}`}
        />
      }
    >
      {/* Progress Indicator */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              s <= step ? 'bg-primary-600' : 'bg-surface-200'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Incident Type & Severity */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              What type of incident?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {INCIDENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setIncidentType(type.value)}
                  className={`
                    flex flex-col items-center justify-center p-4 rounded-card border-2 transition-all
                    ${incidentType === type.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-surface-200 bg-white'
                    }
                  `}
                >
                  <span className="text-2xl mb-1">{type.icon}</span>
                  <span className={`text-sm font-medium ${
                    incidentType === type.value ? 'text-primary-700' : 'text-gray-700'
                  }`}>
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Severity level
            </h2>
            <div className="flex gap-2">
              {SEVERITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSeverity(option.value)}
                  className={`
                    flex-1 py-3 px-2 rounded-button border-2 text-sm font-medium transition-all
                    ${severity === option.value
                      ? option.color + ' border-current'
                      : 'bg-white border-surface-200 text-gray-600'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Description */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Describe what happened
            </h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of the incident..."
              rows={5}
              className="w-full rounded-card border border-surface-200 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 10 characters ({description.length}/10)
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4" />
              When did it happen?
            </label>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="w-full rounded-button border border-surface-200 bg-white px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4" />
              Location (optional)
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Room 101, Dining room, Garden"
            />
          </div>
        </div>
      )}

      {/* Step 3: Additional Info */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Additional Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Users className="h-4 w-4" />
                  Witnesses (optional)
                </label>
                <Input
                  value={witnesses}
                  onChange={(e) => setWitnesses(e.target.value)}
                  placeholder="Names separated by commas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Immediate action taken (optional)
                </label>
                <textarea
                  value={immediateAction}
                  onChange={(e) => setImmediateAction(e.target.value)}
                  placeholder="What did you do immediately after the incident?"
                  rows={3}
                  className="w-full rounded-button border border-surface-200 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              <label className="flex items-center gap-3 p-4 rounded-card bg-surface-50">
                <input
                  type="checkbox"
                  checked={followUpRequired}
                  onChange={(e) => setFollowUpRequired(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Follow-up required</span>
                  <p className="text-sm text-gray-500">Manager will be alerted for review</p>
                </div>
              </label>

              {/* Photo attachment placeholder */}
              <button className="flex items-center gap-3 w-full p-4 rounded-card border-2 border-dashed border-surface-200 text-gray-500 hover:border-surface-300 hover:text-gray-700 transition-colors">
                <Camera className="h-6 w-6" />
                <span>Add photos (optional)</span>
              </button>
            </div>
          </div>

          {/* Summary */}
          <Card className="bg-amber-50 border-amber-200" padding="md">
            <CardHeader>
              <CardTitle className="text-amber-700 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{INCIDENT_TYPES.find(t => t.value === incidentType)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Severity:</span>
                <Chip
                  variant={severity === 'critical' || severity === 'high' ? 'danger' : severity === 'medium' ? 'warning' : 'success'}
                  size="sm"
                >
                  {severity}
                </Chip>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">{new Date(occurredAt).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-surface-200">
        <div className="flex gap-3">
          {step > 1 && (
            <Button
              variant="secondary"
              size="tap"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              Back
            </Button>
          )}

          {step < 3 ? (
            <Button
              variant="primary"
              size="tap"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1"
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="danger"
              size="tap"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              className="flex-1"
            >
              <AlertTriangle className="h-5 w-5 mr-2" />
              Submit Incident Report
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
