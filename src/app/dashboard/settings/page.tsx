import { PlaceholderPage } from '@/components/layout/placeholder-page'

export default function DashboardSettingsPage() {
  return (
    <PlaceholderPage
      title="Workspace settings"
      description="Organisation settings now have a stable route for deployments and stakeholder demos."
      backHref="/dashboard"
      bullets={[
        'Branding, defaults, and task templates.',
        'Permission presets and staff invite flows.',
        'Reporting windows and environment health checks.',
      ]}
    />
  )
}
