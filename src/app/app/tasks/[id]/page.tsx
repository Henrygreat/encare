import { PlaceholderPage } from '@/components/layout/placeholder-page'

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  return (
    <PlaceholderPage
      title={`Task ${params.id}`}
      description="This route is active and ready for a richer task detail experience. It currently acts as a stable destination from the task cards instead of returning a 404."
      backHref="/app/tasks"
      bullets={[
        'Task summary, due time, and resident association.',
        'Action buttons for complete, snooze, and escalate.',
        'Comment stream and audit history.',
      ]}
    />
  )
}
