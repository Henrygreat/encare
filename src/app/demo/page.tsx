import Link from 'next/link'
import { ArrowRight, Sparkles, ShieldCheck, ClipboardList, Users } from 'lucide-react'
import { AuthShell } from '@/components/layout/auth-shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function DemoPage() {
  const cards = [
    { icon: Users, title: 'Residents at a glance', copy: 'Assigned residents, alerts, and room details grouped cleanly for each shift.' },
    { icon: ClipboardList, title: 'Fast daily logs', copy: 'Meals, mood, meds, toileting, and notes captured in a few taps.' },
    { icon: ShieldCheck, title: 'Safer oversight', copy: 'Managers can check exceptions, handovers, and follow-up actions quickly.' },
  ]

  return (
    <AuthShell
      title="Interactive product preview"
      description="This hosted build is wired for real authentication. Once you sign in, you’ll land in the working care team app."
      footer={<Link href="/login" className="text-sm font-medium text-primary-700">Back to sign in</Link>}
    >
      <div className="space-y-4">
        {cards.map(({ icon: Icon, title, copy }) => (
          <Card key={title} className="border-white/80 bg-white/82" padding="md">
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{copy}</p>
              </div>
            </div>
          </Card>
        ))}
        <Link href="/login" className="block pt-2">
          <Button fullWidth size="tap">
            Open live app
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </AuthShell>
  )
}
