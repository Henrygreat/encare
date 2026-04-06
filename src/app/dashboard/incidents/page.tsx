'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth-store'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { MobileHeader, PageContainer } from '@/components/layout/mobile-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { formatDate, formatRelativeTime } from '@/lib/utils'

export default function DashboardIncidentsPage() {
  const { user } = useAuthStore()
  const [incidents, setIncidents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchIncidents() {
      if (!user?.organisation_id) return

      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from('incidents')
          .select(`
            id,
            incident_type,
            severity,
            description,
            occurred_at,
            resolved_at,
            residents (first_name, last_name, preferred_name),
            users!reported_by (full_name)
          `)
          .eq('organisation_id', user.organisation_id)
          .order('occurred_at', { ascending: false })
          .limit(100)

        if (fetchError) throw fetchError
        setIncidents(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch incidents'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchIncidents()
  }, [user?.organisation_id])

  return (
    <PageContainer header={<MobileHeader title="Incidents" backHref="/dashboard" />}>
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading incidents...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">Error loading incidents</div>
        ) : incidents.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No incidents recorded</div>
        ) : (
          incidents.map((incident) => {
            const resident = Array.isArray(incident.residents) ? incident.residents[0] : incident.residents
            const reporter = Array.isArray(incident.users) ? incident.users[0] : incident.users

            return (
              <Link
                key={incident.id}
                href={`/dashboard/incidents/${incident.id}`}
              >
                <Card padding="md" className="cursor-pointer hover:shadow-card-hover transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-care-red" />
                        <span className="font-semibold text-gray-900">{incident.incident_type}</span>
                        <Chip
                          variant={incident.severity === 'high' ? 'danger' : incident.severity === 'medium' ? 'warning' : 'default'}
                          size="sm"
                        >
                          {incident.severity}
                        </Chip>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{incident.description || 'No description'}</p>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span>{resident?.first_name || 'Unknown'}</span>
                        <span>&middot;</span>
                        <span>{formatRelativeTime(incident.occurred_at)}</span>
                        {incident.resolved_at && (
                          <>
                            <span>&middot;</span>
                            <span className="text-care-green">Resolved</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </PageContainer>
  )
}
