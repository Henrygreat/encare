'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter } from 'lucide-react'
import { MobileHeader, PageContainer } from '@/components/layout/mobile-header'
import { Input } from '@/components/ui/input'
import { ResidentCard, ResidentList } from '@/components/ui/resident-card'
import { Chip } from '@/components/ui/chip'
import type { Resident } from '@/lib/database.types'

// Demo data
const DEMO_RESIDENTS: Array<Resident & { statuses?: Array<{ type: 'med_due' | 'incident' | 'no_meal' | 'overdue_task' | 'alert'; label: string }>; isAssigned?: boolean }> = [
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
    emergency_contact: {},
    medical_info: {},
    dietary_requirements: 'Soft foods',
    mobility_notes: 'Wheelchair user',
    communication_needs: null,
    risk_flags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    isAssigned: true,
    statuses: [{ type: 'med_due', label: 'Med due' }],
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
    emergency_contact: {},
    medical_info: {},
    dietary_requirements: null,
    mobility_notes: 'Walking frame',
    communication_needs: 'Hard of hearing',
    risk_flags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    isAssigned: true,
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
    emergency_contact: {},
    medical_info: {},
    dietary_requirements: 'Diabetic diet',
    mobility_notes: null,
    communication_needs: null,
    risk_flags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    isAssigned: true,
    statuses: [{ type: 'no_meal', label: 'No meal' }],
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
    isAssigned: false,
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
    risk_flags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    isAssigned: false,
    statuses: [{ type: 'incident', label: 'Incident' }],
  },
  {
    id: '6',
    organisation_id: 'org1',
    first_name: 'William',
    last_name: 'Taylor',
    preferred_name: 'Bill',
    room_number: '118',
    photo_url: null,
    date_of_birth: '1939-01-12',
    admission_date: '2023-08-22',
    status: 'active',
    emergency_contact: {},
    medical_info: {},
    dietary_requirements: null,
    mobility_notes: null,
    communication_needs: null,
    risk_flags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    isAssigned: false,
  },
]

type FilterType = 'all' | 'assigned' | 'alerts'

export default function ResidentsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const filteredResidents = useMemo(() => {
    let residents = [...DEMO_RESIDENTS]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      residents = residents.filter(
        r =>
          r.first_name.toLowerCase().includes(query) ||
          r.last_name.toLowerCase().includes(query) ||
          r.preferred_name?.toLowerCase().includes(query) ||
          r.room_number?.includes(query)
      )
    }

    // Apply category filter
    if (activeFilter === 'assigned') {
      residents = residents.filter(r => r.isAssigned)
    } else if (activeFilter === 'alerts') {
      residents = residents.filter(r => r.statuses && r.statuses.length > 0)
    }

    // Sort: assigned first, then by name
    residents.sort((a, b) => {
      if (a.isAssigned && !b.isAssigned) return -1
      if (!a.isAssigned && b.isAssigned) return 1
      return a.first_name.localeCompare(b.first_name)
    })

    return residents
  }, [searchQuery, activeFilter])

  const assignedCount = DEMO_RESIDENTS.filter(r => r.isAssigned).length
  const alertsCount = DEMO_RESIDENTS.filter(r => r.statuses && r.statuses.length > 0).length

  return (
    <PageContainer
      header={<MobileHeader title="Residents" />}
    >
      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search by name or room..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="h-5 w-5" />}
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        <FilterChip
          active={activeFilter === 'all'}
          onClick={() => setActiveFilter('all')}
          count={DEMO_RESIDENTS.length}
        >
          All
        </FilterChip>
        <FilterChip
          active={activeFilter === 'assigned'}
          onClick={() => setActiveFilter('assigned')}
          count={assignedCount}
        >
          My Residents
        </FilterChip>
        <FilterChip
          active={activeFilter === 'alerts'}
          onClick={() => setActiveFilter('alerts')}
          count={alertsCount}
          variant="warning"
        >
          Needs Attention
        </FilterChip>
      </div>

      {/* Residents list */}
      <ResidentList
        residents={filteredResidents}
        onResidentClick={(resident) => router.push(`/app/residents/${resident.id}`)}
        emptyMessage={searchQuery ? 'No residents match your search' : 'No residents'}
      />
    </PageContainer>
  )
}

function FilterChip({
  children,
  active,
  onClick,
  count,
  variant = 'default',
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  count?: number
  variant?: 'default' | 'warning'
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors
        ${active
          ? variant === 'warning'
            ? 'bg-amber-500 text-white'
            : 'bg-primary-600 text-white'
          : 'bg-surface-100 text-gray-700 hover:bg-surface-200'
        }
      `}
    >
      {children}
      {count !== undefined && (
        <span className={`
          px-1.5 py-0.5 rounded-full text-xs
          ${active
            ? 'bg-white/20'
            : 'bg-surface-200'
          }
        `}>
          {count}
        </span>
      )}
    </button>
  )
}
