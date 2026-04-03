'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  Plus,
  Filter,
  ChevronRight,
  AlertTriangle,
  Users,
  MoreVertical
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Chip } from '@/components/ui/chip'
import { formatDate } from '@/lib/utils'
import type { Resident } from '@/lib/database.types'

// Demo data
const DEMO_RESIDENTS: Array<Resident & {
  assignedStaff?: string[]
  lastLogAt?: string
  riskLevel?: 'high' | 'medium' | 'low'
  logCount7Days?: number
}> = [
  {
    id: '1',
    organisation_id: 'org1',
    first_name: 'Margaret',
    last_name: 'Thompson',
    preferred_name: 'Maggie',
    room_number: '101',
    photo_url: null,
    date_of_birth: '1940-03-15',
    admission_date: '2023-01-10',
    status: 'active',
    emergency_contact: { name: 'John Thompson', phone: '07700 900123' },
    medical_info: {},
    dietary_requirements: 'Soft foods',
    mobility_notes: 'Wheelchair',
    communication_needs: null,
    risk_flags: [{ type: 'falls', level: 'high' }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignedStaff: ['Sarah Johnson', 'Mike Taylor'],
    lastLogAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    riskLevel: 'high',
    logCount7Days: 142,
  },
  {
    id: '2',
    organisation_id: 'org1',
    first_name: 'Robert',
    last_name: 'Wilson',
    preferred_name: 'Bob',
    room_number: '105',
    photo_url: null,
    date_of_birth: '1938-07-22',
    admission_date: '2022-08-15',
    status: 'active',
    emergency_contact: { name: 'Mary Wilson', phone: '07700 900456' },
    medical_info: {},
    dietary_requirements: null,
    mobility_notes: 'Walking frame',
    communication_needs: 'Hard of hearing',
    risk_flags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignedStaff: ['Sarah Johnson'],
    lastLogAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    riskLevel: 'low',
    logCount7Days: 98,
  },
  {
    id: '3',
    organisation_id: 'org1',
    first_name: 'Dorothy',
    last_name: 'Brown',
    preferred_name: null,
    room_number: '108',
    photo_url: null,
    date_of_birth: '1945-11-08',
    admission_date: '2023-06-20',
    status: 'active',
    emergency_contact: { name: 'David Brown', phone: '07700 900789' },
    medical_info: {},
    dietary_requirements: 'Diabetic diet',
    mobility_notes: null,
    communication_needs: null,
    risk_flags: [{ type: 'diabetes', level: 'medium' }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignedStaff: ['Emma Wilson'],
    lastLogAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    riskLevel: 'medium',
    logCount7Days: 112,
  },
  {
    id: '4',
    organisation_id: 'org1',
    first_name: 'James',
    last_name: 'Anderson',
    preferred_name: 'Jim',
    room_number: '112',
    photo_url: null,
    date_of_birth: '1942-04-18',
    admission_date: '2023-03-05',
    status: 'active',
    emergency_contact: {},
    medical_info: {},
    dietary_requirements: null,
    mobility_notes: 'Independent',
    communication_needs: null,
    risk_flags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignedStaff: ['Mike Taylor'],
    lastLogAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    riskLevel: 'low',
    logCount7Days: 85,
  },
  {
    id: '5',
    organisation_id: 'org1',
    first_name: 'Elizabeth',
    last_name: 'Davis',
    preferred_name: 'Betty',
    room_number: '115',
    photo_url: null,
    date_of_birth: '1935-09-30',
    admission_date: '2021-12-01',
    status: 'active',
    emergency_contact: {},
    medical_info: {},
    dietary_requirements: 'Pureed',
    mobility_notes: 'Hoisted transfer',
    communication_needs: 'Non-verbal',
    risk_flags: [{ type: 'choking', level: 'high' }, { type: 'pressure', level: 'high' }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignedStaff: ['Sarah Johnson', 'Emma Wilson'],
    lastLogAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    riskLevel: 'high',
    logCount7Days: 168,
  },
]

export default function ResidentsManagementPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  const filteredResidents = useMemo(() => {
    let residents = [...DEMO_RESIDENTS]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      residents = residents.filter(
        r =>
          r.first_name.toLowerCase().includes(query) ||
          r.last_name.toLowerCase().includes(query) ||
          r.room_number?.includes(query)
      )
    }

    if (statusFilter !== 'all') {
      residents = residents.filter(r => r.status === statusFilter)
    }

    if (riskFilter !== 'all') {
      residents = residents.filter(r => r.riskLevel === riskFilter)
    }

    return residents
  }, [searchQuery, statusFilter, riskFilter])

  const stats = {
    total: DEMO_RESIDENTS.length,
    highRisk: DEMO_RESIDENTS.filter(r => r.riskLevel === 'high').length,
    active: DEMO_RESIDENTS.filter(r => r.status === 'active').length,
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resident Management</h1>
          <p className="text-gray-500">{stats.total} residents, {stats.highRisk} high risk</p>
        </div>
        <Button variant="primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Resident
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
              <p className="text-sm text-gray-500">Total Residents</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-care-green" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-care-red" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.highRisk}</p>
              <p className="text-sm text-gray-500">High Risk</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-5 w-5" />}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-12 px-4 rounded-button border border-surface-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)}
              className="h-12 px-4 rounded-button border border-surface-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Residents Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-surface-200 bg-surface-50">
                <th className="p-4 font-medium">Resident</th>
                <th className="p-4 font-medium">Room</th>
                <th className="p-4 font-medium">Risk</th>
                <th className="p-4 font-medium">Assigned Staff</th>
                <th className="p-4 font-medium">Last Log</th>
                <th className="p-4 font-medium text-center">7-Day Logs</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredResidents.map((resident) => (
                <tr key={resident.id} className="hover:bg-surface-50">
                  <td className="p-4">
                    <Link
                      href={`/dashboard/residents/${resident.id}`}
                      className="flex items-center gap-3"
                    >
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
                          DOB: {formatDate(resident.date_of_birth!)}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="p-4 text-gray-700">{resident.room_number}</td>
                  <td className="p-4">
                    <Chip
                      variant={
                        resident.riskLevel === 'high'
                          ? 'danger'
                          : resident.riskLevel === 'medium'
                          ? 'warning'
                          : 'success'
                      }
                      size="sm"
                    >
                      {resident.riskLevel}
                    </Chip>
                  </td>
                  <td className="p-4">
                    <div className="flex -space-x-2">
                      {resident.assignedStaff?.slice(0, 3).map((staff, idx) => (
                        <Avatar key={idx} name={staff} size="sm" className="ring-2 ring-white" />
                      ))}
                      {(resident.assignedStaff?.length || 0) > 3 && (
                        <span className="h-8 w-8 rounded-full bg-surface-200 text-gray-600 text-xs font-medium flex items-center justify-center ring-2 ring-white">
                          +{(resident.assignedStaff?.length || 0) - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {resident.lastLogAt ? formatDate(resident.lastLogAt) : 'Never'}
                  </td>
                  <td className="p-4 text-center font-medium text-gray-700">
                    {resident.logCount7Days}
                  </td>
                  <td className="p-4">
                    <Chip
                      variant={resident.status === 'active' ? 'success' : 'default'}
                      size="sm"
                    >
                      {resident.status}
                    </Chip>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/residents/${resident.id}`}
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

        {filteredResidents.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No residents match your search criteria
          </div>
        )}
      </Card>
    </div>
  )
}
