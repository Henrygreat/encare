'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Check,
  ChevronRight,
  Clock,
  Users,
  AlertTriangle,
  Edit3,
  Eye
} from 'lucide-react'
import { MobileHeader, PageContainer } from '@/components/layout/mobile-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Avatar } from '@/components/ui/avatar'
import { formatDate, formatTime } from '@/lib/utils'

// Demo data
const DEMO_HANDOVER = {
  id: 'h1',
  shift_date: new Date().toISOString().split('T')[0],
  shift_type: 'morning',
  created_by: 'Sarah Johnson',
  finalized_at: null,
  auto_summary: {
    total_logs: 24,
    residents_logged: 6,
    incidents: 0,
    tasks_completed: 8,
    tasks_pending: 3,
  },
  priority_items: [
    { type: 'observation', text: 'Maggie Thompson - reduced appetite at breakfast, monitor at lunch', resident_id: '1' },
    { type: 'task', text: 'Bob Wilson - hearing aid battery needs replacing', resident_id: '2' },
  ],
  manual_notes: '',
  read_by: [
    { user_id: 'u2', name: 'Mike Taylor', read_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  ],
}

const PREVIOUS_HANDOVERS = [
  {
    id: 'h0',
    shift_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    shift_type: 'night',
    created_by: 'Emma Wilson',
    finalized_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    summary: '6 residents, all settled. No incidents.',
    read: true,
  },
  {
    id: 'h-1',
    shift_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    shift_type: 'afternoon',
    created_by: 'James Brown',
    finalized_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    summary: 'Dorothy had a good day. Bob\u2019s family visited.',
    read: true,
  },
]

export default function HandoverPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'current' | 'previous'>('current')
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState(DEMO_HANDOVER.manual_notes)

  const isSeniorStaff = true // Would come from auth context

  return (
    <PageContainer
      header={<MobileHeader title="Handover" />}
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('current')}
          className={`
            flex-1 py-3 rounded-button font-medium transition-colors
            ${activeTab === 'current'
              ? 'bg-primary-600 text-white'
              : 'bg-surface-100 text-gray-700'
            }
          `}
        >
          Current Shift
        </button>
        <button
          onClick={() => setActiveTab('previous')}
          className={`
            flex-1 py-3 rounded-button font-medium transition-colors
            ${activeTab === 'previous'
              ? 'bg-primary-600 text-white'
              : 'bg-surface-100 text-gray-700'
            }
          `}
        >
          Previous
        </button>
      </div>

      {activeTab === 'current' && (
        <>
          {/* Shift Summary */}
          <Card className="mb-4" padding="md">
            <CardHeader>
              <CardTitle>Shift Summary</CardTitle>
              <Chip variant="primary" size="sm">
                {DEMO_HANDOVER.shift_type}
              </Chip>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <StatItem
                  icon={<FileText className="h-5 w-5 text-primary-600" />}
                  value={DEMO_HANDOVER.auto_summary.total_logs}
                  label="Logs"
                />
                <StatItem
                  icon={<Users className="h-5 w-5 text-primary-600" />}
                  value={DEMO_HANDOVER.auto_summary.residents_logged}
                  label="Residents"
                />
                <StatItem
                  icon={<Check className="h-5 w-5 text-care-green" />}
                  value={DEMO_HANDOVER.auto_summary.tasks_completed}
                  label="Tasks done"
                />
                <StatItem
                  icon={<Clock className="h-5 w-5 text-care-amber" />}
                  value={DEMO_HANDOVER.auto_summary.tasks_pending}
                  label="Tasks pending"
                />
              </div>
              {DEMO_HANDOVER.auto_summary.incidents > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-button flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-care-red" />
                  <span className="text-care-red font-medium">
                    {DEMO_HANDOVER.auto_summary.incidents} incident(s) reported
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Priority Items */}
          {DEMO_HANDOVER.priority_items.length > 0 && (
            <Card className="mb-4 border-amber-200 bg-amber-50" padding="md">
              <CardHeader>
                <CardTitle className="text-amber-700 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Priority Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {DEMO_HANDOVER.priority_items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-button flex items-start gap-3"
                    >
                      <div className="h-2 w-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                      <p className="text-gray-700">{item.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual Notes */}
          <Card className="mb-4" padding="md">
            <CardHeader>
              <CardTitle>Handover Notes</CardTitle>
              {isSeniorStaff && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-primary-600"
                >
                  <Edit3 className="h-5 w-5" />
                </button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes for the next shift..."
                    rows={4}
                    className="w-full rounded-button border border-surface-200 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      Save
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setNotes(DEMO_HANDOVER.manual_notes)
                        setIsEditing(false)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">
                  {notes || 'No additional notes. Tap edit to add.'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Read By */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Read By</CardTitle>
            </CardHeader>
            <CardContent>
              {DEMO_HANDOVER.read_by.length > 0 ? (
                <div className="space-y-2">
                  {DEMO_HANDOVER.read_by.map((reader) => (
                    <div
                      key={reader.user_id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={reader.name} size="sm" />
                        <span className="text-gray-700">{reader.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatTime(reader.read_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  Not yet read by anyone
                </p>
              )}
            </CardContent>
          </Card>

          {/* Mark as Read Button */}
          <div className="mt-4">
            <Button fullWidth size="tap" variant="success">
              <Check className="h-5 w-5 mr-2" />
              Mark as Read
            </Button>
          </div>
        </>
      )}

      {activeTab === 'previous' && (
        <div className="space-y-3">
          {PREVIOUS_HANDOVERS.map((handover) => (
            <Card
              key={handover.id}
              padding="md"
              className="cursor-pointer hover:shadow-card-hover transition-shadow"
              onClick={() => router.push(`/app/handover/${handover.id}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {formatDate(handover.shift_date)}
                    </span>
                    <Chip variant="default" size="sm">
                      {handover.shift_type}
                    </Chip>
                    {handover.read && (
                      <Check className="h-4 w-4 text-care-green" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {handover.summary}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    by {handover.created_by}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  )
}

function StatItem({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}
