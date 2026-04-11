'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth-store'

export interface DashboardStats {
  overdueTasks: Array<{
    id: string
    title: string
    resident: string
    assignedTo: string
    dueAt: string
    priority: string
  }>
  missingLogs: Array<{
    residentId: string
    residentName: string
    room: string | null
    missingTypes: string[]
  }>
  incidents: Array<{
    id: string
    type: string
    resident: string
    severity: string
    reportedAt: string
    reportedBy: string
  }>
  baselineChanges: Array<{
    residentId: string
    residentName: string
    change: string
    trend: 'up' | 'down'
  }>
  staffActivity: Array<{
    userId: string
    name: string
    role: string
    logsToday: number
    tasksCompleted: number
    tasksOverdue: number
    status: 'on_shift' | 'off_shift'
  }>
  todayStats: {
    totalLogs: number
    tasksCompleted: number
    tasksPending: number
    residentsLogged: number
    totalResidents: number
    totalIncidents: number
  }
}

type ResidentRow = {
  id: string
  first_name: string | null
  last_name: string | null
  preferred_name: string | null
  room_number: string | null
  status?: string | null
}

type UserRow = {
  id: string
  full_name: string | null
  role: string | null
}

type DailyLogRow = {
  resident_id: string
  log_type: string
  logged_by: string
  logged_at?: string
}

type TaskRow = {
  id: string
  title: string
  priority: string
  due_at: string
  assigned_to: string | null
  status?: string
  residents?: ResidentRow | ResidentRow[] | null
  users?: { full_name: string | null } | { full_name: string | null }[] | null
}

type IncidentRow = {
  id: string
  incident_type: string | null
  severity: string | null
  occurred_at: string
  reported_by: string
  residents?: ResidentRow | ResidentRow[] | null
  users?: { full_name: string | null } | { full_name: string | null }[] | null
}

const REQUIRED_LOG_TYPES = ['meal', 'medication', 'personal_care']

function getDisplayName(resident: ResidentRow | null | undefined) {
  if (!resident) return 'Unknown'
  return resident.preferred_name || resident.first_name || resident.last_name || 'Unknown'
}

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] || null : value
}

