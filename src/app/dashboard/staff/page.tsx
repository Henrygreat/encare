'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  Plus,
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  MoreVertical,
  Mail,
  Phone
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Chip } from '@/components/ui/chip'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import type { User, UserRole } from '@/lib/database.types'

// Demo data
const DEMO_STAFF: Array<User & {
  recentActivity?: {
    logsToday: number
    tasksCompleted: number
    tasksOverdue: number
    lastActive: string
  }
  assignedResidents?: number
  shiftStatus?: 'on_shift' | 'off_shift' | 'break'
}> = [
  {
    id: 'u1',
    organisation_id: 'org1',
    email: 'sarah.johnson@carehome.com',
    full_name: 'Sarah Johnson',
    role: 'senior_carer',
    avatar_url: null,
    phone: '07700 900001',
    pin_hash: null,
    is_active: true,
    last_login_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    preferences: {},
    created_at: new Date('2023-01-15').toISOString(),
    updated_at: new Date().toISOString(),
    recentActivity: {
      logsToday: 18,
      tasksCompleted: 6,
      tasksOverdue: 1,
      lastActive: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    assignedResidents: 3,
    shiftStatus: 'on_shift',
  },
  {
    id: 'u2',
    organisation_id: 'org1',
    email: 'mike.taylor@carehome.com',
    full_name: 'Mike Taylor',
    role: 'carer',
    avatar_url: null,
    phone: '07700 900002',
    pin_hash: null,
    is_active: true,
    last_login_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    preferences: {},
    created_at: new Date('2023-03-20').toISOString(),
    updated_at: new Date().toISOString(),
    recentActivity: {
      logsToday: 12,
      tasksCompleted: 4,
      tasksOverdue: 1,
      lastActive: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    assignedResidents: 2,
    shiftStatus: 'on_shift',
  },
  {
    id: 'u3',
    organisation_id: 'org1',
    email: 'emma.wilson@carehome.com',
    full_name: 'Emma Wilson',
    role: 'carer',
    avatar_url: null,
    phone: '07700 900003',
    pin_hash: null,
    is_active: true,
    last_login_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    preferences: {},
    created_at: new Date('2023-06-01').toISOString(),
    updated_at: new Date().toISOString(),
    recentActivity: {
      logsToday: 8,
      tasksCompleted: 3,
      tasksOverdue: 0,
      lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    assignedResidents: 2,
    shiftStatus: 'on_shift',
  },
  {
    id: 'u4',
    organisation_id: 'org1',
    email: 'james.brown@carehome.com',
    full_name: 'James Brown',
    role: 'carer',
    avatar_url: null,
    phone: '07700 900004',
    pin_hash: null,
    is_active: true,
    last_login_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    preferences: {},
    created_at: new Date('2023-08-15').toISOString(),
    updated_at: new Date().toISOString(),
    recentActivity: {
      logsToday: 0,
      tasksCompleted: 0,
      tasksOverdue: 0,
      lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    assignedResidents: 0,
    shiftStatus: 'off_shift',
  },
  {
    id: 'u5',
    organisation_id: 'org1',
    email: 'admin@carehome.com',
    full_name: 'Admin Manager',
    role: 'manager',
    avatar_url: null,
    phone: '07700 900000',
    pin_hash: null,
    is_active: true,
    last_login_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    preferences: {},
    created_at: new Date('2022-06-01').toISOString(),
    updated_at: new Date().toISOString(),
    recentActivity: {
      logsToday: 0,
      tasksCompleted: 0,
      tasksOverdue: 0,
      lastActive: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    assignedResidents: 0,
    shiftStatus: 'on_shift',
  },
]

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
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'on_shift' | 'off_shift'>('all')

  const filteredStaff = useMemo(() => {
    let staff = [...DEMO_STAFF]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      staff = staff.filter(
        s =>
          s.full_name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query)
      )
    }

    if (roleFilter !== 'all') {
      staff = staff.filter(s => s.role === roleFilter)
    }

    if (statusFilter !== 'all') {
      staff = staff.filter(s => s.shiftStatus === statusFilter)
    }

    return staff
  }, [searchQuery, roleFilter, statusFilter])

  const stats = {
    total: DEMO_STAFF.length,
    onShift: DEMO_STAFF.filter(s => s.shiftStatus === 'on_shift').length,
    withOverdue: DEMO_STAFF.filter(s => (s.recentActivity?.tasksOverdue || 0) > 0).length,
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500">{stats.onShift} on shift, {stats.total} total</p>
        </div>
        <Button variant="primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Staff</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-care-green" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.onShift}</p>
              <p className="text-sm text-gray-500">On Shift</p>
            </div>
          </div>
        </Card>
        <Card padding="md" className={stats.withOverdue > 0 ? 'border-care-amber' : ''}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-care-amber" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.withOverdue}</p>
              <p className="text-sm text-gray-500">With Overdue Tasks</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-5 w-5" />}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
              className="h-12 px-4 rounded-button border border-surface-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="manager">Manager</option>
              <option value="senior_carer">Senior Carer</option>
              <option value="carer">Care Worker</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-12 px-4 rounded-button border border-surface-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="on_shift">On Shift</option>
              <option value="off_shift">Off Shift</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Staff Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-surface-200 bg-surface-50">
                <th className="p-4 font-medium">Staff Member</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Shift Status</th>
                <th className="p-4 font-medium text-center">Residents</th>
                <th className="p-4 font-medium text-center">Today&apos;s Logs</th>
                <th className="p-4 font-medium text-center">Tasks Done</th>
                <th className="p-4 font-medium text-center">Overdue</th>
                <th className="p-4 font-medium">Last Active</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-surface-50">
                  <td className="p-4">
                    <Link
                      href={`/dashboard/staff/${staff.id}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar
                        src={staff.avatar_url}
                        name={staff.full_name}
                        size="md"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{staff.full_name}</p>
                        <p className="text-sm text-gray-500">{staff.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="p-4">
                    <Chip variant={ROLE_COLORS[staff.role]} size="sm">
                      {ROLE_LABELS[staff.role]}
                    </Chip>
                  </td>
                  <td className="p-4">
                    <Chip
                      variant={staff.shiftStatus === 'on_shift' ? 'success' : 'default'}
                      size="sm"
                    >
                      {staff.shiftStatus === 'on_shift' ? 'On Shift' : 'Off Shift'}
                    </Chip>
                  </td>
                  <td className="p-4 text-center text-gray-700">
                    {staff.assignedResidents || 0}
                  </td>
                  <td className="p-4 text-center font-medium text-gray-700">
                    {staff.recentActivity?.logsToday || 0}
                  </td>
                  <td className="p-4 text-center font-medium text-care-green">
                    {staff.recentActivity?.tasksCompleted || 0}
                  </td>
                  <td className="p-4 text-center">
                    {(staff.recentActivity?.tasksOverdue || 0) > 0 ? (
                      <span className="font-medium text-care-red">
                        {staff.recentActivity?.tasksOverdue}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {staff.recentActivity?.lastActive
                      ? formatRelativeTime(staff.recentActivity.lastActive)
                      : 'Never'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/staff/${staff.id}`}
                        className="text-primary-600 text-sm font-medium hover:underline"
                      >
                        View
                      </Link>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStaff.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No staff members match your search criteria
          </div>
        )}
      </Card>
    </div>
  )
}
