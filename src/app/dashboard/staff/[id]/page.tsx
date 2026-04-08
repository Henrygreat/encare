'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Mail, Phone, ShieldCheck, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth, useRequireManager } from '@/lib/hooks'
import { useToast } from '@/components/providers/toast-provider'
import { MobileHeader, PageContainer } from '@/components/layout/mobile-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import type { IncidentSeverity, TaskStatus, User } from '@/lib/database.types'

type StaffAssignmentWithResident = {
  id: string
  shift_date: string
  is_primary: boolean
  residents: { id: string; first_name: string; last_name: string; preferred_name: string | null } | null
}

type TaskSummary = {
  id: string
  title: string
  status: TaskStatus
  due_at: string
  priority: string
  residents: { id: string; first_name: string; last_name: string; preferred_name: string | null } | null
}

type LogSummary = {
  id: string
  log_type: string
  notes: string | null
  logged_at: string
  residents: { id: string; first_name: string; last_name: string; preferred_name: string | null } | null
}

type IncidentSummary = {
  id: string
  incident_type: string
  severity: IncidentSeverity
  occurred_at: string
  residents: { id: string; first_name: string; last_name: string; preferred_name: string | null } | null
}

function displayResidentName(resident: { first_name: string; last_name: string; preferred_name: string | null } | null | undefined) {
  if (!resident) return 'Unknown resident'
  return resident.preferred_name || `${resident.first_name} ${resident.last_name}`
}

