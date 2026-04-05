import Link from 'next/link'
import { ArrowLeft, Construction, Sparkles } from 'lucide-react'
import { PageContainer, MobileHeader } from '@/components/layout/mobile-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function PlaceholderPage({
  title,
  description,
  backHref,
  bullets,
}: {
  title: string
  description: string
  backHref: string
  bullets?: string[]
}) {
  return (
    <PageContainer
      header={<MobileHeader title={title} showBack backHref={backHref} />}
    >
      <Card variant="elevated" className="overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,249,255,0.94))]" padding="lg">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600/10 text-primary-700">
          <Construction className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
        <p className="mt-2 text-slate-600">{description}</p>
        {bullets?.length ? (
          <div className="mt-6 grid gap-3">
            {bullets.map((bullet) => (
              <div key={bullet} className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-3">
                <Sparkles className="mt-0.5 h-4 w-4 text-primary-600" />
                <p className="text-sm text-slate-700">{bullet}</p>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-6 flex gap-3">
          <Link href={backHref}>
            <Button variant="primary">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </Card>
    </PageContainer>
  )
}
