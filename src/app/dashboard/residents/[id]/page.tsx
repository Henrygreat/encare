import { PlaceholderPage } from '@/components/layout/placeholder-page'

export default function DashboardResidentDetailPage({ params }: { params: { id: string } }) {
  return (
    <PlaceholderPage
      title={`Resident ${params.id}`}
      description="Manager resident detail links now land on a real page instead of a 404."
      backHref="/dashboard/residents"
      bullets={[
        'Snapshot of current care, alerts, and tasks.',
        'Recent logs, incidents, and plan review dates.',
        'Quick path into reporting or staffing actions.',
      ]}
    />
  )
}
