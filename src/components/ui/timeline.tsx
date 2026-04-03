'use client'

import {
  Utensils,
  Coffee,
  Pill,
  Bath,
  Smile,
  Heart,
  Activity,
  Eye,
  AlertTriangle,
  FileText,
  CheckCircle,
  Clock,
  LucideIcon
} from 'lucide-react'
import { cn, formatTime, formatDate } from '@/lib/utils'
import type { TimelineEvent } from '@/lib/database.types'
import { Avatar } from './avatar'
import { Chip } from './chip'

const LOG_ICON_MAP: Record<string, LucideIcon> = {
  meal: Utensils,
  drink: Coffee,
  medication: Pill,
  toileting: Bath,
  mood: Smile,
  personal_care: Heart,
  activity: Activity,
  observation: Eye,
  incident: AlertTriangle,
  note: FileText,
  task: CheckCircle,
}

const LOG_COLOR_MAP: Record<string, string> = {
  meal: 'bg-amber-100 text-amber-600',
  drink: 'bg-blue-100 text-blue-600',
  medication: 'bg-purple-100 text-purple-600',
  toileting: 'bg-teal-100 text-teal-600',
  mood: 'bg-green-100 text-green-600',
  personal_care: 'bg-pink-100 text-pink-600',
  activity: 'bg-indigo-100 text-indigo-600',
  observation: 'bg-gray-100 text-gray-600',
  incident: 'bg-red-100 text-red-600',
  note: 'bg-slate-100 text-slate-600',
  task: 'bg-green-100 text-green-600',
}

interface TimelineItemProps {
  event: TimelineEvent
  userName?: string
  showDate?: boolean
}

export function TimelineItem({ event, userName, showDate }: TimelineItemProps) {
  const Icon = LOG_ICON_MAP[event.sub_type] || Clock
  const colorClass = LOG_COLOR_MAP[event.sub_type] || 'bg-gray-100 text-gray-600'

  const data = event.data as Record<string, unknown>
  const displayValue = data?.value || data?.status || data?.title || ''

  return (
    <div className="flex gap-3 py-3">
      <div className={cn('flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center', colorClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-gray-900 capitalize">
            {event.sub_type.replace('_', ' ')}
          </span>
          <span className="text-sm text-gray-500">
            {showDate ? formatDate(event.occurred_at) + ' ' : ''}
            {formatTime(event.occurred_at)}
          </span>
        </div>
        {displayValue && (
          <p className="text-sm text-gray-600 mt-0.5">
            {String(displayValue)}
          </p>
        )}
        {event.notes && (
          <p className="text-sm text-gray-500 mt-1 italic">
            {event.notes}
          </p>
        )}
        {userName && (
          <p className="text-xs text-gray-400 mt-1">
            by {userName}
          </p>
        )}
      </div>
    </div>
  )
}

interface TimelineProps {
  events: Array<TimelineEvent & { user_name?: string }>
  groupByDate?: boolean
  emptyMessage?: string
}

export function Timeline({ events, groupByDate = true, emptyMessage = 'No events yet' }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        {emptyMessage}
      </div>
    )
  }

  if (!groupByDate) {
    return (
      <div className="divide-y divide-surface-100">
        {events.map((event) => (
          <TimelineItem
            key={event.id}
            event={event}
            userName={event.user_name}
            showDate
          />
        ))}
      </div>
    )
  }

  // Group events by date
  const grouped = events.reduce((acc, event) => {
    const date = formatDate(event.occurred_at)
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {} as Record<string, typeof events>)

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, dateEvents]) => (
        <div key={date}>
          <div className="sticky top-0 bg-white py-2 z-10">
            <Chip variant="default" size="sm">{date}</Chip>
          </div>
          <div className="divide-y divide-surface-100">
            {dateEvents.map((event) => (
              <TimelineItem
                key={event.id}
                event={event}
                userName={event.user_name}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
