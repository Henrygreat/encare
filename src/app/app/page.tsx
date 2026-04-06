'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { Avatar } from '@/components/ui/avatar'
import { SyncStatus } from '@/components/ui/sync-status'
import { TaskCard } from '@/components/ui/task-card'
import { formatDate } from '@/lib/utils'
import { useResidents, type ResidentWithStatus } from '@/lib/hooks/use-residents'
import { useTodayLogs } from '@/lib/hooks/use-logs'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import type { Task } from '@/lib/database.types'

type TaskWithResident = Task & { resident_name?: string }

export default function MyShiftPage() {
  const router = useRouter()
  const { user, organisation, isLoading: authLoading } = useAuth()
  const { residents, isLoading: residentsLoading } = useResidents()
  const { logs, isLoading: logsLoading } = useTodayLogs()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [tasks, setTasks] = useState<TaskWithResident[]>([])
  const [tasksLoading, setTasksLoading] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Load tasks
  useEffect(() => {
    async function loadTasks() {
      if (!organisation?.id || !user?.id) return

      setTasksLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            residents (
              first_name,
              last_name,
              preferred_name
            )
          `)
          .eq('organisation_id', organisation.id)
          .in('status', ['pending', 'snoozed'])
          .order('due_at', { ascending: true })
          .limit(20)

        if (error) throw error

        const mapped: TaskWithResident[] = (data || []).map((task: any) => {
          const resident = Array.isArray(task.residents) ? task.residents[0] : task.residents
          const residentName = resident
            ? `${resident.preferred_name || resident.first_name} ${resident.last_name}`
            : undefined
          return { ...task, resident_name: residentName }
        })

        setTasks(mapped)
      } catch (err) {
        console.error('Failed to load tasks:', err)
      } finally {
        setTasksLoading(false)
      }
    }

    if (!authLoading && organisation?.id) {
      loadTasks()
    }
  }, [authLoading, organisation?.id, user?.id])

  const now = new Date()

  const overdueTasks = useMemo(
    () => tasks.filter(t => t.status === 'pending' && t.due_at && new Date(t.due_at) < now),
    [tasks]
  )

  const upcomingTasks = useMemo(
    () => tasks.filter(t => t.status === 'pending' && t.due_at && new Date(t.due_at) >= now),
    [tasks]
  )

  const residentsWithAlerts = useMemo(
    () => residents.filter(r => r.statuses && r.statuses.length > 0),
    [residents]
  )

  const assignedResidents = useMemo(
    () => residents.filter(r => r.isAssigned),
    [residents]
  )

  // Residents to show (assigned first, or all if none assigned)
  const displayResidents = assignedResidents.length > 0 ? assignedResidents : residents.slice(0, 6)

  const handleCompleteTask = async (task: Task) => {
    if (!user?.id) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)

      if (error) throw error

      // Refresh tasks
      setTasks(prev => prev.filter(t => t.id !== task.id))
    } catch (err) {
      console.error('Failed to complete task:', err)
      alert('Failed to complete task')
    }
  }

  const isLoading = authLoading || residentsLoading || tasksLoading

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
              {isLoading ? 'Loading...' : `${displayResidents.length} residents ${assignedResidents.length > 0 ? 'assigned' : 'available'}`}
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
      {!isLoading && (overdueTasks.length > 0 || residentsWithAlerts.length > 0) && (
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
              {residentsWithAlerts.slice(0, 3).map(resident => (
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
                        {resident.statuses?.[0]?.label || 'Needs attention'}
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
          {tasksLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border border-surface-200 p-3">
                  <div className="h-4 w-32 bg-surface-200 rounded mb-2" />
                  <div className="h-3 w-full bg-surface-100 rounded" />
                </div>
              ))}
            </div>
          ) : upcomingTasks.length > 0 ? (
            <div className="space-y-3">
              {upcomingTasks.slice(0, 3).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => router.push(`/app/tasks/${task.id}`)}
                  onComplete={() => handleCompleteTask(task)}
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
            {assignedResidents.length > 0 ? 'My Residents' : 'Residents'}
          </CardTitle>
          <Link href="/app/residents" className="text-primary-600 text-sm font-medium">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {residentsLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2 w-20">
                  <div className="h-12 w-12 rounded-full bg-surface-200 animate-pulse" />
                  <div className="h-3 w-16 bg-surface-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : displayResidents.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {displayResidents.map(resident => (
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
                    {resident.statuses && resident.statuses.length > 0 && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-care-red rounded-full border-2 border-white" />
                    )}
                  </div>
                  <span className="text-sm text-center text-gray-700 truncate w-full">
                    {resident.preferred_name || resident.first_name}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No residents yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <StatCard
          icon={<CheckCircle className="h-5 w-5 text-care-green" />}
          value={logsLoading ? '-' : String(logs.length)}
          label="Logs today"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-care-amber" />}
          value={tasksLoading ? '-' : String(tasks.filter(t => t.status === 'pending').length)}
          label="Tasks left"
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-primary-600" />}
          value={residentsLoading ? '-' : String(residents.length)}
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
