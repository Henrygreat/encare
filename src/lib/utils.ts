import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(date: string | Date) {
  return format(new Date(date), 'HH:mm')
}

export function formatDate(date: string | Date) {
  const d = new Date(date)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'dd MMM')
}

export function formatDateTime(date: string | Date) {
  const d = new Date(date)
  if (isToday(d)) return `Today ${format(d, 'HH:mm')}`
  if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`
  return format(d, 'dd MMM HH:mm')
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateOfflineId() {
  return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Log type configurations
export const LOG_TYPE_CONFIG = {
  meal: {
    label: 'Meal',
    icon: 'Utensils',
    color: 'bg-amber-100 text-amber-700',
    presets: ['All', 'Half', 'Little', 'Refused'],
  },
  drink: {
    label: 'Drink',
    icon: 'Coffee',
    color: 'bg-blue-100 text-blue-700',
    presets: ['Full', 'Half', 'Little', 'Refused'],
  },
  medication: {
    label: 'Medication',
    icon: 'Pill',
    color: 'bg-purple-100 text-purple-700',
    presets: ['Given', 'Refused', 'Not available', 'N/A'],
  },
  toileting: {
    label: 'Toileting',
    icon: 'Bath',
    color: 'bg-teal-100 text-teal-700',
    presets: ['Assisted', 'Independent', 'Refused', 'Issue'],
  },
  mood: {
    label: 'Mood',
    icon: 'Smile',
    color: 'bg-green-100 text-green-700',
    presets: ['Calm', 'Happy', 'Anxious', 'Upset', 'Other'],
  },
  personal_care: {
    label: 'Personal Care',
    icon: 'Heart',
    color: 'bg-pink-100 text-pink-700',
    presets: ['Wash', 'Shower', 'Dressing', 'Oral care'],
  },
  activity: {
    label: 'Activity',
    icon: 'Activity',
    color: 'bg-indigo-100 text-indigo-700',
    presets: ['Group activity', 'One-to-one', 'Walk', 'Exercise'],
  },
  observation: {
    label: 'Observation',
    icon: 'Eye',
    color: 'bg-gray-100 text-gray-700',
    presets: null,
  },
  incident: {
    label: 'Incident',
    icon: 'AlertTriangle',
    color: 'bg-red-100 text-red-700',
    presets: ['Fall', 'Behaviour', 'Medical', 'Safeguarding'],
  },
  note: {
    label: 'Note',
    icon: 'FileText',
    color: 'bg-slate-100 text-slate-700',
    presets: null,
  },
} as const

export type LogTypeKey = keyof typeof LOG_TYPE_CONFIG
