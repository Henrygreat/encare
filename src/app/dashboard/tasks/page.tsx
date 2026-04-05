import { PlaceholderPage } from '@/components/layout/placeholder-page'

export default function DashboardTasksPage() {
  return (
    <PlaceholderPage
      title="Manager tasks"
      description="Manager-level task operations are now wired into the dashboard. Use this page as the next build step for exception-driven oversight."
      backHref="/dashboard"
      bullets={[
        'Overdue task review and escalation workflows.',
        'Cross-team workload balancing.',
        'Exception-only filtering for busy managers.',
      ]}
    />
  )
}
