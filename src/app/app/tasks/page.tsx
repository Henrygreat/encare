'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle, AlertTriangle, Filter } from 'lucide-react'
import { MobileHeader, PageContainer } from '@/components/layout/mobile-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { TaskList } from '@/components/ui/task-card'
import { Chip } from '@/components/ui/chip'
import type { Task } from '@/lib/database.types'

// Demo data
const DEMO_TASKS: Array<Task & { resident_name?: string }> = [
  {
    id: 't1',
    organisation_id: 'org1',
    resident_id: '1',
    assigned_to: 'user1',
    created_by: 'user1',
    title: 'Morning medication - Maggie',
    description: 'Administer morning meds including blood pressure medication',
    task_type: 'medication',
    priority: 'high',
    status: 'pending',
    due_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
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
    title: 'Assist with breakfast - Bob',
    description: 'Help with eating, ensure soft foods only',
    task_type: 'meal',
    priority: 'medium',
    status: 'pending',
    due_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
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
  {
    id: 't3',
    organisation_id: 'org1',
    resident_id: '3',
    assigned_to: 'user1',
    created_by: 'user1',
    title: 'Personal care - Dorothy',
    description: 'Morning wash and dressing assistance',
    task_type: 'personal_care',
    priority: 'medium',
    status: 'pending',
    due_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
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
    resident_name: 'Dorothy Brown',
  },
  {
    id: 't4',
    organisation_id: 'org1',
    resident_id: '1',
    assigned_to: 'user1',
    created_by: 'user1',
    title: 'Blood sugar check - Maggie',
    description: null,
    task_type: 'observation',
    priority: 'high',
    status: 'completed',
    due_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completed_by: 'user1',
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
    id: 't5',
    organisation_id: 'org1',
    resident_id: '2',
    assigned_to: 'user1',
    created_by: 'user1',
    title: 'Hearing aid check - Bob',
    description: null,
    task_type: 'personal_care',
    priority: 'low',
    status: 'snoozed',
    due_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    completed_at: null,
    completed_by: null,
    snoozed_until: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    snooze_reason: 'Resident asleep',
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

type TabType = 'due' | 'completed' | 'snoozed'

export default function TasksPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('due')

  const now = new Date()

  const overdueTasks = useMemo(() =>
    DEMO_TASKS.filter(t =>
      t.status === 'pending' && new Date(t.due_at) < now
    ).sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime()),
    []
  )

  const upcomingTasks = useMemo(() =>
    DEMO_TASKS.filter(t =>
      t.status === 'pending' && new Date(t.due_at) >= now
    ).sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime()),
    []
  )

  const completedTasks = useMemo(() =>
    DEMO_TASKS.filter(t => t.status === 'completed')
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()),
    []
  )

  const snoozedTasks = useMemo(() =>
    DEMO_TASKS.filter(t => t.status === 'snoozed'),
    []
  )

  const handleComplete = (task: Task) => {
    console.log('Complete task:', task.id)
    // Would update task status in Supabase
  }

  const handleSnooze = (task: Task) => {
    console.log('Snooze task:', task.id)
    // Would show snooze dialog
  }

  const handleEscalate = (task: Task) => {
    console.log('Escalate task:', task.id)
    // Would show escalation dialog
  }

  return (
    <PageContainer
      header={<MobileHeader title="Tasks" />}
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        <TabButton
          active={activeTab === 'due'}
          onClick={() => setActiveTab('due')}
          icon={<Clock className="h-4 w-4" />}
          count={overdueTasks.length + upcomingTasks.length}
          alert={overdueTasks.length > 0}
        >
          Due
        </TabButton>
        <TabButton
          active={activeTab === 'completed'}
          onClick={() => setActiveTab('completed')}
          icon={<CheckCircle className="h-4 w-4" />}
          count={completedTasks.length}
        >
          Done
        </TabButton>
        <TabButton
          active={activeTab === 'snoozed'}
          onClick={() => setActiveTab('snoozed')}
          icon={<Clock className="h-4 w-4" />}
          count={snoozedTasks.length}
        >
          Snoozed
        </TabButton>
      </div>

      {/* Task Lists */}
      {activeTab === 'due' && (
        <div className="space-y-4">
          {/* Overdue Section */}
          {overdueTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-care-red" />
                <h3 className="font-semibold text-care-red">
                  Overdue ({overdueTasks.length})
                </h3>
              </div>
              <TaskList
                tasks={overdueTasks}
                onTaskClick={(task) => router.push(`/app/tasks/${task.id}`)}
                onComplete={handleComplete}
                onSnooze={handleSnooze}
                onEscalate={handleEscalate}
              />
            </div>
          )}

          {/* Upcoming Section */}
          {upcomingTasks.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                Coming Up ({upcomingTasks.length})
              </h3>
              <TaskList
                tasks={upcomingTasks}
                onTaskClick={(task) => router.push(`/app/tasks/${task.id}`)}
                onComplete={handleComplete}
                onSnooze={handleSnooze}
              />
            </div>
          )}

          {overdueTasks.length === 0 && upcomingTasks.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-care-green" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm">No pending tasks</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'completed' && (
        <TaskList
          tasks={completedTasks}
          onTaskClick={(task) => router.push(`/app/tasks/${task.id}`)}
          emptyMessage="No completed tasks today"
        />
      )}

      {activeTab === 'snoozed' && (
        <TaskList
          tasks={snoozedTasks}
          onTaskClick={(task) => router.push(`/app/tasks/${task.id}`)}
          emptyMessage="No snoozed tasks"
        />
      )}
    </PageContainer>
  )
}

function TabButton({
  children,
  active,
  onClick,
  icon,
  count,
  alert,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  count?: number
  alert?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0
        ${active
          ? alert
            ? 'bg-care-red text-white'
            : 'bg-primary-600 text-white'
          : 'bg-surface-100 text-gray-700 hover:bg-surface-200'
        }
      `}
    >
      {icon}
      {children}
      {count !== undefined && count > 0 && (
        <span className={`
          px-1.5 py-0.5 rounded-full text-xs
          ${active ? 'bg-white/20' : 'bg-surface-200'}
        `}>
          {count}
        </span>
      )}
    </button>
  )
}
