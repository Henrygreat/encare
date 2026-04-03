import Link from 'next/link'
import { ArrowRight, Shield, Zap, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="px-4 py-4">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <span className="text-xl font-bold text-gray-900">EnCare</span>
          </div>
          <Link href="/login">
            <Button variant="primary">Sign In</Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 text-balance">
            Care logging in{' '}
            <span className="text-primary-600">5 seconds</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto text-balance">
            The fastest, simplest care logging app for care homes and support workers.
            Log meals, meds, and more with just a few taps.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg">
                Try Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
            Built for busy care workers
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="h-8 w-8 text-amber-500" />}
              title="Lightning Fast"
              description="Log care in under 5 seconds with large tap targets and smart presets. No typing required."
            />
            <FeatureCard
              icon={<Smartphone className="h-8 w-8 text-primary-500" />}
              title="Works Offline"
              description="Keep logging even without internet. Data syncs automatically when you're back online."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-green-500" />}
              title="Secure & Compliant"
              description="Role-based access, audit trails, and secure data storage. Built for healthcare."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to simplify care logging?
          </h2>
          <p className="text-primary-100 mb-8">
            Start your free trial today. No credit card required.
          </p>
          <Link href="/login">
            <Button variant="secondary" size="lg">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 bg-gray-900 text-gray-400 text-sm text-center">
        <p>&copy; 2024 EnCare. Built for care.</p>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="text-center p-6">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-surface-50 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
