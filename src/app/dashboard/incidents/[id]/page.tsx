import { PlaceholderPage } from '@/components/layout/placeholder-page'

export default function DashboardIncidentDetailPage({ params }: { params: { id: string } }) {
  return (
    <PlaceholderPage
      title={`Incident ${params.id}`}
      description="This detail page now resolves properly from dashboard incident links."
      backHref="/dashboard/incidents"
      bullets={[
        'Structured incident narrative and actions taken.',
        'Investigation notes and sign-off.',
        'Outcome status and follow-up timeline.',
      ]}
    />
  )
}
