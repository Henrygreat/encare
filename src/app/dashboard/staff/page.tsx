'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Clock, Mail, Phone, Plus, Search, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Chip } from '@/components/ui/chip'
import { createClient } from '@/lib/supabase/client'
import { useAuth, useRequireManager } from '@/lib/hooks/use-auth'
import { useToast } from '@/components/providers/toast-provider'
import { formatRelativeTime } from '@/lib/utils'
import type { User, UserRole } from '@/lib/database.types'

type StaffRow = User & {
  shiftStatus: 'on_shift' | 'off_shift'
  assignedResidents: number
  logsToday: number
  tasksCompleted: number
  tasksOverdue: number
  lastActive: string | null
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  senior_carer: 'Senior Carer',
  carer: 'Care Worker',
}

const ROLE_COLORS: Record<UserRole, 'purple' | 'primary' | 'info' | 'default'> = {
  admin: 'purple',
  manager: 'purple',
  senior_carer: 'primary',
  carer: 'default',
}

export default function StaffManagementPage() {
  const { organisation, isLoading: authLoading } = useAuth()
  const { isManager, isLoading: managerLoading } = useRequireManager('/dashboard')
  const { showToast } = useToast()

  const [staff, setStaff] = useState<StaffRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'on_shift' | 'off_shift'>('all')
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)

  useEffect(() => {
    async function loadStaff() {
      if (!organisation?.id) return
      setIsLoading(true)
      setError(null)
      try {
        const supabase = createClient()
        const today = new Date().toISOString().split('T')[0]
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        const nowIso = new Date().toISOString()
        const [staffResult, assignmentsResult, logsResult, tasksResult] = await Promise.all([
          supabase.from('users').select('*').eq('organisation_id', organisation.id).eq('is_active', true).order('full_name'),
          supabase.from('staff_assignments').select('user_id, resident_id').eq('shift_date', today),
          supabase.from('daily_logs').select('logged_by, logged_at').eq('organisation_id', organisation.id).gte('logged_at', startOfDay.toISOString()),
          supabase.from('tasks').select('assigned_to, status, due_at, completed_at').eq('organisation_id', organisation.id).or(`due_at.gte.${startOfDay.toISOString()},completed_at.gte.${startOfDay.toISOString()}`),
        ])
        if (staffResult.error) throw staffResult.error
        if (assignmentsResult.error) throw assignmentsResult.error
        if (logsResult.error) throw logsResult.error
        if (tasksResult.error) throw tasksResult.error
        const assignedResidents = new Map<string, Set<string>>()
        for (const assignment of assignmentsResult.data || []) {
          const current = assignedResidents.get(assignment.user_id) || new Set<string>()
          current.add(assignment.resident_id)
          assignedResidents.set(assignment.user_id, current)
        }
        const logsToday = new Map<string, { count: number; lastActive: string | null }>()
        for (const log of logsResult.data || []) {
          const current = logsToday.get(log.logged_by) || { count: 0, lastActive: null }
          logsToday.set(log.logged_by, { count: current.count + 1, lastActive: current.lastActive || log.logged_at })
        }
        const taskMeta = new Map<string, { completed: number; overdue: number }>()
        for (const task of tasksResult.data || []) {
          if (!task.assigned_to) continue
          const current = taskMeta.get(task.assigned_to) || { completed: 0, overdue: 0 }
          if (task.status === 'completed') current.completed += 1
          if (task.status === 'pending' && task.due_at && new Date(task.due_at) < new Date(nowIso)) current.overdue += 1
          taskMeta.set(task.assigned_to, current)
        }
        const staffRows = (staffResult.data || []) as User[]
        setStaff(
          staffRows.map((member: User) => {
            const logs = logsToday.get(member.id)
            const tasks = taskMeta.get(member.id)
            const assigned = assignedResidents.get(member.id)
            return {
              ...member,
              shiftStatus: assigned && assigned.size > 0 ? 'on_shift' : 'off_shift',
              assignedResidents: assigned?.size || 0,
              logsToday: logs?.count || 0,
              tasksCompleted: tasks?.completed || 0,
              tasksOverdue: tasks?.overdue || 0,
              lastActive: logs?.lastActive || member.last_login_at,
            }
          }),
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load staff')
      } finally {
        setIsLoading(false)
      }
    }
    if (!authLoading) void loadStaff()
  }, [authLoading, organisation?.id])

  const handleDeactivate = async (staffId: string) => {
    if (!organisation?.id) return
    if (!window.confirm('Deactivate this staff member? They will no longer be active in this organisation.')) return

    const previousStaff = staff
    setDeactivatingId(staffId)
    setStaff((current) => current.filter((member) => member.id !== staffId))

    const { error: updateError } = await createClient()
      .from('users')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', staffId)
      .eq('organisation_id', organisation.id)

    if (updateError) {
      setStaff(previousStaff)
      showToast({ title: 'Unable to deactivate staff member', description: updateError.message, variant: 'error' })
      setDeactivatingId(null)
      return
    }

    showToast({ title: 'Staff member deactivated', variant: 'success' })
    setDeactivatingId(null)
  }

  const filteredStaff = useMemo(() => {
    let list = [...staff]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((member) => `${member.full_name} ${member.email}`.toLowerCase().includes(q))
    }
    if (roleFilter !== 'all') list = list.filter((member) => member.role === roleFilter)
    if (statusFilter !== 'all') list = list.filter((member) => member.shiftStatus === statusFilter)
    return list
  }, [roleFilter, searchQuery, staff, statusFilter])

  const stats = useMemo(
    () => ({
      total: staff.length,
      onShift: staff.filter((member) => member.shiftStatus === 'on_shift').length,
      withOverdue: staff.filter((member) => member.tasksOverdue > 0).length,
      recentlyActive: staff.filter((member) => member.lastActive && Date.now() - new Date(member.lastActive).getTime() < 60 * 60 * 1000).length,
    }),
    [staff],
  )

  if (authLoading || managerLoading) {
    return <Card padding="lg"><p className="text-center text-slate-500">Loading staff workspace…</p></Card>
  }

  if (!isManager) {
    return <Card padding="lg"><p className="text-center text-slate-500">You do not have permission to manage staff.</p></Card>
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br from-primary-700 via-sky-700 to-slate-900 p-6 text-white shadow-2xl shadow-sky-900/10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100"><Sparkles className="h-3.5 w-3.5" />Live staffing board</div>
            <h1 className="text-3xl font-semibold tracking-tight">See team capacity, workload, and momentum in one place</h1>
            <p className="mt-2 text-sm text-sky-100/90">Real assignments, real task pressure, and who is keeping the shift moving.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/staff/invite"><Button variant="primary" className="bg-white text-slate-900 hover:bg-white/90"><Plus className="mr-2 h-4 w-4" />Add staff</Button></Link>
            <Link href="/app/profile"><Button variant="secondary" className="border-white/30 bg-white/10 text-white hover:bg-white/20">Review team profile</Button></Link>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Team members" value={stats.total} copy="Active staff in this organisation" />
        <MetricCard label="On shift" value={stats.onShift} copy="Currently assigned to residents" />
        <MetricCard label="Overdue workload" value={stats.withOverdue} copy="Staff carrying overdue tasks" tone="warning" />
        <MetricCard label="Active in last hour" value={stats.recentlyActive} copy="Recently logging or signing in" tone="success" />
      </div>
      <Card className="border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur" padding="md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by staff name or email" className="pl-9" /></div>
          <div className="flex flex-wrap gap-2"><FilterSelect value={roleFilter} onChange={setRoleFilter} options={[['all', 'All roles'], ['admin', 'Administrators'], ['manager', 'Managers'], ['senior_carer', 'Senior carers'], ['carer', 'Care workers']]} /><FilterSelect value={statusFilter} onChange={setStatusFilter} options={[['all', 'All statuses'], ['on_shift', 'On shift'], ['off_shift', 'Off shift']]} /></div>
        </div>
      </Card>
      {isLoading ? <Card padding="lg"><p className="text-center text-slate-500">Loading staff…</p></Card> : error ? <Card padding="lg"><p className="text-center text-care-red">{error}</p></Card> : filteredStaff.length === 0 ? <Card padding="lg"><p className="text-center text-slate-500">No staff matched your current filters.</p></Card> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredStaff.map((member) => (
            <Card key={member.id} className="group h-full border-white/70 bg-white/85 shadow-lg shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-sky-100/80" padding="lg">
              <div className="flex items-start justify-between gap-4">
                <Link href={`/dashboard/staff/${member.id}`} className="flex min-w-0 flex-1 gap-4">
                  <Avatar src={member.avatar_url} name={member.full_name} size="lg" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-lg font-semibold text-slate-900">{member.full_name}</h2><Chip variant={ROLE_COLORS[member.role]} size="sm">{ROLE_LABELS[member.role]}</Chip><Chip size="sm" variant={member.shiftStatus === 'on_shift' ? 'success' : 'default'}>{member.shiftStatus === 'on_shift' ? 'On shift' : 'Off shift'}</Chip></div>
                    <div className="mt-3 space-y-1.5 text-sm text-slate-500"><div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{member.email}</div>{member.phone ? <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{member.phone}</div> : null}<div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />{member.lastActive ? `Last active ${formatRelativeTime(member.lastActive)}` : 'No recent activity'}</div></div>
                  </div>
                </Link>
                <div className="flex shrink-0 flex-col gap-2">
                  <Link href={`/dashboard/staff/${member.id}/edit`}><Button variant="outline" size="sm">Edit</Button></Link>
                  <Button variant="danger" size="sm" isLoading={deactivatingId === member.id} onClick={() => void handleDeactivate(member.id)}>Deactivate</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, copy, tone = 'default' }: { label: string; value: number; copy: string; tone?: 'default' | 'warning' | 'success' }) {
  const toneClass = tone === 'warning' ? 'from-amber-50 to-white border-amber-100' : tone === 'success' ? 'from-emerald-50 to-white border-emerald-100' : 'from-white to-slate-50 border-white/70'
  return <Card className={`border bg-gradient-to-br ${toneClass} shadow-lg shadow-slate-200/60`} padding="md"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p><p className="mt-2 text-sm text-slate-500">{copy}</p></Card>
}

function FilterSelect<T extends string>({ value, onChange, options }: { value: T; onChange: (value: T) => void; options: Array<[T, string]> }) {
  return <select value={value} onChange={(event) => onChange(event.target.value as T)} className="h-10 rounded-button border border-surface-200 bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500">{options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}</select>
}
