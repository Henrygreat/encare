'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Clock,
  Users,
  CheckCircle,
  ChevronRight,
  PlayCircle
} from 'lucide-react'
import { MobileHeader, PageContainer } from '@/components/layout/mobile-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Avatar } from '@/components/ui/avatar'
import { SyncStatus } from '@/components/ui/sync-status'
import { TaskCard } from '@/components/ui/task-card'
import { cn, formatDate } from '@/lib/utils'
import type { Resident, Task } from '@/lib/database.types'

// Demo data for UI development
const DEMO_RESIDENTS: Array<Resident & { hasAlert?: boolean }> = [
  {
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
    emergency_contact: {},
    medical_info: {},
    dietary_requirements: 'Soft foods',
    mobility_notes: 'Wheelchair user',
    communication_needs: null,
    risk_flags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    hasAlert: true,
  },
  {
    id: '2',
    organisation_id: 'org1',
    first_name: 'Robert',
    last_name: 'Wilson',
    preferred_name: 'Bob',
    room_number: '105',
    photo_url: null,
    date_of_birth: '1938-07-22',
    admission_date: '2022-08-15',
    status: 'active',
    emergency_contact: {},
    medical_info: {},
    dietary_requirements: null,
    mobility_notes: 'Walking frame',
    communication_needs: 'Hard of hearing',
    risk_flags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    organisation_id: 'org1',
    first_name: 'Dorothy',
    last_name: 'Brown',
    preferred_name: null,
    room_number: '108',
    photo_url: null,
    date_of_birth: '1945-11-08',
    admission_date: '2023-06-20',
    status: 'active',
    emergency_contact: {},
    medical_info: {},
    dietary_requirements: 'Diabetic diet',
    mobility_notes: null,
    communication_needs: null,
    risk_flags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const DEMO_TASKS: Array<Task & { resident_name?: string }> = [
  {
    id: 't1',
    organisation_id: 'org1',
    resident_id: '1',
    assigned_to: 'user1',
    created_by: 'user1',
    title: 'Morning medication',
    description: 'Administer morning meds including blood pressure',
    task_type: 'medication',
    priority: 'high',
    status: 'pending',
    due_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago - overdue
    completed_at: null,
    completed_by: null,
    snoozed_until: null,
    snooze_reason: null,
    escalated_at: null,
    escalated_to: null,
    recurrence_rule: null,
    parent_task_id: null,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    resident_name: 'Maggie Thompson',
  },
  {
    id: 't2',
    organisation_id: 'org1',
    resident_id: '2',
    assigned_to: 'user1',
    created_by: 'user1',
    title: 'Assist with breakfast',
    description: null,
    task_type: 'meal',
    priority: 'medium',
    status: 'pending',
    due_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 mins from now
    completed_at: null,
    completed_by: null,
    snoozed_until: null,
    snooze_reason: null,
    escalated_at: null,
    escalated_to: null,
    recurrence_rule: null,
    parent_task_id: null,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    resident_name: 'Bob Wilson',
  },
]

export default function MyShiftPage() {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const overdueTasks = DEMO_TASKS.filter(
    t => t.status === 'pending' && new Date(t.due_at) < new Date()
  )
  const upcomingTasks = DEMO_TASKS.filter(
    t => t.status === 'pending' && new Date(t.due_at) >= new Date()
  )
  const residentsWithAlerts = DEMO_RESIDENTS.filter(r => r.hasAlert)

  return (
    <PageContainer
      header={
        <MobileHeader
          title="My Shift"
          subtitle={formatDate(currentTime)}
          rightAction={<SyncStatus />}
        />
      }
    >
      {/* Start Logging CTA */}
      <Card className="mb-4 bg-primary-600 border-none" padding="lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              Ready to log care?
            </h2>
            <p className="text-primary-100 text-sm">
              {DEMO_RESIDENTS.length} residents assigned today
            </p>
          </div>
          <Link href="/app/residents">
            <Button variant="secondary" size="lg" className="gap-2">
              <PlayCircle className="h-5 w-5" />
              Start
            </Button>
          </Link>
        </div>
      </Card>

      {/* Alerts Section */}
      {(overdueTasks.length > 0 || residentsWithAlerts.length > 0) && (
        <Card className="mb-4 border-care-red bg-red-50" padding="md">
          <CardHeader>
            <CardTitle className="text-care-red flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueTasks.length > 0 && (
                <Link
                  href="/app/tasks"
                  className="flex items-center justify-between p-3 bg-white rounded-button"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-care-red" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-gray-500">
                        {overdueTasks[0]?.title}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </Link>
              )}
              {residentsWithAlerts.map(resident => (
                <Link
                  key={resident.id}
                  href={`/app/residents/${resident.id}`}
                  className="flex items-center justify-between p-3 bg-white rounded-button"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={resident.photo_url}
                      name={`${resident.first_name} ${resident.last_name}`}
                      size="md"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {resident.preferred_name || resident.first_name} {resident.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        No meal logged today
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Due Tasks */}
      <Card className="mb-4" padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-600" />
            Due Now
          </CardTitle>
          <Link href="/app/tasks" className="text-primary-600 text-sm font-medium">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {upcomingTasks.length > 0 ? (
            <div className="space-y-3">
              {upcomingTasks.slice(0, 3).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => router.push(`/app/tasks/${task.id}`)}
                  onComplete={() => console.log('Complete task', task.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No tasks due right now
            </p>
          )}
        </CardContent>
      </Card>

      {/* Assigned Residents Quick Access */}
      <Card padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-600" />
            My Residents
          </CardTitle>
          <Link href="/app/residents" className="text-primary-600 text-sm font-medium">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {DEMO_RESIDENTS.map(resident => (
              <Link
                key={resident.id}
                href={`/app/residents/${resident.id}`}
                className="flex-shrink-0 flex flex-col items-center gap-2 w-20"
              >
                <div className="relative">
                  <Avatar
                    src={resident.photo_url}
                    name={`${resident.first_name} ${resident.last_name}`}
                    size="lg"
                  />
                  {resident.hasAlert && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-care-red rounded-full border-2 border-white" />
                  )}
                </div>
                <span className="text-sm text-center text-gray-700 truncate w-full">
                  {resident.preferred_name || resident.first_name}
                </span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <StatCard
          icon={<CheckCircle className="h-5 w-5 text-care-green" />}
          value="12"
          label="Logs today"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-care-amber" />}
          value={String(DEMO_TASKS.length)}
          label="Tasks left"
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-primary-600" />}
          value={String(DEMO_RESIDENTS.length)}
          label="Residents"
        />
      </div>
    </PageContainer>
  )
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <Card padding="sm" className="text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </Card>
  )
}
