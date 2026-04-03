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
  Coffee,
  Pill
} from 'lucide-react'
import { MobileHeader, PageContainer } from '@/components/layout/mobile-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Chip } from '@/components/ui/chip'
import { Timeline } from '@/components/ui/timeline'
import { QuickActionGrid } from '@/components/ui/quick-action-tile'
import type { Resident, TimelineEvent, LogType } from '@/lib/database.types'

// Demo data
const DEMO_RESIDENT: Resident = {
  id: '1',
  organisation_id: 'org1',
  first_name: 'Margaret',
  last_name: 'Thompson',
  preferred_name: 'Maggie',
  room_number: '101',
  photo_url: null,
  date_of_birth: '1940-03-15',
  admission_date: '2023-01-10',
  status: 'active',
  emergency_contact: { name: 'John Thompson', phone: '07700 900123', relationship: 'Son' },
  medical_info: { conditions: ['Diabetes Type 2', 'Arthritis'] },
  dietary_requirements: 'Soft foods, diabetic diet',
  mobility_notes: 'Wheelchair user, requires 2 staff for transfers',
  communication_needs: null,
  risk_flags: [
    { type: 'falls', level: 'high', notes: 'History of falls' },
    { type: 'choking', level: 'medium', notes: 'Requires soft foods' }
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const DEMO_TIMELINE: Array<TimelineEvent & { user_name?: string }> = [
  {
    id: 'e1',
    resident_id: '1',
    event_type: 'log',
    sub_type: 'medication',
    data: { value: 'Given', medication: 'Metformin 500mg' },
    notes: null,
    user_id: 'u1',
    occurred_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user_name: 'Sarah J.',
  },
  {
    id: 'e2',
    resident_id: '1',
    event_type: 'log',
    sub_type: 'meal',
    data: { value: 'Half', meal_type: 'Breakfast' },
    notes: 'Ate porridge but refused toast',
    user_id: 'u1',
    occurred_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    user_name: 'Sarah J.',
  },
  {
    id: 'e3',
    resident_id: '1',
    event_type: 'log',
    sub_type: 'mood',
    data: { value: 'Calm' },
    notes: 'Settled well after breakfast',
    user_id: 'u2',
    occurred_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    user_name: 'Mike T.',
  },
  {
    id: 'e4',
    resident_id: '1',
    event_type: 'log',
    sub_type: 'personal_care',
    data: { value: 'Wash' },
    notes: 'Morning wash completed with assistance',
    user_id: 'u2',
    occurred_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    user_name: 'Mike T.',
  },
]

export default function ResidentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [showQuickLog, setShowQuickLog] = useState(false)
  const resident = DEMO_RESIDENT

  const handleQuickLogSelect = (logType: LogType) => {
    router.push(`/app/residents/${params.id}/log/${logType}`)
  }

  const riskFlags = resident.risk_flags as Array<{ type: string; level: string; notes: string }> || []

  return (
    <PageContainer
      header={
        <MobileHeader
          title={`${resident.preferred_name || resident.first_name} ${resident.last_name}`}
          subtitle={`Room ${resident.room_number}`}
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
            <p className="text-gray-500">Room {resident.room_number}</p>
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
            <Timeline events={DEMO_TIMELINE} />
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
