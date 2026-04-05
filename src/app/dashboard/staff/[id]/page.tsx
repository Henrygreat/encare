import { PlaceholderPage } from '@/components/layout/placeholder-page'

export default function DashboardStaffDetailPage({ params }: { params: { id: string } }) {
  return (
    <PlaceholderPage
      title={`Staff member ${params.id}`}
      description="Staff profile detail is now wired into the dashboard so every staff link has a valid destination."
      backHref="/dashboard/staff"
      bullets={[
        'Shift coverage, recent activity, and missed records.',
        'Role and permissions overview.',
        'Coaching notes and performance snapshots.',
      ]}
    />
  )
}
