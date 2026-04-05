import Link from 'next/link'
import { Card } from '@/components/ui/card'

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_32%),linear-gradient(180deg,#f4f9ff_0%,#eef5ff_42%,#f8fafc_100%)]">
      <header className="px-4 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-600 shadow-[0_14px_32px_rgba(2,132,199,0.28)]">
              <span className="text-xl font-bold text-white">E</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">EnCare</p>
              <p className="text-xs text-slate-500">Modern care operations</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden lg:block">
            <div className="max-w-xl space-y-5">
              <span className="inline-flex items-center rounded-full border border-primary-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary-700 backdrop-blur">
                Care made simpler
              </span>
              <h1 className="text-5xl font-bold tracking-tight text-slate-950">
                Spend less time on paperwork and more time with residents.
              </h1>
              <p className="text-lg leading-8 text-slate-600">
                EnCare gives care teams a fast, calm, mobile-first workspace for daily logs,
                tasks, handovers, and oversight.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  '5-second quick logging',
                  'Live task and handover views',
                  'Cleaner manager oversight',
                  'Coolify-ready deployment setup',
                ].map((item) => (
                  <Card key={item} className="border-white/60 bg-white/75" padding="md">
                    <p className="text-sm font-medium text-slate-700">{item}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <Card className="mx-auto w-full max-w-lg border-white/80 bg-white/85" variant="elevated" padding="lg">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h2>
              <p className="mt-2 text-slate-600">{description}</p>
            </div>
            {children}
            {footer ? <div className="mt-6">{footer}</div> : null}
          </Card>
        </div>
      </main>
    </div>
  )
}