function formatRelative(date: string | null) {
  if (!date) return 'No recent activity'
  const delta = Date.now() - new Date(date).getTime()
  const minutes = Math.max(1, Math.round(delta / 60000))
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function formatDateTime(date: string | null) {
  if (!date) return 'Not recorded'
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function DashboardStaffDetailPage({ params }: { params: { id: string } }) {
  const { user: authUser, organisation, isLoading: authLoading } = useAuth()
  const { isManager, isLoading: managerLoading } = useRequireManager('/dashboard')
  const { showToast } = useToast()
  const [staff, setStaff] = useState<User | null>(null)
  const [assignments, setAssignments] = useState<StaffAssignmentWithResident[]>([])
  const [tasks, setTasks] = useState<TaskSummary[]>([])
  const [logs, setLogs] = useState<LogSummary[]>([])
  const [incidents, setIncidents] = useState<IncidentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStaffDetail() {
      if (!authUser?.organisation_id) return
      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        const today = new Date().toISOString().split('T')[0]

        const [staffResult, assignmentsResult, tasksResult, logsResult, incidentsResult] = await Promise.all([
          supabase.from('users').select('*').eq('id', params.id).eq('organisation_id', authUser.organisation_id).single(),
          supabase
            .from('staff_assignments')
            .select('id, shift_date, is_primary, residents(id, first_name, last_name, preferred_name)')
            .eq('user_id', params.id)
            .gte('shift_date', today)
            .order('shift_date', { ascending: true })
            .limit(6),
          supabase
            .from('tasks')
            .select('id, title, status, due_at, priority, residents(id, first_name, last_name, preferred_name)')
            .eq('organisation_id', authUser.organisation_id)
            .eq('assigned_to', params.id)
            .order('due_at', { ascending: true })
            .limit(8),
          supabase
            .from('daily_logs')
            .select('id, log_type, notes, logged_at, residents(id, first_name, last_name, preferred_name)')
            .eq('organisation_id', authUser.organisation_id)
            .eq('logged_by', params.id)
            .order('logged_at', { ascending: false })
            .limit(8),
          supabase
            .from('incidents')
            .select('id, incident_type, severity, occurred_at, residents(id, first_name, last_name, preferred_name)')
            .eq('organisation_id', authUser.organisation_id)
            .or(`reported_by.eq.${params.id},resolved_by.eq.${params.id}`)
            .order('occurred_at', { ascending: false })
            .limit(6),
        ])

        if (staffResult.error) throw staffResult.error
        if (assignmentsResult.error) throw assignmentsResult.error
        if (tasksResult.error) throw tasksResult.error
        if (logsResult.error) throw logsResult.error
        if (incidentsResult.error) throw incidentsResult.error

        setStaff(staffResult.data)
        setAssignments((assignmentsResult.data || []) as unknown as StaffAssignmentWithResident[])
        setTasks((tasksResult.data || []) as unknown as TaskSummary[])
        setLogs((logsResult.data || []) as unknown as LogSummary[])
        setIncidents((incidentsResult.data || []) as unknown as IncidentSummary[])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load this staff member right now.')
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      void fetchStaffDetail()
    }
  }, [authLoading, authUser?.organisation_id, params.id])

  const handleDeactivate = async () => {
    if (!organisation?.id || !staff) return
    if (!window.confirm(`Deactivate ${staff.full_name}?`)) return

    setIsDeactivating(true)
    const { error: updateError } = await createClient()
      .from('users')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', staff.id)
      .eq('organisation_id', organisation.id)

    if (updateError) {
      showToast({ title: 'Unable to deactivate staff member', description: updateError.message, variant: 'error' })
      setIsDeactivating(false)
      return
    }

    setStaff({ ...staff, is_active: false })
    showToast({ title: 'Staff member deactivated', variant: 'success' })
    setIsDeactivating(false)
  }

  const metrics = useMemo(() => ({
    assignedResidents: assignments.length,
    openTasks: tasks.filter((task) => !['completed', 'cancelled'].includes(task.status)).length,
    completedTasks: tasks.filter((task) => task.status === 'completed').length,
    incidentsHandled: incidents.length,
  }), [assignments.length, incidents, tasks])

  if (authLoading || managerLoading || isLoading) {
    return <PageContainer header={<MobileHeader title="Staff" backHref="/dashboard/staff" />}><Card padding="lg"><p className="text-center text-slate-500">Loading staff member…</p></Card></PageContainer>
  }

  if (!isManager) {
    return <PageContainer header={<MobileHeader title="Staff" backHref="/dashboard/staff" />}><Card padding="lg"><p className="text-center text-slate-500">You do not have permission to manage staff.</p></Card></PageContainer>
  }

  if (error) {
    return <PageContainer header={<MobileHeader title="Staff" backHref="/dashboard/staff" />}><Card padding="lg"><p className="text-center text-care-red">{error}</p></Card></PageContainer>
  }

  if (!staff) {
    return <PageContainer header={<MobileHeader title="Staff" backHref="/dashboard/staff" />}><Card padding="lg"><p className="text-center text-slate-500">Staff member not found.</p></Card></PageContainer>
  }

  return (
    <PageContainer header={<MobileHeader title={staff.full_name} backHref="/dashboard/staff" />}>
      <div className="space-y-4">
        <Card className="border-white/70 bg-gradient-to-br from-white via-white to-sky-50 shadow-xl" padding="lg">
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-center gap-4">
                <Avatar name={staff.full_name} src={staff.avatar_url} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900">{staff.full_name}</p>
                    <Chip variant={staff.is_active ? 'success' : 'default'} size="sm">{staff.is_active ? 'Active' : 'Inactive'}</Chip>
                  </div>
                  <p className="text-sm capitalize text-gray-600">{staff.role.replace('_', ' ')}</p>
                  <div className="mt-2 space-y-1 text-sm text-slate-500">
                    <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{staff.email}</div>
                    {staff.phone ? <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{staff.phone}</div> : null}
                    <div className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" />Last active {formatRelative(staff.last_login_at)}</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/staff/${staff.id}/edit`}><Button variant="outline">Edit</Button></Link>
                <Button variant="danger" isLoading={isDeactivating} onClick={() => void handleDeactivate()}>Deactivate</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard icon={<Users className="h-4 w-4" />} label="Assigned residents" value={metrics.assignedResidents} />
          <MetricCard icon={<ArrowRight className="h-4 w-4" />} label="Open tasks" value={metrics.openTasks} />
          <MetricCard icon={<CheckCircle2 className="h-4 w-4" />} label="Completed tasks" value={metrics.completedTasks} />
          <MetricCard icon={<ShieldCheck className="h-4 w-4" />} label="Incidents handled" value={metrics.incidentsHandled} />
        </div>

        <Card padding="md">
          <CardHeader><CardTitle>Upcoming assignments</CardTitle></CardHeader>
          <CardContent>
            {assignments.length === 0 ? <p className="text-sm text-slate-500">No upcoming resident assignments are recorded.</p> : <div className="space-y-3">{assignments.map((assignment) => <div key={assignment.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 p-3"><div><p className="font-medium text-slate-900">{displayResidentName(assignment.residents)}</p><p className="text-sm text-slate-500">Shift {new Date(assignment.shift_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p></div><Chip size="sm" variant={assignment.is_primary ? 'primary' : 'default'}>{assignment.is_primary ? 'Primary' : 'Support'}</Chip></div>)}</div>}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card padding="md">
            <CardHeader><CardTitle>Recent task activity</CardTitle></CardHeader>
            <CardContent>
              {tasks.length === 0 ? <p className="text-sm text-slate-500">No assigned tasks found.</p> : <div className="space-y-3">{tasks.map((task) => <div key={task.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3"><div className="flex items-center justify-between gap-3"><div><p className="font-medium text-slate-900">{task.title}</p><p className="text-sm text-slate-500">{displayResidentName(task.residents)} · Due {formatDateTime(task.due_at)}</p></div><Chip size="sm">{task.status}</Chip></div></div>)}</div>}
            </CardContent>
          </Card>

          <Card padding="md">
            <CardHeader><CardTitle>Recent logs</CardTitle></CardHeader>
            <CardContent>
              {logs.length === 0 ? <p className="text-sm text-slate-500">No recent logs found.</p> : <div className="space-y-3">{logs.map((log) => <div key={log.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3"><p className="font-medium capitalize text-slate-900">{log.log_type.replace('_', ' ')}</p><p className="text-sm text-slate-500">{displayResidentName(log.residents)} · {formatDateTime(log.logged_at)}</p>{log.notes ? <p className="mt-2 text-sm text-slate-600">{log.notes}</p> : null}</div>)}</div>}
            </CardContent>
          </Card>
        </div>

        <Card padding="md">
          <CardHeader><CardTitle>Incidents</CardTitle></CardHeader>
          <CardContent>
            {incidents.length === 0 ? <p className="text-sm text-slate-500">No recent incidents handled.</p> : <div className="space-y-3">{incidents.map((incident) => <div key={incident.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3"><div className="flex items-center justify-between gap-3"><div><p className="font-medium text-slate-900">{incident.incident_type}</p><p className="text-sm text-slate-500">{displayResidentName(incident.residents)} · {formatDateTime(incident.occurred_at)}</p></div><Chip size="sm" variant={incident.severity === 'critical' || incident.severity === 'high' ? 'danger' : 'warning'}>{incident.severity}</Chip></div></div>)}</div>}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <Card className="border-white/70 bg-white/90 shadow-lg shadow-slate-200/60" padding="md"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p></div><div className="rounded-full bg-slate-100 p-2 text-slate-700">{icon}</div></div></Card>
}
