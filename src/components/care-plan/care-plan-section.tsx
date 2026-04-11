'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle, Phone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { HIGHLIGHTED_SECTIONS } from '@/lib/hooks'
import type { CarePlanSection } from '@/lib/database.types'

interface CarePlanSectionViewProps {
  section: CarePlanSection
  defaultExpanded?: boolean
  className?: string
}

export function CarePlanSectionView({
  section,
  defaultExpanded = false,
  className,
}: CarePlanSectionViewProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const isHighlighted = HIGHLIGHTED_SECTIONS.includes(
    section.section_key as (typeof HIGHLIGHTED_SECTIONS)[number]
  )

  const hasContent = section.content && section.content.trim().length > 0

  const getIcon = () => {
    if (section.section_key === 'risk_notes') {
      return <AlertTriangle className="h-5 w-5 text-amber-600" />
    }
    if (section.section_key === 'escalation_guidance') {
      return <Phone className="h-5 w-5 text-red-600" />
    }
    return null
  }

  return (
    <Card
      className={cn(
        isHighlighted && hasContent && 'border-l-4 border-l-amber-400',
        className
      )}
      padding="none"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left"
        type="button"
      >
        <div className="flex items-center gap-3">
          {getIcon()}
          <span className="font-semibold text-slate-900">{section.section_label}</span>
          {!hasContent && (
            <span className="text-sm text-slate-400">(No content)</span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </button>
      {isExpanded && (
        <CardContent className="border-t border-slate-100 pt-4">
          {hasContent ? (
            <p className="whitespace-pre-wrap text-slate-700">{section.content}</p>
          ) : (
            <p className="text-sm italic text-slate-400">
              No {section.section_label.toLowerCase()} recorded
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}

interface CarePlanSectionEditProps {
  section: CarePlanSection
  value: string
  onChange: (value: string) => void
  className?: string
}

export function CarePlanSectionEdit({
  section,
  value,
  onChange,
  className,
}: CarePlanSectionEditProps) {
  const isHighlighted = HIGHLIGHTED_SECTIONS.includes(
    section.section_key as (typeof HIGHLIGHTED_SECTIONS)[number]
  )

  const getIcon = () => {
    if (section.section_key === 'risk_notes') {
      return <AlertTriangle className="h-5 w-5 text-amber-600" />
    }
    if (section.section_key === 'escalation_guidance') {
      return <Phone className="h-5 w-5 text-red-600" />
    }
    return null
  }

  return (
    <Card
      className={cn(isHighlighted && 'border-l-4 border-l-amber-400', className)}
      padding="md"
    >
      <div className="mb-3 flex items-center gap-3">
        {getIcon()}
        <label className="font-semibold text-slate-900" htmlFor={section.id}>
          {section.section_label}
        </label>
      </div>
      <textarea
        id={section.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${section.section_label.toLowerCase()}...`}
        className="min-h-[100px] w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        rows={4}
      />
    </Card>
  )
}

interface CarePlanStatusBadgeProps {
  status: 'draft' | 'active' | 'archived'
  className?: string
}

export function CarePlanStatusBadge({ status, className }: CarePlanStatusBadgeProps) {
  const config = {
    draft: {
      label: 'Draft',
      className: 'bg-amber-100 text-amber-700',
    },
    active: {
      label: 'Active',
      className: 'bg-emerald-100 text-emerald-700',
    },
    archived: {
      label: 'Archived',
      className: 'bg-slate-100 text-slate-600',
    },
  }

  const { label, className: badgeClassName } = config[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        badgeClassName,
        className
      )}
    >
      {label}
    </span>
  )
}

interface EmptySectionMessageProps {
  sectionLabel: string
}

export function EmptySectionMessage({ sectionLabel }: EmptySectionMessageProps) {
  return (
    <p className="text-sm italic text-slate-400">
      No {sectionLabel.toLowerCase()} guidance recorded
    </p>
  )
}
