'use client'

import { ChevronRight, AlertTriangle, Pill, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Resident } from '@/lib/database.types'
import { Avatar } from './avatar'
import { Chip } from './chip'

interface ResidentStatus {
  type: 'med_due' | 'incident' | 'no_meal' | 'overdue_task' | 'alert'
  label: string
}

interface ResidentCardProps {
  resident: Resident
  statuses?: ResidentStatus[]
  isAssigned?: boolean
  onClick?: () => void
  compact?: boolean
}

const statusConfig: Record<ResidentStatus['type'], { color: 'warning' | 'danger' | 'info'; icon: typeof AlertTriangle }> = {
  med_due: { color: 'warning', icon: Pill },
  incident: { color: 'danger', icon: AlertTriangle },
  no_meal: { color: 'warning', icon: Utensils },
  overdue_task: { color: 'danger', icon: AlertTriangle },
  alert: { color: 'danger', icon: AlertTriangle },
}

export function ResidentCard({
  resident,
  statuses = [],
  isAssigned = false,
  onClick,
  compact = false,
}: ResidentCardProps) {
  const displayName = resident.preferred_name || resident.first_name

  return (
    <div
      className={cn(
        'flex items-center gap-3 bg-white rounded-card border border-surface-200 transition-all',
        compact ? 'p-3' : 'p-4',
        onClick && 'cursor-pointer active:scale-[0.99] hover:shadow-card hover:border-primary-200',
        isAssigned && 'border-l-4 border-l-primary-500'
      )}
      onClick={onClick}
    >
      <Avatar
        src={resident.photo_url}
        name={`${resident.first_name} ${resident.last_name}`}
        size={compact ? 'md' : 'lg'}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={cn(
            'font-medium text-gray-900 truncate',
            compact ? 'text-base' : 'text-lg'
          )}>
            {displayName} {resident.last_name}
          </h4>
          {isAssigned && (
            <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">
              Assigned
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          {resident.room_number && (
            <span className="text-sm text-gray-500">
              Room {resident.room_number}
            </span>
          )}
        </div>

        {statuses.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {statuses.map((status, idx) => {
              const config = statusConfig[status.type]
              const Icon = config.icon
              return (
                <Chip
                  key={idx}
                  variant={config.color}
                  size="sm"
                  icon={<Icon className="h-3 w-3" />}
                >
                  {status.label}
                </Chip>
              )
            })}
          </div>
        )}
      </div>

      {onClick && (
        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
      )}
    </div>
  )
}

interface ResidentListProps {
  residents: Array<Resident & { statuses?: ResidentStatus[]; isAssigned?: boolean }>
  onResidentClick?: (resident: Resident) => void
  compact?: boolean
  emptyMessage?: string
}

export function ResidentList({
  residents,
  onResidentClick,
  compact = false,
  emptyMessage = 'No residents',
}: ResidentListProps) {
  if (residents.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {residents.map((resident) => (
        <ResidentCard
          key={resident.id}
          resident={resident}
          statuses={resident.statuses}
          isAssigned={resident.isAssigned}
          onClick={onResidentClick ? () => onResidentClick(resident) : undefined}
          compact={compact}
        />
      ))}
    </div>
  )
}
