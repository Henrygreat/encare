import { PlaceholderPage } from '@/components/layout/placeholder-page'

export default function ProfileSectionPage({ params }: { params: { section: string } }) {
  const title = params.section
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  return (
    <PlaceholderPage
      title={title}
      description="This settings area is now connected and ready for the next iteration, so your profile links no longer break."
      backHref="/app/profile"
      bullets={[
        'Consistent route structure for mobile settings pages.',
        'Room for organisation-specific preferences and notifications.',
        'Smooth path back to the main profile dashboard.',
      ]}
    />
  )
}
