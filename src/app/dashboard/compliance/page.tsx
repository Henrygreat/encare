import { PlaceholderPage } from '@/components/layout/placeholder-page'

export default function DashboardCompliancePage() {
  return (
    <PlaceholderPage
      title="Compliance overview"
      description="This compliance route is now active so all dashboard links resolve cleanly during demos and testing."
      backHref="/dashboard"
      bullets={[
        'Outstanding documentation checks.',
        'Incomplete logs and missing handovers.',
        'Inspection-ready summaries by resident or team.',
      ]}
    />
  )
}
