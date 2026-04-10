'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LockKeyhole, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { AuthShell } from '@/components/layout/auth-shell'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setIsValidSession(true)
      } else {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        if (accessToken && type === 'recovery') {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })

          if (!sessionError) {
            setIsValidSession(true)
            window.history.replaceState(null, '', window.location.pathname)
            return
          }
        }

        setIsValidSession(false)
      }
    }

    void checkSession()
  }, [])

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(pwd)) return 'Password must contain an uppercase letter'
    if (!/[a-z]/.test(pwd)) return 'Password must contain a lowercase letter'
    if (!/[0-9]/.test(pwd)) return 'Password must contain a number'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validationError = validatePassword(password)
    if (validationError) {
      setError(validationError)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) throw updateError

      setIsSuccess(true)
      setTimeout(() => {
        router.replace('/login')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidSession === null) {
    return (
      <AuthShell
        title="Reset your password"
        description="Verifying your reset link..."
      >
        <div className="flex items-center justify-center py-10 text-sm text-slate-500">
          Verifying...
        </div>
      </AuthShell>
    )
  }

  if (isValidSession === false) {
    return (
      <AuthShell
        title="Link expired"
        description="This password reset link is no longer valid."
        footer={
          <Link href="/forgot-password" className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-800">
            Request a new reset link
          </Link>
        }
      >
        <div className="flex flex-col items-center py-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-slate-600">
            Password reset links expire after a short time for security.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Please request a new link to reset your password.
          </p>
        </div>
      </AuthShell>
    )
  }

  if (isSuccess) {
    return (
      <AuthShell
        title="Password updated"
        description="Your password has been changed successfully."
      >
        <div className="flex flex-col items-center py-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <p className="text-slate-600">
            You can now sign in with your new password.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Redirecting to login...
          </p>
          <Link href="/login">
            <Button variant="secondary" className="mt-6">
              Go to login
            </Button>
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Set new password"
      description="Choose a strong password for your account."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            label="New password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            disabled={isLoading}
            icon={<LockKeyhole className="h-4 w-4" />}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div className="relative">
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirm password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            disabled={isLoading}
            icon={<LockKeyhole className="h-4 w-4" />}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <p className="font-medium text-slate-700">Password requirements:</p>
          <ul className="mt-1.5 space-y-0.5">
            <li className={password.length >= 8 ? 'text-emerald-600' : ''}>
              • At least 8 characters
            </li>
            <li className={/[A-Z]/.test(password) ? 'text-emerald-600' : ''}>
              • One uppercase letter
            </li>
            <li className={/[a-z]/.test(password) ? 'text-emerald-600' : ''}>
              • One lowercase letter
            </li>
            <li className={/[0-9]/.test(password) ? 'text-emerald-600' : ''}>
              • One number
            </li>
          </ul>
        </div>

        <Button type="submit" fullWidth size="tap" isLoading={isLoading}>
          Update password
        </Button>
      </form>
    </AuthShell>
  )
}
