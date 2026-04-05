import Link from 'next/link'
import { AuthShell } from '@/components/layout/auth-shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function SignupPage() {
  return (
    <AuthShell
      title="Set up your workspace"
      description="EnCare is designed for managed care teams. Request a setup call and we’ll get your organisation onboarded quickly."
      footer={<Link href="/login" className="text-sm font-medium text-primary-700">Already have a login? Sign in</Link>}
    >
      <div className="space-y-4">
        <Card className="border-primary-100 bg-primary-50/70" padding="md">
          <p className="text-sm text-slate-700">
            For the smoothest launch, we usually set up your first manager account, import sample residents,
            and configure your task templates for you.
          </p>
        </Card>
        <a href="mailto:hello@encare.app?subject=EnCare%20workspace%20setup" className="block">
          <Button fullWidth size="tap">Request onboarding</Button>
        </a>
      </div>
    </AuthShell>
  )
}
