'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Target,
  Shield,
  Heart,
  Check,
  ChevronDown,
  ChevronUp,
  Calendar,
  User
} from 'lucide-react'
import { MobileHeader, PageContainer } from '@/components/layout/mobile-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { formatDate } from '@/lib/utils'
import type { CarePlan } from '@/lib/database.types'

// Demo data
const DEMO_CARE_PLAN: CarePlan & { resident_name: string } = {
  id: 'cp1',
  resident_id: '1',
  title: 'Personal Care Plan',
  summary: 'Margaret requires assistance with most daily activities due to reduced mobility. She has diabetes which requires careful dietary management and regular blood sugar monitoring.',
  key_needs: [
    { category: 'Mobility', description: 'Wheelchair user, requires 2 staff for transfers using hoist' },
    { category: 'Personal Care', description: 'Full assistance with washing, dressing and toileting' },
    { category: 'Nutrition', description: 'Diabetic diet, soft foods only due to swallowing difficulties' },
    { category: 'Medication', description: 'Insulin twice daily, oral meds with meals' },
  ],
  key_risks: [
    { type: 'Falls', level: 'high', description: 'History of falls when attempting to mobilize independently', mitigation: 'Ensure call bell within reach, regular repositioning' },
    { type: 'Choking', level: 'medium', description: 'Dysphagia - difficulty swallowing', mitigation: 'Soft foods only, upright position during meals, supervise eating' },
    { type: 'Skin integrity', level: 'medium', description: 'At risk of pressure sores', mitigation: 'Regular repositioning every 2 hours, pressure mattress in use' },
  ],
  goals: [
    { description: 'Maintain current weight within 5% variance', status: 'on_track', target_date: '2024-06-30' },
    { description: 'Reduce anxiety during personal care', status: 'on_track', target_date: '2024-04-30' },
    { description: 'Improve participation in group activities', status: 'needs_attention', target_date: '2024-05-31' },
  ],
  interventions: [],
  review_date: '2024-04-15',
  last_reviewed_at: '2024-01-15T10:00:00Z',
  reviewed_by: 'u1',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  resident_name: 'Margaret Thompson',
}

export default function CarePlanPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [expandedSections, setExpandedSections] = useState<string[]>(['risks', 'needs'])
  const [markedAsViewed, setMarkedAsViewed] = useState(false)

  const carePlan = DEMO_CARE_PLAN
  const keyNeeds = carePlan.key_needs as Array<{ category: string; description: string }>
  const keyRisks = carePlan.key_risks as Array<{ type: string; level: string; description: string; mitigation: string }>
  const goals = carePlan.goals as Array<{ description: string; status: string; target_date: string }>

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    )
  }

  const handleMarkAsViewed = () => {
    setMarkedAsViewed(true)
    // Would record view in Supabase
  }

  return (
    <PageContainer
      header={
        <MobileHeader
          title="Care Plan"
          subtitle={carePlan.resident_name}
          showBack
          backHref={`/app/residents/${params.id}`}
        />
      }
    >
      {/* Summary */}
      <Card className="mb-4" padding="md">
        <CardContent>
          <p className="text-gray-700">{carePlan.summary}</p>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-surface-100 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Review: {formatDate(carePlan.review_date!)}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>Last reviewed: {formatDate(carePlan.last_reviewed_at!)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Risks */}
      <CollapsibleSection
        title="Key Risks"
        icon={<AlertTriangle className="h-5 w-5 text-care-red" />}
        expanded={expandedSections.includes('risks')}
        onToggle={() => toggleSection('risks')}
        badge={<Chip variant="danger" size="sm">{keyRisks.length}</Chip>}
      >
        <div className="space-y-3">
          {keyRisks.map((risk, idx) => (
            <div key={idx} className="p-3 bg-surface-50 rounded-button">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{risk.type}</span>
                <Chip
                  variant={risk.level === 'high' ? 'danger' : 'warning'}
                  size="sm"
                >
                  {risk.level}
                </Chip>
              </div>
              <p className="text-sm text-gray-600 mb-2">{risk.description}</p>
              <div className="text-sm">
                <span className="text-gray-500">Mitigation: </span>
                <span className="text-gray-700">{risk.mitigation}</span>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Key Needs */}
      <CollapsibleSection
        title="Key Needs"
        icon={<Heart className="h-5 w-5 text-pink-500" />}
        expanded={expandedSections.includes('needs')}
        onToggle={() => toggleSection('needs')}
      >
        <div className="space-y-3">
          {keyNeeds.map((need, idx) => (
            <div key={idx} className="p-3 bg-surface-50 rounded-button">
              <span className="font-medium text-gray-900 block mb-1">
                {need.category}
              </span>
              <p className="text-sm text-gray-600">{need.description}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Goals */}
      <CollapsibleSection
        title="Goals"
        icon={<Target className="h-5 w-5 text-primary-500" />}
        expanded={expandedSections.includes('goals')}
        onToggle={() => toggleSection('goals')}
      >
        <div className="space-y-3">
          {goals.map((goal, idx) => (
            <div key={idx} className="p-3 bg-surface-50 rounded-button">
              <div className="flex items-start justify-between gap-3">
                <p className="text-gray-700 flex-1">{goal.description}</p>
                <Chip
                  variant={goal.status === 'on_track' ? 'success' : 'warning'}
                  size="sm"
                >
                  {goal.status === 'on_track' ? 'On track' : 'Attention'}
                </Chip>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Target: {formatDate(goal.target_date)}
              </p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Mark as Viewed */}
      <div className="mt-6">
        <Button
          fullWidth
          size="tap"
          variant={markedAsViewed ? 'success' : 'primary'}
          onClick={handleMarkAsViewed}
          disabled={markedAsViewed}
        >
          {markedAsViewed ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              Marked as Viewed
            </>
          ) : (
            <>
              <Check className="h-5 w-5 mr-2" />
              Mark as Viewed
            </>
          )}
        </Button>
        <p className="text-center text-xs text-gray-500 mt-2">
          This confirms you have read and understood this care plan
        </p>
      </div>
    </PageContainer>
  )
}

function CollapsibleSection({
  title,
  icon,
  expanded,
  onToggle,
  badge,
  children,
}: {
  title: string
  icon: React.ReactNode
  expanded: boolean
  onToggle: () => void
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card className="mb-4" padding="none">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold text-gray-900">{title}</span>
          {badge}
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-surface-100 pt-4">
          {children}
        </div>
      )}
    </Card>
  )
}
