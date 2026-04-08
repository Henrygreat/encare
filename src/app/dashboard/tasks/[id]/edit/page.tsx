'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth, useRequireManager } from '@/lib/hooks/use-auth'
import { useToast } from '@/components/providers/toast-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { TaskPriority } from '@/lib/database.types'

type FormErrors = {
  title?: string
  dueDate?: string
  general?: string
}

export default function EditTaskPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { organisation, isLoading: authLoading } = useAuth()
  const { isManager, isLoading: managerLoading } = useRequireManager('/dashboard')
  const { showToast } = useToast()

  const taskId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('09:00')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    async function fetchTask() {
      if (!organisation?.id || !taskId) return

      setIsLoading(true)
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description, priority, due_at')
        .eq('id', taskId)
        .eq('organisation_id', organisation.id)
        .maybeSingle()

      if (error) {
        setErrors({ general: error.message })
        setIsLoading(false)
        return
      }

      if (!data) {
        setErrors({ general: 'Task not found.' })
        setIsLoading(false)
        return
      }

      const due = new Date(data.due_at)
      setTitle(data.title)
      setDescription(data.description || '')
      setPriority(data.priority)
      setDueDate(due.toISOString().slice(0, 10))
      setDueTime(due.toISOString().slice(11, 16))
      setIsLoading(false)
    }

    if (!authLoading) {
      void fetchTask()
    }
  }, [authLoading, organisation?.id, supabase, taskId])

  const validate = () => {
    const nextErrors: FormErrors = {}

    if (!title.trim()) {
      nextErrors.title = 'Task title is required.'
    } else if (title.trim().length < 3) {
      nextErrors.title = 'Task title must be at least 3 characters.'
    }

    if (!dueDate) {
      nextErrors.dueDate = 'Due date is required.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!organisation?.id || !taskId || !validate()) return

    setIsSubmitting(true)
    const dueAt = new Date(`${dueDate}T${dueTime || '09:00'}:00`).toISOString()

    const { error } = await supabase
      .from('tasks')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_at: dueAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .eq('organisation_id', organisation.id)

    if (error) {
      setErrors({ general: error.message })
      showToast({ title: 'Unable to update task', description: error.message, variant: 'error' })
      setIsSubmitting(false)
      return
    }

    showToast({ title: 'Task updated', variant: 'success' })
    router.push(`/dashboard/tasks/${taskId}`)
  }

  if (authLoading || managerLoading || isLoading) {
    return <div className="py-12 text-center text-sm text-slate-500">Loading task editor…</div>
  }

  if (!isManager) {
    return <div className="py-12 text-center text-sm text-slate-500">You do not have permission to edit tasks.</div>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/tasks/${taskId}`}>
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit task</h1>
          <p className="text-sm text-slate-600">Update core task details without changing the existing workflow.</p>
        </div>
      </div>

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Task details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input label="Task title" value={title} onChange={(event) => setTitle(event.target.value)} error={errors.title} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                className="flex w-full rounded-[14px] border border-slate-200/80 bg-white/92 px-4 py-3 text-base text-slate-900 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Priority</label>
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as TaskPriority)}
                  className="h-12 w-full rounded-[14px] border border-slate-200/80 bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <Input type="date" label="Due date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} error={errors.dueDate} />
              <Input type="time" label="Due time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} />
            </div>
            {errors.general ? <p className="text-sm text-care-red">{errors.general}</p> : null}
            <div className="flex justify-end gap-3">
              <Link href={`/dashboard/tasks/${taskId}`}>
                <Button type="button" variant="secondary">Cancel</Button>
              </Link>
              <Button type="submit" isLoading={isSubmitting}>Save changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
