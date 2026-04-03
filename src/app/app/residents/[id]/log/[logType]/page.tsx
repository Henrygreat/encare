'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Check, X } from 'lucide-react'
import { MobileHeader, PageContainer } from '@/components/layout/mobile-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LOG_TYPE_CONFIG, type LogTypeKey, generateOfflineId } from '@/lib/utils'
import { useOfflineStore } from '@/lib/stores/offline-store'
import type { LogType } from '@/lib/database.types'

// Preset configurations for each log type
const PRESETS: Record<LogType, { value: string; emoji?: string }[] | null> = {
  meal: [
    { value: 'All', emoji: '✓' },
    { value: 'Half', emoji: '½' },
    { value: 'Little', emoji: '¼' },
    { value: 'Refused', emoji: '✗' },
  ],
  drink: [
    { value: 'Full', emoji: '●' },
    { value: 'Half', emoji: '◐' },
    { value: 'Little', emoji: '○' },
    { value: 'Refused', emoji: '✗' },
  ],
  medication: [
    { value: 'Given', emoji: '✓' },
    { value: 'Refused', emoji: '✗' },
    { value: 'Not available', emoji: '!' },
    { value: 'N/A', emoji: '-' },
  ],
  toileting: [
    { value: 'Assisted', emoji: '👐' },
    { value: 'Independent', emoji: '✓' },
    { value: 'Refused', emoji: '✗' },
    { value: 'Issue', emoji: '!' },
  ],
  mood: [
    { value: 'Calm', emoji: '😌' },
    { value: 'Happy', emoji: '😊' },
    { value: 'Anxious', emoji: '😰' },
    { value: 'Upset', emoji: '😢' },
    { value: 'Other', emoji: '•' },
  ],
  personal_care: [
    { value: 'Wash', emoji: '🧼' },
    { value: 'Shower', emoji: '🚿' },
    { value: 'Dressing', emoji: '👕' },
    { value: 'Oral care', emoji: '🦷' },
  ],
  activity: [
    { value: 'Group activity', emoji: '👥' },
    { value: 'One-to-one', emoji: '👤' },
    { value: 'Walk', emoji: '🚶' },
    { value: 'Exercise', emoji: '💪' },
  ],
  observation: null,
  incident: [
    { value: 'Fall', emoji: '⚠️' },
    { value: 'Behaviour', emoji: '!' },
    { value: 'Medical', emoji: '🏥' },
    { value: 'Safeguarding', emoji: '🛡' },
  ],
  note: null,
}

export default function LogPage({
  params,
}: {
  params: { id: string; logType: string }
}) {
  const router = useRouter()
  const { addToQueue, isOnline } = useOfflineStore()
  const logType = params.logType as LogType
  const config = LOG_TYPE_CONFIG[logType as LogTypeKey]
  const presets = PRESETS[logType]

  const [selectedValue, setSelectedValue] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!selectedValue && !notes) return

    setIsSubmitting(true)

    const logData = {
      id: generateOfflineId(),
      organisation_id: 'org1', // Would come from auth context
      resident_id: params.id,
      logged_by: 'user1', // Would come from auth context
      log_type: logType,
      log_data: { value: selectedValue },
      notes: notes || null,
      logged_at: new Date().toISOString(),
      sync_status: isOnline ? 'synced' as const : 'pending' as const,
      offline_id: generateOfflineId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (!isOnline) {
      // Queue for offline sync
      addToQueue({
        ...logData,
        queued_at: Date.now(),
      } as any)
    } else {
      // In production, would call Supabase here
      // await supabase.from('daily_logs').insert(logData)
    }

    // Simulate success
    await new Promise(resolve => setTimeout(resolve, 300))
    setIsSubmitting(false)
    setShowSuccess(true)

    // Auto-navigate back after showing success
    setTimeout(() => {
      router.push(`/app/residents/${params.id}`)
    }, 800)
  }

  const handleCancel = () => {
    router.back()
  }

  if (showSuccess) {
    return (
      <PageContainer
        header={
          <MobileHeader
            title={config?.label || 'Log'}
            showBack
          />
        }
      >
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="h-20 w-20 rounded-full bg-care-green flex items-center justify-center mb-4 animate-scale-in">
            <Check className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Logged!</h2>
          <p className="text-gray-500 mt-1">
            {!isOnline && 'Will sync when online'}
          </p>
        </div>
        <style jsx>{`
          @keyframes scale-in {
            from { transform: scale(0); }
            to { transform: scale(1); }
          }
          .animate-scale-in {
            animation: scale-in 0.3s ease-out;
          }
        `}</style>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      header={
        <MobileHeader
          title={config?.label || 'Log'}
          subtitle="Select an option"
          showBack
          rightAction={
            <button
              onClick={handleCancel}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          }
        />
      }
      noPadding
    >
      <div className="p-4">
        {/* Preset Options */}
        {presets && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {presets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setSelectedValue(preset.value)}
                className={`
                  flex flex-col items-center justify-center p-6 rounded-card border-2 transition-all active:scale-95
                  ${selectedValue === preset.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-surface-200 bg-white hover:border-surface-300'
                  }
                `}
              >
                {preset.emoji && (
                  <span className="text-3xl mb-2">{preset.emoji}</span>
                )}
                <span className={`
                  text-lg font-medium
                  ${selectedValue === preset.value ? 'text-primary-700' : 'text-gray-900'}
                `}>
                  {preset.value}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Notes Field */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes..."
            rows={3}
            className="w-full rounded-button border border-surface-200 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Photo Attachment */}
        <button className="flex items-center gap-3 w-full p-4 rounded-card border-2 border-dashed border-surface-200 text-gray-500 hover:border-surface-300 hover:text-gray-700 transition-colors mb-6">
          <Camera className="h-6 w-6" />
          <span>Add photo (optional)</span>
        </button>

        {/* Submit */}
        <Button
          fullWidth
          size="tap"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          disabled={!selectedValue && !notes}
        >
          <Check className="h-5 w-5 mr-2" />
          Save Log
        </Button>

        {/* Offline indicator */}
        {!isOnline && (
          <p className="text-center text-sm text-amber-600 mt-3">
            You&apos;re offline. This will sync when you&apos;re back online.
          </p>
        )}
      </div>
    </PageContainer>
  )
}
