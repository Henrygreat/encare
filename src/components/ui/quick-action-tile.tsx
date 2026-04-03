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
  LucideIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LogType } from '@/lib/database.types'

const ICON_MAP: Record<LogType, LucideIcon> = {
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
}

const COLOR_MAP: Record<LogType, string> = {
  meal: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100',
  drink: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
  medication: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100',
  toileting: 'bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100',
  mood: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
  personal_care: 'bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100',
  activity: 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100',
  observation: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
  incident: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100',
  note: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100',
}

const LABEL_MAP: Record<LogType, string> = {
  meal: 'Meal',
  drink: 'Drink',
  medication: 'Medication',
  toileting: 'Toileting',
  mood: 'Mood',
  personal_care: 'Personal Care',
  activity: 'Activity',
  observation: 'Observation',
  incident: 'Incident',
  note: 'Note',
}

interface QuickActionTileProps {
  logType: LogType
  onClick: (logType: LogType) => void
  compact?: boolean
  className?: string
}

export function QuickActionTile({ logType, onClick, compact = false, className }: QuickActionTileProps) {
  const Icon = ICON_MAP[logType]
  const label = LABEL_MAP[logType]
  const colorClasses = COLOR_MAP[logType]

  return (
    <button
      onClick={() => onClick(logType)}
      className={cn(
        'flex flex-col items-center justify-center border-2 rounded-card transition-all active:scale-95',
        compact ? 'p-3 gap-1' : 'p-4 gap-2 min-h-[100px]',
        colorClasses,
        className
      )}
    >
      <Icon className={cn('flex-shrink-0', compact ? 'h-6 w-6' : 'h-8 w-8')} />
      <span className={cn('font-medium text-center', compact ? 'text-xs' : 'text-sm')}>
        {label}
      </span>
    </button>
  )
}

interface QuickActionGridProps {
  onSelect: (logType: LogType) => void
  compact?: boolean
  exclude?: LogType[]
}

export function QuickActionGrid({ onSelect, compact = false, exclude = [] }: QuickActionGridProps) {
  const logTypes: LogType[] = [
    'meal',
    'drink',
    'medication',
    'toileting',
    'mood',
    'personal_care',
    'activity',
    'observation',
    'incident',
    'note',
  ].filter(t => !exclude.includes(t as LogType)) as LogType[]

  return (
    <div className={cn(
      'grid gap-3',
      compact ? 'grid-cols-5' : 'grid-cols-2 sm:grid-cols-3'
    )}>
      {logTypes.map((logType) => (
        <QuickActionTile
          key={logType}
          logType={logType}
          onClick={onSelect}
          compact={compact}
        />
      ))}
    </div>
  )
}
