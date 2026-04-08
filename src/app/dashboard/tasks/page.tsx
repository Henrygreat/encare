'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle, Clock, Pencil, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth, useRequireManager } from '@/lib/hooks/use-auth'
import { useToast } from '@/components/providers/toast-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import type { Task } from '@/lib/database.types'

type TaskWithResident = Task & {
  resident_name?: string
}

export default function DashboardTasksPage() {
  const router = useRouter()
  const supabase = createClient()
  const { organisation, isLoading: authLoading, user } = useAuth()
  const { isManager, isLoading: managerLoading } = useRequireManager('/dashboard')
  const { showToast } = useToast()

  const [tasks, setTasks] = useState<TaskWithResident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [actingTaskId, setActingTaskId] = useState<string | null>(null)

  const loadTasks = async () => {
    if (!organisation?.id) return

    setIsLoading(true)
    setError('')

    try {
      const { data, error: queryError } = await supabase
        .from('tasks')
        .select(
          `
          *,
          residents (
            first_name,
            last_name,
            preferred_name
          )
        `,
        )
        .eq('organisation_id', organisation.id)
        .order('due_at', { ascending: true })

      if (queryError) throw queryError

      const mapped: TaskWithResident[] = (data || []).map((task: any) => {
        const resident = Array.isArray(task.residents) ? task.residents[0] : task.residents
        const residentName = resident
          ? `${resident.preferred_name || resident.first_name} ${resident.last_name}`
          : undefined

        return {
          ...task,
          resident_name: residentName,
        }
      })

      setTasks(mapped)
    } catch (err) {
      console.error('Failed to load manager tasks:', err)
      setError('Unable to load task oversight.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && organisation?.id) {
      void loadTasks()
    }
  }, [authLoading, organisation?.id])

  const now = new Date()

  const overdueTasks = useMemo(
    () => tasks.filter((task) => task.status === 'pending' && new Date(task.due_at).getTime() < now.getTime()),
    [now, tasks],
  )

  const pendingTasks = useMemo(() => tasks.filter((task) => task.status === 'pending'), [tasks])

  const completedToday = useMemo(
    () =>
      tasks.filter((task) => {
        if (task.status !== 'completed' || !task.completed_at) return false
        return new Date(task.completed_at).toDateString() === now.toDateString()
      }),
    [now, tasks],
  )

  const snoozedTasks = useMemo(() => tasks.filter((task) => task.status === 'snoozed'), [tasks])

  const markDone = async (task: Task) => {
    if (!user?.id || !organisation?.id) return

    setActingTaskId(task.id)

    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)
        .eq('organisation_id', organisation.id)

      if (updateError) throw updateError

      showToast({ title: 'Task marked as complete', variant: 'success' })
      await loadTasks()
    } catch (err) {
      console.error('Failed to complete task:', err)
      showToast({
        title: 'Unable to complete task',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      })
    } finally {
      setActingTaskId(null)
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!organisation?.id) return
    if (!window.confirm('Delete this task? This action cannot be undone.')) return

    const previousTasks = tasks
    setDeletingTaskId(taskId)
    setTasks((current) => current.filter((task) => task.id !== taskId))

    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('organisation_id', organisation.id)

      if (deleteError) throw deleteError

      showToast({ title: 'Task deleted', variant: 'success' })
    } catch (err) {
      console.error('Failed to delete task:', err)
      setTasks(previousTasks)
      showToast({
        title: 'Unable to delete task',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      })
    } finally {
      setDeletingTaskId(null)
    }
  }

  const getStatusVariant = (status: Task['status']) => {
    if (status === 'completed') return 'success'
    if (status === 'snoozed') return 'warning'
    if (status === 'escalated') return 'danger'
    return 'default'
  }

  const getPriorityVariant = (priority: Task['priority']) => {
    if (priority === 'urgent' || priority === 'high') return 'danger'
    if (priority === 'medium') return 'warning'
    return 'default'
  }

  if (authLoading || managerLoading) {
    return <div className="py-12 text-center text-sm text-slate-500">Loading task workspace…</div>
  }

  if (!isManager) {
    return <div className="py-12 text-center text-sm text-slate-500">You do not have permission to manage tasks.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="mt-1 text-sm text-slate-600">
            Review every task, update urgent work, and manage changes for your organisation.
          </p>
        </div>
        <Link href="/dashboard/tasks/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add task
          </Button>
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Overdue" value={overdueTasks.length} tone="danger" icon={<AlertTriangle className="h-5 w-5" />} />
        <SummaryCard title="Pending" value={pendingTasks.length} tone="default" icon={<Clock className="h-5 w-5" />} />
        <SummaryCard title="Completed today" value={completedToday.length} tone="success" icon={<CheckCircle className="h-5 w-5" />} />
        <SummaryCard title="Snoozed" value={snoozedTasks.length} tone="warning" icon={<Clock className="h-5 w-5" />} />
      </div>

      <Card padding="md">
        <CardHeader>
          <CardTitle>All tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-sm text-slate-500">Loading tasks…</div>
          ) : tasks.length === 0 ? (
            <div className="py-8 text-sm text-slate-500">No tasks have been created yet.</div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900 transition hover:text-primary-700">{task.title}</h3>
                        <Chip size="sm" variant={getStatusVariant(task.status)}>{task.status}</Chip>
                        <Chip size="sm" variant={getPriorityVariant(task.priority)}>{task.priority}</Chip>
                      </div>
                      {task.description ? <p className="mt-2 text-sm text-slate-600">{task.description}</p> : null}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        {task.resident_name ? <Chip size="sm">{task.resident_name}</Chip> : null}
                        <Chip size="sm">Due {new Date(task.due_at).toLocaleString()}</Chip>
                      </div>
                    </button>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {task.status !== 'completed' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          isLoading={actingTaskId === task.id}
                          onClick={() => void markDone(task)}
                        >
                          Mark done
                        </Button>
                      ) : null}
                      <Link href={`/dashboard/tasks/${task.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={deletingTaskId === task.id}
                        onClick={() => void handleDelete(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  icon,
  tone = 'default',
}: {
  title: string
  value: number
  icon: React.ReactNode
  tone?: 'default' | 'danger' | 'warning' | 'success'
}) {
  const toneClasses =
    tone === 'danger'
      ? 'border-red-200 bg-red-50 text-red-700'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : tone === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-white text-slate-700'

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="rounded-full bg-white/70 p-2">{icon}</div>
      </div>
    </div>
  )
}