export function useDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.organisation_id) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

        const nowIso = now.toISOString()
        const startOfDayIso = startOfDay.toISOString()
        const endOfDayIso = endOfDay.toISOString()

        const [
          { data: overdueTasksRaw, error: overdueTasksError },
          { data: allResidentsRaw, error: residentsError },
          { data: todayLogsRaw, error: logsError },
          { data: incidentsRaw, error: incidentsError },
          { data: todayTasksRaw, error: todayTasksError },
          { data: staffDataRaw, error: staffError },
          { data: staffOverdueRaw, error: staffOverdueError },
        ] = await Promise.all([
          supabase
            .from('tasks')
            .select(`
              id,
              title,
              priority,
              due_at,
              assigned_to,
              residents (first_name, last_name, preferred_name),
              users!assigned_to (full_name)
            `)
            .eq('organisation_id', user.organisation_id)
            .eq('status', 'pending')
            .lt('due_at', nowIso)
            .order('due_at', { ascending: true })
            .limit(10),

          supabase
            .from('residents')
            .select('id, first_name, last_name, preferred_name, room_number, status')
            .eq('organisation_id', user.organisation_id)
            .eq('status', 'active')
            .order('first_name', { ascending: true }),

          supabase
            .from('daily_logs')
            .select('resident_id, log_type, logged_by, logged_at')
            .eq('organisation_id', user.organisation_id)
            .gte('logged_at', startOfDayIso)
            .lt('logged_at', endOfDayIso)
            .order('logged_at', { ascending: false }),

          supabase
            .from('incidents')
            .select(`
              id,
              incident_type,
              severity,
              occurred_at,
              reported_by,
              residents (first_name, last_name, preferred_name),
              users!reported_by (full_name)
            `)
            .eq('organisation_id', user.organisation_id)
            .gte('occurred_at', startOfDayIso)
            .lt('occurred_at', endOfDayIso)
            .order('occurred_at', { ascending: false })
            .limit(10),

          supabase
            .from('tasks')
            .select('id, status, assigned_to, due_at')
            .eq('organisation_id', user.organisation_id)
            .gte('due_at', startOfDayIso)
            .lt('due_at', endOfDayIso),

          supabase
            .from('users')
            .select('id, full_name, role')
            .eq('organisation_id', user.organisation_id)
            .eq('is_active', true)
            .order('full_name', { ascending: true }),

          supabase
            .from('tasks')
            .select('assigned_to, id')
            .eq('organisation_id', user.organisation_id)
            .eq('status', 'pending')
            .lt('due_at', nowIso),
        ])

        if (overdueTasksError) throw overdueTasksError
        if (residentsError) throw residentsError
        if (logsError) throw logsError
        if (incidentsError) throw incidentsError
        if (todayTasksError) throw todayTasksError
        if (staffError) throw staffError
        if (staffOverdueError) throw staffOverdueError

        const overdueTasks = (overdueTasksRaw || []) as TaskRow[]
        const allResidents = (allResidentsRaw || []) as ResidentRow[]
        const todayLogs = (todayLogsRaw || []) as DailyLogRow[]
        const incidents = (incidentsRaw || []) as IncidentRow[]
        const todayTasks = (todayTasksRaw || []) as Array<{
          id: string
          status: string
          assigned_to: string | null
          due_at: string
        }>
        const staffData = (staffDataRaw || []) as UserRow[]
        const staffOverdue = (staffOverdueRaw || []) as Array<{
          assigned_to: string | null
          id: string
        }>

        const logsByResident = new Map<string, Set<string>>()
        const logsByUser = new Map<string, number>()

        todayLogs.forEach((log) => {
          if (!logsByResident.has(log.resident_id)) {
            logsByResident.set(log.resident_id, new Set())
          }

          logsByResident.get(log.resident_id)!.add(log.log_type)
          logsByUser.set(log.logged_by, (logsByUser.get(log.logged_by) || 0) + 1)
        })

        const missingLogs = allResidents
          .filter((resident) => {
            const residentLogs = logsByResident.get(resident.id) || new Set<string>()
            return REQUIRED_LOG_TYPES.some((type) => !residentLogs.has(type))
          })
          .map((resident) => {
            const residentLogs = logsByResident.get(resident.id) || new Set<string>()
            const missingTypes = REQUIRED_LOG_TYPES.filter((type) => !residentLogs.has(type))

            return {
              residentId: resident.id,
              residentName: getDisplayName(resident),
              room: resident.room_number,
              missingTypes,
            }
          })

        const tasksCompleted =
          todayTasks.filter((task) => task.status === 'completed').length || 0

        const tasksPending =
          todayTasks.filter((task) => task.status === 'pending').length || 0

        const staffActivity = staffData.map((staff) => {
          const userLogsCount = logsByUser.get(staff.id) || 0
          const userOvertasks =
            staffOverdue.filter((task) => task.assigned_to === staff.id).length || 0

          const tasksForStaff =
            todayTasks.filter((task) => task.assigned_to === staff.id) || []

          const completedByStaff =
            tasksForStaff.filter((task) => task.status === 'completed').length || 0

          return {
            userId: staff.id,
            name: staff.full_name || 'Unknown',
            role: staff.role || 'staff',
            logsToday: userLogsCount,
            tasksCompleted: completedByStaff,
            tasksOverdue: userOvertasks,
            status: 'on_shift' as const,
          }
        })

        const dashboardData: DashboardStats = {
          overdueTasks: overdueTasks.map((task) => {
            const resident = getSingleRelation(task.residents)
            const assignee = getSingleRelation(task.users)

            return {
              id: task.id,
              title: task.title,
              resident: resident ? getDisplayName(resident) : 'Unknown',
              assignedTo: assignee?.full_name || 'Unassigned',
              dueAt: task.due_at,
              priority: task.priority,
            }
          }),

          missingLogs: missingLogs.slice(0, 5),

          incidents: incidents.map((incident) => {
            const resident = getSingleRelation(incident.residents)
            const reporter = getSingleRelation(incident.users)

            return {
              id: incident.id,
              type: incident.incident_type || 'incident',
              resident: resident ? getDisplayName(resident) : 'Unknown',
              severity: incident.severity || 'unknown',
              reportedAt: incident.occurred_at,
              reportedBy: reporter?.full_name || 'Unknown',
            }
          }),

          baselineChanges: [],

          staffActivity: staffActivity.slice(0, 10),

          todayStats: {
            totalLogs: todayLogs.length || 0,
            tasksCompleted,
            tasksPending,
            residentsLogged: logsByResident.size,
            totalResidents: allResidents.length || 0,
            totalIncidents: incidents.length || 0,
          },
        }

        setData(dashboardData)
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch dashboard data'))
      } finally {
        setIsLoading(false)
      }
    }

    void fetchDashboardData()
  }, [user?.organisation_id])

  return { data, isLoading, error }
}