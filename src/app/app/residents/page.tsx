'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, AlertTriangle } from 'lucide-react'
import { MobileHeader, PageContainer } from '@/components/layout/mobile-header'
import { Input } from '@/components/ui/input'
import { ResidentList } from '@/components/ui/resident-card'
import { useResidents, type ResidentWithStatus } from '@/lib/hooks/use-residents'

type FilterType = 'all' | 'assigned' | 'alerts'

export default function ResidentsPage() {
  const router = useRouter()
  const { residents, isLoading, error, refetch } = useResidents()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const filteredResidents = useMemo(() => {
    let filtered = [...residents]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        r =>
          r.first_name.toLowerCase().includes(query) ||
          r.last_name.toLowerCase().includes(query) ||
          r.preferred_name?.toLowerCase().includes(query) ||
          r.room_number?.includes(query)
      )
    }

    // Apply category filter
    if (activeFilter === 'assigned') {
      filtered = filtered.filter(r => r.isAssigned)
    } else if (activeFilter === 'alerts') {
      filtered = filtered.filter(r => r.statuses && r.statuses.length > 0)
    }

    // Sort: assigned first, then by name
    filtered.sort((a, b) => {
      if (a.isAssigned && !b.isAssigned) return -1
      if (!a.isAssigned && b.isAssigned) return 1
      return a.first_name.localeCompare(b.first_name)
    })

    return filtered
  }, [residents, searchQuery, activeFilter])

  const assignedCount = residents.filter(r => r.isAssigned).length
  const alertsCount = residents.filter(r => r.statuses && r.statuses.length > 0).length

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
          count={residents.length}
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

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load residents. <button onClick={refetch} className="underline">Try again</button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-surface-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-surface-200" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-surface-200 rounded mb-2" />
                  <div className="h-3 w-20 bg-surface-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredResidents.length === 0 ? (
        <div className="text-center py-12">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-surface-100 flex items-center justify-center">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">
            {searchQuery ? 'No residents match your search' : 'No residents yet'}
          </p>
          {!searchQuery && (
            <p className="text-sm text-gray-400 mt-1">
              Residents will appear here once added
            </p>
          )}
        </div>
      ) : (
        <ResidentList
          residents={filteredResidents}
          onResidentClick={(resident) => router.push(`/app/residents/${resident.id}`)}
          emptyMessage={searchQuery ? 'No residents match your search' : 'No residents'}
        />
      )}
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
