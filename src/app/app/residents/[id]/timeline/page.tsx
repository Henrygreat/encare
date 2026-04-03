'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Filter, Calendar, Clock } from 'lucide-react'
import { MobileHeader, PageContainer } from '@/components/layout/mobile-header'
import { Card } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { Timeline } from '@/components/ui/timeline'
import { useResidentTimeline, type TimelineEventWithUser } from '@/lib/hooks/use-logs'
import { useResident } from '@/lib/hooks/use-residents'
import { LOG_TYPE_CONFIG, type LogTypeKey } from '@/lib/utils'
import type { LogType } from '@/lib/database.types'

const LOG_FILTERS: { value: LogType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'meal', label: 'Meals' },
  { value: 'drink', label: 'Drinks' },
  { value: 'medication', label: 'Meds' },
  { value: 'toileting', label: 'Toileting' },
  { value: 'mood', label: 'Mood' },
  { value: 'personal_care', label: 'Care' },
  { value: 'activity', label: 'Activity' },
  { value: 'observation', label: 'Obs' },
]

const DATE_FILTERS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: '7 days' },
  { value: 'month', label: '30 days' },
]

export default function TimelinePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { resident } = useResident(params.id)
  const { events, isLoading, refetch } = useResidentTimeline(params.id, 100)

  const [typeFilter, setTypeFilter] = useState<LogType | 'all'>('all')
  const [dateFilter, setDateFilter] = useState('today')
  const [showFilters, setShowFilters] = useState(false)

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    let filtered = [...events]

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(e => e.sub_type === typeFilter)
    }

    // Date filter
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfYesterday = new Date(startOfToday)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)

    if (dateFilter === 'today') {
      filtered = filtered.filter(e => new Date(e.occurred_at) >= startOfToday)
    } else if (dateFilter === 'yesterday') {
      filtered = filtered.filter(e => {
        const date = new Date(e.occurred_at)
        return date >= startOfYesterday && date < startOfToday
      })
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)
      filtered = filtered.filter(e => new Date(e.occurred_at) >= weekAgo)
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now)
      monthAgo.setDate(monthAgo.getDate() - 30)
      filtered = filtered.filter(e => new Date(e.occurred_at) >= monthAgo)
    }

    return filtered
  }, [events, typeFilter, dateFilter])

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: { [date: string]: TimelineEventWithUser[] } = {}

    filteredEvents.forEach(event => {
      const dateKey = new Date(event.occurred_at).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(event)
    })

    return groups
  }, [filteredEvents])

  const residentName = resident
    ? `${resident.preferred_name || resident.first_name} ${resident.last_name}`
    : 'Resident'

  return (
    <PageContainer
      header={
        <MobileHeader
          title="Timeline"
          subtitle={residentName}
          showBack
          backHref={`/app/residents/${params.id}`}
          rightAction={
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-full transition-colors ${
                showFilters ? 'bg-primary-100 text-primary-600' : 'text-gray-500'
              }`}
            >
              <Filter className="h-5 w-5" />
            </button>
          }
        />
      }
      noPadding
    >
      {/* Filters */}
      {showFilters && (
        <div className="bg-white border-b border-surface-200 p-4 space-y-3">
          {/* Date Filter */}
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Calendar className="h-4 w-4" />
              <span>Date range</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {DATE_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setDateFilter(filter.value)}
                  className={`
                    flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${dateFilter === filter.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-100 text-gray-700'
                    }
                  `}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Clock className="h-4 w-4" />
              <span>Log type</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {LOG_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setTypeFilter(filter.value)}
                  className={`
                    flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${typeFilter === filter.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-100 text-gray-700'
                    }
                  `}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="px-4 py-3 bg-surface-50 border-b border-surface-200">
        <p className="text-sm text-gray-600">
          {filteredEvents.length} {filteredEvents.length === 1 ? 'entry' : 'entries'}
          {typeFilter !== 'all' && ` for ${LOG_FILTERS.find(f => f.value === typeFilter)?.label}`}
        </p>
      </div>

      {/* Timeline Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} padding="md" className="animate-pulse">
                <div className="h-4 bg-surface-200 rounded w-1/3 mb-3"></div>
                <div className="h-3 bg-surface-100 rounded w-full mb-2"></div>
                <div className="h-3 bg-surface-100 rounded w-2/3"></div>
              </Card>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-surface-100 flex items-center justify-center">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No entries found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([date, dayEvents]) => (
              <div key={date}>
                <div className="sticky top-0 bg-surface-50 py-2 -mx-4 px-4 z-10">
                  <h3 className="text-sm font-semibold text-gray-500">{date}</h3>
                </div>
                <Timeline events={dayEvents} groupByDate={false} />
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
