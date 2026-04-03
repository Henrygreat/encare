'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  Clock,
  FileX,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  ChevronRight,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatTime, formatRelativeTime } from '@/lib/utils'

// Demo data
const DEMO_DATA = {
  overdueTasks: [
    { id: 't1', title: 'Morning medication', resident: 'Maggie Thompson', assignedTo: 'Sarah J.', dueAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), priority: 'high' },
    { id: 't2', title: 'Blood pressure check', resident: 'Bob Wilson', assignedTo: 'Mike T.', dueAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), priority: 'medium' },
  ],
  missingLogs: [
    { residentId: '1', residentName: 'Maggie Thompson', room: '101', missingTypes: ['meal', 'medication'] },
    { residentId: '5', residentName: 'Betty Davis', room: '115', missingTypes: ['personal_care'] },
  ],
  incidents: [
    { id: 'i1', type: 'Fall', resident: 'James Anderson', severity: 'medium', reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), reportedBy: 'Sarah J.' },
  ],
  baselineChanges: [
    { residentId: '1', residentName: 'Maggie Thompson', change: 'Reduced appetite over past 3 days', trend: 'down' },
    { residentId: '2', residentName: 'Bob Wilson', change: 'Improved mood and engagement', trend: 'up' },
  ],
  staffActivity: [
    { userId: 'u1', name: 'Sarah Johnson', role: 'Senior Carer', logsToday: 18, tasksCompleted: 6, tasksOverdue: 1, status: 'on_shift' },
    { userId: 'u2', name: 'Mike Taylor', role: 'Carer', logsToday: 12, tasksCompleted: 4, tasksOverdue: 1, status: 'on_shift' },
    { userId: 'u3', name: 'Emma Wilson', role: 'Carer', logsToday: 8, tasksCompleted: 3, tasksOverdue: 0, status: 'on_shift' },
  ],
  todayStats: {
    totalLogs: 38,
    tasksCompleted: 13,
    tasksPending: 5,
    residentsLogged: 6,
    totalResidents: 8,
  },
}

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today&apos;s Overview</h1>
          <p className="text-gray-500">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary">
            Download Report
          </Button>
          <Button variant="primary">
            Broadcast Message
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Logs Today"
          value={DEMO_DATA.todayStats.totalLogs}
          icon={<Activity className="h-5 w-5 text-primary-500" />}
        />
        <StatCard
          label="Tasks Completed"
          value={`${DEMO_DATA.todayStats.tasksCompleted}/${DEMO_DATA.todayStats.tasksCompleted + DEMO_DATA.todayStats.tasksPending}`}
          icon={<CheckCircle className="h-5 w-5 text-care-green" />}
        />
        <StatCard
          label="Residents Logged"
          value={`${DEMO_DATA.todayStats.residentsLogged}/${DEMO_DATA.todayStats.totalResidents}`}
          icon={<Users className="h-5 w-5 text-primary-500" />}
        />
        <StatCard
          label="Incidents"
          value={DEMO_DATA.incidents.length}
          icon={<AlertTriangle className="h-5 w-5 text-care-amber" />}
          variant={DEMO_DATA.incidents.length > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Alerts Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Overdue Tasks */}
        <Card padding="md" className={DEMO_DATA.overdueTasks.length > 0 ? 'border-care-red' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-care-red">
              <Clock className="h-5 w-5" />
              Overdue Tasks ({DEMO_DATA.overdueTasks.length})
            </CardTitle>
            <Link href="/dashboard/tasks" className="text-sm text-primary-600 font-medium">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {DEMO_DATA.overdueTasks.length > 0 ? (
              <div className="space-y-3">
                {DEMO_DATA.overdueTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-button"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-500">
                        {task.resident} &middot; Assigned to {task.assignedTo}
                      </p>
                    </div>
                    <div className="text-right">
                      <Chip variant="danger" size="sm">
                        {formatRelativeTime(task.dueAt)}
                      </Chip>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<CheckCircle />} message="No overdue tasks" />
            )}
          </CardContent>
        </Card>

        {/* Missing Logs */}
        <Card padding="md" className={DEMO_DATA.missingLogs.length > 0 ? 'border-care-amber' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-care-amber">
              <FileX className="h-5 w-5" />
              Missing Logs ({DEMO_DATA.missingLogs.length})
            </CardTitle>
            <Link href="/dashboard/compliance" className="text-sm text-primary-600 font-medium">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {DEMO_DATA.missingLogs.length > 0 ? (
              <div className="space-y-3">
                {DEMO_DATA.missingLogs.map((item) => (
                  <div
                    key={item.residentId}
                    className="flex items-center justify-between p-3 bg-amber-50 rounded-button"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={item.residentName} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{item.residentName}</p>
                        <p className="text-sm text-gray-500">Room {item.room}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {item.missingTypes.map((type) => (
                        <Chip key={type} variant="warning" size="sm">
                          {type}
                        </Chip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<CheckCircle />} message="All logs complete" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Incidents & Baseline Changes */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Incidents */}
        <Card padding="md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-care-red" />
              Today&apos;s Incidents
            </CardTitle>
            <Link href="/dashboard/incidents" className="text-sm text-primary-600 font-medium">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {DEMO_DATA.incidents.length > 0 ? (
              <div className="space-y-3">
                {DEMO_DATA.incidents.map((incident) => (
                  <Link
                    key={incident.id}
                    href={`/dashboard/incidents/${incident.id}`}
                    className="flex items-center justify-between p-3 bg-surface-50 rounded-button hover:bg-surface-100 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{incident.type}</span>
                        <Chip
                          variant={incident.severity === 'high' ? 'danger' : incident.severity === 'medium' ? 'warning' : 'default'}
                          size="sm"
                        >
                          {incident.severity}
                        </Chip>
                      </div>
                      <p className="text-sm text-gray-500">
                        {incident.resident} &middot; {formatRelativeTime(incident.reportedAt)}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon={<CheckCircle />} message="No incidents today" variant="success" />
            )}
          </CardContent>
        </Card>

        {/* Baseline Changes */}
        <Card padding="md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-500" />
              Baseline Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {DEMO_DATA.baselineChanges.length > 0 ? (
              <div className="space-y-3">
                {DEMO_DATA.baselineChanges.map((item) => (
                  <Link
                    key={item.residentId}
                    href={`/dashboard/residents/${item.residentId}`}
                    className="flex items-center justify-between p-3 bg-surface-50 rounded-button hover:bg-surface-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {item.trend === 'up' ? (
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-care-green" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                          <TrendingDown className="h-4 w-4 text-care-red" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{item.residentName}</p>
                        <p className="text-sm text-gray-500">{item.change}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Activity />} message="No significant changes" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Staff Activity */}
      <Card padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-500" />
            Staff Activity
          </CardTitle>
          <Link href="/dashboard/staff" className="text-sm text-primary-600 font-medium">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-surface-100">
                  <th className="pb-3 font-medium">Staff Member</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium text-center">Logs</th>
                  <th className="pb-3 font-medium text-center">Tasks</th>
                  <th className="pb-3 font-medium text-center">Overdue</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {DEMO_DATA.staffActivity.map((staff) => (
                  <tr key={staff.userId} className="hover:bg-surface-50">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={staff.name} size="sm" />
                        <span className="font-medium text-gray-900">{staff.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600">{staff.role}</td>
                    <td className="py-3 text-center font-medium">{staff.logsToday}</td>
                    <td className="py-3 text-center font-medium text-care-green">{staff.tasksCompleted}</td>
                    <td className="py-3 text-center">
                      {staff.tasksOverdue > 0 ? (
                        <span className="font-medium text-care-red">{staff.tasksOverdue}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="py-3">
                      <Chip variant="success" size="sm">On Shift</Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  variant = 'default',
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  variant?: 'default' | 'warning' | 'danger'
}) {
  return (
    <Card
      padding="md"
      className={
        variant === 'warning'
          ? 'border-care-amber bg-amber-50'
          : variant === 'danger'
          ? 'border-care-red bg-red-50'
          : ''
      }
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center">
          {icon}
        </div>
      </div>
    </Card>
  )
}

function EmptyState({
  icon,
  message,
  variant = 'default',
}: {
  icon: React.ReactNode
  message: string
  variant?: 'default' | 'success'
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
      <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-2 ${variant === 'success' ? 'bg-green-50 text-care-green' : 'bg-surface-100'}`}>
        {icon}
      </div>
      <p className={variant === 'success' ? 'text-care-green' : ''}>{message}</p>
    </div>
  )
}
