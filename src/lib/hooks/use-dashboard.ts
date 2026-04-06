'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth-store'
import type { Task, DailyLog, Incident, Resident, User } from '@/lib/database.types'

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
  }
}

const LOG_TYPES = ['meal', 'drink', 'medication', 'toileting', 'mood', 'personal_care', 'activity', 'observation', 'incident', 'note']

export function useDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user, organisation } = useAuthStore()

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.organisation_id) return

      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        const today = new Date().toISOString().split('T')[0]
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        // Fetch overdue tasks
        const { data: overdueTasks } = await supabase
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
          .lt('due_at', new Date().toISOString())
          .limit(10)

        // Fetch all residents
        const { data: allResidents } = await supabase
          .from('residents')
          .select('id, first_name, last_name, preferred_name, room_number, status')
          .eq('organisation_id', user.organisation_id)
          .eq('status', 'active')

        // Fetch today's logs
        const { data: todayLogs } = await supabase
          .from('daily_logs')
          .select('resident_id, log_type, logged_by')
          .eq('organisation_id', user.organisation_id)
          .gte('logged_at', startOfDay.toISOString())

        // Group logs by resident
        const logsByResident = new Map<string, Set<string>>()
        const logsByUser = new Map<string, number>()
        todayLogs?.forEach((log: any) => {
          if (!logsByResident.has(log.resident_id)) {
            logsByResident.set(log.resident_id, new Set())
          }
          logsByResident.get(log.resident_id)!.add(log.log_type)

          // Count logs by user
          logsByUser.set(log.logged_by, (logsByUser.get(log.logged_by) || 0) + 1)
        })

        // Find missing logs
        const missingLogs = (allResidents || []).filter((r: any) => {
          const residentLogs = logsByResident.get(r.id) || new Set()
          const requiredLogs = ['meal', 'medication', 'personal_care']
          return requiredLogs.some((type) => !residentLogs.has(type))
        }).map((r: any) => {
          const residentLogs = logsByResident.get(r.id) || new Set()
          const missingTypes = LOG_TYPES.filter((type) => !residentLogs.has(type))
          return {
            residentId: r.id,
            residentName: r.preferred_name || r.first_name,
            room: r.room_number,
            missingTypes,
          }
        })

        // Fetch today's incidents
        const { data: incidents } = await supabase
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
          .gte('occurred_at', startOfDay.toISOString())
          .limit(10)

        // Fetch today's tasks
        const { data: todayTasks } = await supabase
          .from('tasks')
          .select('id, status')
          .eq('organisation_id', user.organisation_id)
          .gte('due_at', startOfDay.toISOString())

        // Fetch staff
        const { data: staffData } = await supabase
          .from('users')
          .select('id, full_name, role')
          .eq('organisation_id', user.organisation_id)
          .eq('is_active', true)

        // Query overdue tasks for each staff member
        const { data: staffOverdue } = await supabase
          .from('tasks')
          .select('assigned_to, id')
          .eq('organisation_id', user.organisation_id)
          .eq('status', 'pending')
          .lt('due_at', new Date().toISOString())

        // Build dashboard data
        const tasksCompleted = todayTasks?.filter((t: any) => t.status === 'completed').length || 0
        const tasksPending = todayTasks?.filter((t: any) => t.status === 'pending').length || 0

        const staffActivity = (staffData || []).map((staff: any) => {
          const userLogsCount = logsByUser.get(staff.id) || 0
          const userOvertasks = staffOverdue?.filter((t: any) => t.assigned_to === staff.id).length || 0

          // Count completed tasks by this staff member
          const tasksForStaff = todayTasks?.filter((t: any) => t.assigned_to === staff.id) || []
          const completedByStaff = tasksForStaff.filter((t: any) => t.status === 'completed').length

          return {
            userId: staff.id,
            name: staff.full_name,
            role: staff.role,
            logsToday: userLogsCount,
            tasksCompleted: completedByStaff,
            tasksOverdue: userOvertasks,
            status: 'on_shift' as const,
          }
        })

        // Build the dashboard stats
        const dashboardData: DashboardStats = {
          overdueTasks: (overdueTasks || []).map((task: any) => {
            const resident = Array.isArray(task.residents) ? task.residents[0] : task.residents
            const assignee = Array.isArray(task.users) ? task.users[0] : task.users

            return {
              id: task.id,
              title: task.title,
              resident: resident ? `${resident.preferred_name || resident.first_name}` : 'Unknown',
              assignedTo: assignee?.full_name || 'Unassigned',
              dueAt: task.due_at,
              priority: task.priority,
            }
          }),
          missingLogs: missingLogs.slice(0, 5),
          incidents: (incidents || []).map((inc: any) => {
            const resident = Array.isArray(inc.residents) ? inc.residents[0] : inc.residents
            const reporter = Array.isArray(inc.users) ? inc.users[0] : inc.users

            return {
              id: inc.id,
              type: inc.incident_type,
              resident: resident ? `${resident.preferred_name || resident.first_name}` : 'Unknown',
              severity: inc.severity,
              reportedAt: inc.occurred_at,
              reportedBy: reporter?.full_name || 'Unknown',
            }
          }),
          baselineChanges: [], // Placeholder - would need specific implementation
          staffActivity: staffActivity.slice(0, 10),
          todayStats: {
            totalLogs: todayLogs?.length || 0,
            tasksCompleted,
            tasksPending,
            residentsLogged: logsByResident.size,
            totalResidents: allResidents?.length || 0,
          },
        }

        setData(dashboardData)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch dashboard data'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?.organisation_id])

  return { data, isLoading, error }
}
