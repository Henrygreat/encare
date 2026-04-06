'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BellRing, CalendarClock, CheckCircle2, MapPin, ShieldAlert, User2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { MobileHeader, PageContainer } from '@/components/layout/mobile-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import type { IncidentSeverity } from '@/lib/database.types'

type IncidentRecord = {
  id: string
  organisation_id: string
  resident_id: string
  reported_by: string
  incident_type: string
  severity: IncidentSeverity
  description: string
  location: string | null
  occurred_at: string
  witnesses: any
  immediate_action: string | null
  follow_up_required: boolean
  follow_up_notes: string | null
  resolved_at: string | null
  resolved_by: string | null
  manager_notified_at: string | null
  family_notified_at: string | null
  residents: { id: string; first_name: string; last_name: string; preferred_name: string | null } | null
  reported_user: { full_name: string | null } | null
  resolved_user: { full_name: string | null } | null
}

type TimelineEntry = {
  id: string
  log_type: string
  notes: string | null
  logged_at: string
}

function formatDateTime(date: string | null) {
  if (!date) return 'Not recorded'
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function residentName(resident: IncidentRecord['residents']) {
  if (!resident) return 'Unknown resident'
  return resident.preferred_name || `${resident.first_name} ${resident.last_name}`
}

export default function DashboardIncidentDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const [incident, setIncident] = useState<IncidentRecord | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchIncident() {
      if (!user?.organisation_id) return
      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        const { data, error: incidentError } = await supabase
          .from('incidents')
          .select(`
            id,
            organisation_id,
            resident_id,
            reported_by,
            incident_type,
            severity,
            description,
            location,
            occurred_at,
            witnesses,
            immediate_action,
            follow_up_required,
            follow_up_notes,
            resolved_at,
            resolved_by,
            manager_notified_at,
            family_notified_at,
            residents(id, first_name, last_name, preferred_name),
            reported_user:users!reported_by(full_name),
            resolved_user:users!resolved_by(full_name)
          `)
          .eq('id', params.id)
          .eq('organisation_id', user.organisation_id)
          .single()

        if (incidentError) throw incidentError

        const occurredAt = new Date(data.occurred_at)
        const start = new Date(occurredAt.getTime() - 24 * 60 * 60 * 1000).toISOString()
        const end = new Date(occurredAt.getTime() + 24 * 60 * 60 * 1000).toISOString()

        const { data: timelineData, error: timelineError } = await supabase
          .from('daily_logs')
          .select('id, log_type, notes, logged_at')
          .eq('organisation_id', user.organisation_id)
          .eq('resident_id', data.resident_id)
          .gte('logged_at', start)
          .lte('logged_at', end)
          .order('logged_at', { ascending: false })
          .limit(8)

        if (timelineError) throw timelineError

        setIncident(data as unknown as IncidentRecord)
        setTimeline((timelineData || []) as TimelineEntry[])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load this incident right now.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchIncident()
  }, [params.id, user?.organisation_id])

  const witnessList = useMemo(() => {
    if (!incident?.witnesses) return []
    return Array.isArray(incident.witnesses) ? incident.witnesses : []
  }, [incident?.witnesses])

  if (isLoading) {
    return <PageContainer header={<MobileHeader title="Incident" backHref="/dashboard/incidents" />}><Card padding="lg"><p className="text-center text-slate-500">Loading incident…</p></Card></PageContainer>
  }

  if (error) {
    return <PageContainer header={<MobileHeader title="Incident" backHref="/dashboard/incidents" />}><Card padding="lg"><p className="text-center text-care-red">{error}</p></Card></PageContainer>
  }

  if (!incident) {
    return <PageContainer header={<MobileHeader title="Incident" backHref="/dashboard/incidents" />}><Card padding="lg"><p className="text-center text-slate-500">Incident not found.</p></Card></PageContainer>
  }

  return (
    <PageContainer header={<MobileHeader title={incident.incident_type} backHref="/dashboard/incidents" />}>
      <div className="space-y-4">
        <Card className="border-white/70 bg-gradient-to-br from-slate-900 via-slate-800 to-primary-700 text-white shadow-xl" padding="lg">
          <CardContent>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary-100">
                  <ShieldAlert className="h-3.5 w-3.5" /> Incident report
                </div>
                <h1 className="text-2xl font-semibold">{incident.incident_type}</h1>
                <p className="mt-2 text-sm text-slate-200">{residentName(incident.residents)} · {formatDateTime(incident.occurred_at)}</p>
              </div>
              <Chip variant={incident.severity === 'critical' || incident.severity === 'high' ? 'danger' : incident.severity === 'medium' ? 'warning' : 'default'} size="sm">{incident.severity}</Chip>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card padding="md">
            <CardHeader><CardTitle>Incident details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <DetailRow icon={<User2 className="h-4 w-4 text-slate-400" />} label="Resident" value={residentName(incident.residents)} />
              <DetailRow icon={<MapPin className="h-4 w-4 text-slate-400" />} label="Location" value={incident.location || 'Not specified'} />
              <DetailRow icon={<CalendarClock className="h-4 w-4 text-slate-400" />} label="Occurred" value={formatDateTime(incident.occurred_at)} />
              <div>
                <p className="text-sm text-slate-500">Description</p>
                <p className="mt-1 text-sm text-slate-800">{incident.description || 'No description provided.'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Immediate action</p>
                <p className="mt-1 text-sm text-slate-800">{incident.immediate_action || 'No immediate action recorded.'}</p>
              </div>
            </CardContent>
          </Card>

          <Card padding="md">
            <CardHeader><CardTitle>Resolution & notifications</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <DetailRow icon={<AlertTriangle className="h-4 w-4 text-slate-400" />} label="Reported by" value={incident.reported_user?.full_name || 'Unknown'} />
              <DetailRow icon={<CheckCircle2 className="h-4 w-4 text-slate-400" />} label="Resolved by" value={incident.resolved_user?.full_name || 'Not resolved'} />
              <DetailRow icon={<CheckCircle2 className="h-4 w-4 text-slate-400" />} label="Resolved at" value={formatDateTime(incident.resolved_at)} />
              <DetailRow icon={<BellRing className="h-4 w-4 text-slate-400" />} label="Manager notified" value={formatDateTime(incident.manager_notified_at)} />
              <DetailRow icon={<BellRing className="h-4 w-4 text-slate-400" />} label="Family notified" value={formatDateTime(incident.family_notified_at)} />
              <div>
                <p className="text-sm text-slate-500">Follow-up</p>
                <p className="mt-1 text-sm text-slate-800">{incident.follow_up_required ? incident.follow_up_notes || 'Follow-up is required but notes were not added yet.' : 'No further follow-up marked.'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card padding="md">
          <CardHeader><CardTitle>Witnesses</CardTitle></CardHeader>
          <CardContent>
            {witnessList.length === 0 ? <p className="text-sm text-slate-500">No witnesses were recorded for this incident.</p> : <div className="flex flex-wrap gap-2">{witnessList.map((witness, index) => <Chip key={`${witness}-${index}`} size="sm">{String(witness)}</Chip>)}</div>}
          </CardContent>
        </Card>

        <Card padding="md">
          <CardHeader><CardTitle>Resident timeline around the incident</CardTitle></CardHeader>
          <CardContent>
            {timeline.length === 0 ? <p className="text-sm text-slate-500">No resident logs were captured in the 24 hours around this incident.</p> : <div className="space-y-3">{timeline.map((entry) => <div key={entry.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3"><div className="flex items-center justify-between gap-3"><p className="font-medium capitalize text-slate-900">{entry.log_type.replace('_', ' ')}</p><span className="text-xs text-slate-500">{formatDateTime(entry.logged_at)}</span></div>{entry.notes ? <p className="mt-2 text-sm text-slate-700">{entry.notes}</p> : null}</div>)}</div>}
          </CardContent>
        </Card>

        <Link href={`/dashboard/residents/${incident.resident_id}`} className="inline-flex items-center gap-2 rounded-button bg-white px-4 py-3 text-sm font-medium text-primary-700 shadow-sm">
          View resident record
        </Link>
      </div>
    </PageContainer>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-start gap-3"><div className="mt-0.5">{icon}</div><div><p className="text-sm text-slate-500">{label}</p><p className="text-sm font-medium text-slate-900">{value}</p></div></div>
}
