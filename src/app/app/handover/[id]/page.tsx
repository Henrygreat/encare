import { PlaceholderPage } from '@/components/layout/placeholder-page'

export default function HandoverDetailPage({ params }: { params: { id: string } }) {
  return (
    <PlaceholderPage
      title={`Handover ${params.id}`}
      description="The handover route now resolves correctly and can be expanded into a full editable handover note page."
      backHref="/app/handover"
      bullets={[
        'Shift summary grouped by priority.',
        'Read receipts and acknowledgement status.',
        'Editable notes for senior carers or managers.',
      ]}
    />
  )
}
