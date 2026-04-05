import { PlaceholderPage } from '@/components/layout/placeholder-page'

export default function ResidentNotesPage({ params }: { params: { id: string } }) {
  return (
    <PlaceholderPage
      title="Resident notes"
      description="A dedicated notes workspace is now wired in so links no longer break. You can use this page as the next feature slice for richer note capture and attachment support."
      backHref={`/app/residents/${params.id}`}
      bullets={[
        'Pinned care notes and quick observations.',
        'Attachments and evidence uploads.',
        'Shared visibility for the whole shift team.',
      ]}
    />
  )
}
