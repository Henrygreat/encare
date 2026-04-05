'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { AuthShell } from '@/components/layout/auth-shell'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
      })

      if (error) throw error
      setMessage('Password reset instructions have been sent if that email exists in your workspace.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset email right now.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Enter your email and we’ll send you a secure password reset link."
      footer={
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-primary-700">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="h-4 w-4" />}
          placeholder="name@carehome.com"
          required
        />
        <Button type="submit" fullWidth size="tap" isLoading={isLoading}>
          Send reset link
        </Button>
      </form>
    </AuthShell>
  )
}
