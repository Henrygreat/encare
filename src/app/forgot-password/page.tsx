'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { AuthShell } from '@/components/layout/auth-shell'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      })

      if (resetError) throw resetError
      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset email right now.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <AuthShell
        title="Check your email"
        description="If an account exists with that email, we've sent password reset instructions."
        footer={
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-800">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col items-center py-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <p className="text-slate-600">
            Please check your inbox and follow the link to reset your password.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Didn't receive an email? Check your spam folder or try again.
          </p>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => {
              setIsSubmitted(false)
              setEmail('')
            }}
          >
            Try another email
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Enter your email and we'll send you a secure reset link."
      footer={
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-800">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="h-4 w-4" />}
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={isLoading}
        />

        <Button type="submit" fullWidth size="tap" isLoading={isLoading}>
          Send reset link
        </Button>
      </form>
    </AuthShell>
  )
}
