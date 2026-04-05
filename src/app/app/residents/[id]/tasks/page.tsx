import { PlaceholderPage } from '@/components/layout/placeholder-page'

export default function ResidentTasksPage({ params }: { params: { id: string } }) {
  return (
    <PlaceholderPage
      title="Resident tasks"
      description="Task detail actions for this resident are ready for the next build step. The main task list already works, and this page keeps the route live so navigation feels complete."
      backHref={`/app/residents/${params.id}`}
      bullets={[
        'Prioritised task list for the selected resident.',
        'Mark complete, snooze, or escalate actions.',
        'Timeline context and assigned staff ownership.',
      ]}
    />
  )
}
