import { PlaceholderPage } from '@/components/layout/placeholder-page'

export default function DashboardIncidentsPage() {
  return (
    <PlaceholderPage
      title="Incident review"
      description="Manager incident review now has a stable route. It is ready for deeper reporting and follow-up workflows."
      backHref="/dashboard"
      bullets={[
        'Severity-based incident queue.',
        'Status tracking for investigation and closure.',
        'Linked residents, actions, and witness records.',
      ]}
    />
  )
}
