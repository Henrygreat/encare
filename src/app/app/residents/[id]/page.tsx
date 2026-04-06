'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ClipboardList,
  FileText,
  BookOpen,
  AlertTriangle,
  Utensils,
  User,
} from 'lucide-react'
import { MobileHeader, PageContainer } from '@/components/layout/mobile-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Chip } from '@/components/ui/chip'
import { Timeline } from '@/components/ui/timeline'
import { QuickActionGrid } from '@/components/ui/quick-action-tile'
import { useResident } from '@/lib/hooks/use-residents'
import { useResidentTimeline } from '@/lib/hooks/use-logs'
import type { LogType } from '@/lib/database.types'

export default function ResidentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { resident, isLoading, error } = useResident(params.id)
  const { events, isLoading: timelineLoading } = useResidentTimeline(params.id, 10)
  const [showQuickLog, setShowQuickLog] = useState(false)

  const handleQuickLogSelect = (logType: LogType) => {
    router.push(`/app/residents/${params.id}/log/${logType}`)
  }

  // Loading state
  if (isLoading) {
    return (
      <PageContainer
        header={
          <MobileHeader
            title="Loading..."
            showBack
            backHref="/app/residents"
          />
        }
      >
        <div className="animate-pulse space-y-4 p-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-surface-200" />
            <div className="flex-1">
              <div className="h-5 w-40 bg-surface-200 rounded mb-2" />
              <div className="h-4 w-24 bg-surface-100 rounded" />
            </div>
          </div>
          <div className="h-32 bg-surface-100 rounded-2xl" />
          <div className="h-48 bg-surface-100 rounded-2xl" />
        </div>
      </PageContainer>
    )
  }

  // Error or not found state
  if (error || !resident) {
    return (
      <PageContainer
        header={
          <MobileHeader
            title="Resident"
            showBack
            backHref="/app/residents"
          />
        }
      >
        <div className="text-center py-12">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-gray-700 font-medium">
            {error ? 'Unable to load resident' : 'Resident not found'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {error ? 'Please try again later' : 'This resident may have been removed'}
          </p>
          <button
            onClick={() => router.push('/app/residents')}
            className="mt-4 text-primary-600 font-medium"
          >
            Back to residents
          </button>
        </div>
      </PageContainer>
    )
  }

  const riskFlags = (resident.risk_flags as Array<{ type: string; level: string; notes: string }>) || []

  return (
    <PageContainer
      header={
        <MobileHeader
          title={`${resident.preferred_name || resident.first_name} ${resident.last_name}`}
          subtitle={resident.room_number ? `Room ${resident.room_number}` : undefined}
          showBack
          backHref="/app/residents"
        />
      }
      noPadding
    >
      {/* Resident Header */}
      <div className="bg-white px-4 py-5 border-b border-surface-200">
        <div className="flex items-center gap-4">
          <Avatar
            src={resident.photo_url}
            name={`${resident.first_name} ${resident.last_name}`}
            size="xl"
          />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {resident.preferred_name || resident.first_name} {resident.last_name}
            </h1>
            {resident.room_number && (
              <p className="text-gray-500">Room {resident.room_number}</p>
            )}
            {riskFlags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {riskFlags.map((risk, i) => (
                  <Chip
                    key={i}
                    variant={risk.level === 'high' ? 'danger' : 'warning'}
                    size="sm"
                  >
                    {risk.type}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4">
        <div className="grid grid-cols-4 gap-3 mb-4">
          <QuickActionButton
            icon={<Utensils className="h-6 w-6" />}
            label="Log Care"
            onClick={() => setShowQuickLog(!showQuickLog)}
            primary
          />
          <QuickActionButton
            icon={<ClipboardList className="h-6 w-6" />}
            label="Tasks"
            onClick={() => router.push(`/app/residents/${params.id}/tasks`)}
          />
          <QuickActionButton
            icon={<FileText className="h-6 w-6" />}
            label="Notes"
            onClick={() => router.push(`/app/residents/${params.id}/notes`)}
          />
          <QuickActionButton
            icon={<BookOpen className="h-6 w-6" />}
            label="Care Plan"
            onClick={() => router.push(`/app/residents/${params.id}/care-plan`)}
          />
        </div>

        {/* Quick Log Expanded */}
        {showQuickLog && (
          <Card className="mb-4 animate-slide-up" padding="md">
            <CardHeader>
              <CardTitle>Quick Log</CardTitle>
              <button
                onClick={() => setShowQuickLog(false)}
                className="text-sm text-gray-500"
              >
                Close
              </button>
            </CardHeader>
            <CardContent>
              <QuickActionGrid onSelect={handleQuickLogSelect} />
            </CardContent>
          </Card>
        )}

        {/* Key Info */}
        {(resident.dietary_requirements || resident.mobility_notes || resident.communication_needs) && (
          <Card className="mb-4" padding="md">
            <CardHeader>
              <CardTitle>Key Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {resident.dietary_requirements && (
                <InfoRow label="Diet" value={resident.dietary_requirements} />
              )}
              {resident.mobility_notes && (
                <InfoRow label="Mobility" value={resident.mobility_notes} />
              )}
              {resident.communication_needs && (
                <InfoRow label="Communication" value={resident.communication_needs} />
              )}
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <Link
              href={`/app/residents/${params.id}/timeline`}
              className="text-sm text-primary-600 font-medium"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {timelineLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-surface-200" />
                    <div className="flex-1">
                      <div className="h-3 w-24 bg-surface-200 rounded mb-2" />
                      <div className="h-3 w-full bg-surface-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">No activity recorded yet</p>
              </div>
            ) : (
              <Timeline events={events} />
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}

function QuickActionButton({
  icon,
  label,
  onClick,
  primary = false,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center gap-1.5 p-3 rounded-card transition-all active:scale-95
        ${primary
          ? 'bg-primary-600 text-white'
          : 'bg-surface-100 text-gray-700 hover:bg-surface-200'
        }
      `}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-surface-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 font-medium text-right max-w-[60%]">{value}</span>
    </div>
  )
}
