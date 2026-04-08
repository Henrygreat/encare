'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth, useRequireManager } from '@/lib/hooks/use-auth'
import { useToast } from '@/components/providers/toast-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import type { Task } from '@/lib/database.types'

type TaskWithResident = Task & { resident_name?: string }

export default function DashboardTaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { organisation, isLoading: authLoading } = useAuth()
  const { isManager, isLoading: managerLoading } = useRequireManager('/dashboard')
  const { showToast } = useToast()

  const taskId = Array.isArray(params.id) ? params.id[0] : params.id
  const [task, setTask] = useState<TaskWithResident | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function fetchTask() {
      if (!organisation?.id || !taskId) return

      setIsLoading(true)
      const { data, error } = await supabase
        .from('tasks')
        .select('*, residents(first_name, last_name, preferred_name)')
        .eq('id', taskId)
        .eq('organisation_id', organisation.id)
        .maybeSingle()

      if (error) {
        showToast({ title: 'Unable to load task', description: error.message, variant: 'error' })
        setIsLoading(false)
        return
      }

      if (!data) {
        setTask(null)
        setIsLoading(false)
        return
      }

      const resident = Array.isArray((data as any).residents) ? (data as any).residents[0] : (data as any).residents
      setTask({
        ...(data as Task),
        resident_name: resident ? `${resident.preferred_name || resident.first_name} ${resident.last_name}` : undefined,
      })
      setIsLoading(false)
    }

    if (!authLoading) {
      void fetchTask()
    }
  }, [authLoading, organisation?.id, showToast, supabase, taskId])

  const handleDelete = async () => {
    if (!organisation?.id || !taskId || !window.confirm('Delete this task? This action cannot be undone.')) return

    setIsDeleting(true)
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('organisation_id', organisation.id)

    if (error) {
      showToast({ title: 'Unable to delete task', description: error.message, variant: 'error' })
      setIsDeleting(false)
      return
    }

    showToast({ title: 'Task deleted', variant: 'success' })
    router.push('/dashboard/tasks')
  }

  if (authLoading || managerLoading || isLoading) {
    return <div className="py-12 text-center text-sm text-slate-500">Loading task…</div>
  }

  if (!isManager) {
    return <div className="py-12 text-center text-sm text-slate-500">You do not have permission to view this page.</div>
  }

  if (!task) {
    return <div className="py-12 text-center text-sm text-slate-500">Task not found.</div>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/dashboard/tasks">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4" />
            Back to tasks
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/dashboard/tasks/${task.id}/edit`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button variant="danger" isLoading={isDeleting} onClick={() => void handleDelete()}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card padding="lg">
        <CardHeader>
          <CardTitle>{task.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Chip size="sm">{task.status}</Chip>
            <Chip size="sm">{task.priority}</Chip>
            {task.task_type ? <Chip size="sm">{task.task_type}</Chip> : null}
          </div>
          {task.description ? <p className="text-sm text-slate-600">{task.description}</p> : null}
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resident</dt>
              <dd className="mt-1 text-sm text-slate-900">{task.resident_name || 'No resident linked'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Due</dt>
              <dd className="mt-1 text-sm text-slate-900">{new Date(task.due_at).toLocaleString()}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
