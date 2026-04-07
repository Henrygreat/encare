'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, User, Phone, Shield, Copy, Check } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRequireManager } from '@/lib/hooks/use-auth'
import type { UserRole } from '@/lib/database.types'

type FormErrors = {
  email?: string
  full_name?: string
  role?: string
  general?: string
}

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'carer', label: 'Care Worker', description: 'Basic care duties and daily logging' },
  { value: 'senior_carer', label: 'Senior Carer', description: 'Team lead with oversight capabilities' },
  { value: 'manager', label: 'Manager', description: 'Full dashboard access and staff management' },
]

export default function InviteStaffPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { isManager, isLoading: managerLoading } = useRequireManager()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [successData, setSuccessData] = useState<{
    email: string
    full_name: string
    tempPassword?: string
  } | null>(null)
  const [copiedPassword, setCopiedPassword] = useState(false)

  // Form state
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<UserRole>('carer')

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        newErrors.email = 'Please enter a valid email address'
      }
    }

    if (!fullName.trim()) {
      newErrors.full_name = 'Full name is required'
    } else if (fullName.trim().length < 2) {
      newErrors.full_name = 'Name must be at least 2 characters'
    }

    if (!role) {
      newErrors.role = 'Please select a role'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setErrors({})

    try {
      const response = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          role,
          phone: phone.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite staff member')
      }

      setSuccessData({
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        tempPassword: data.tempPassword,
      })
    } catch (err) {
      console.error('Failed to invite staff:', err)
      setErrors({
        general: err instanceof Error ? err.message : 'Unable to invite staff member. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyPassword = async () => {
    if (successData?.tempPassword) {
      await navigator.clipboard.writeText(successData.tempPassword)
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    }
  }

  const handleInviteAnother = () => {
    setSuccessData(null)
    setEmail('')
    setFullName('')
    setPhone('')
    setRole('carer')
    setCopiedPassword(false)
  }

  if (authLoading || managerLoading) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    )
  }

  if (!isManager) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-slate-500">You do not have permission to invite staff.</p>
        <Link href="/dashboard/staff">
          <Button variant="secondary" className="mt-4">Back to Staff</Button>
        </Link>
      </div>
    )
  }

  // Success state
  if (successData) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/staff">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Staff member invited</h1>
            <p className="text-sm text-slate-600">Share the login details with your new team member.</p>
          </div>
        </div>

        <Card padding="lg" className="border-emerald-200 bg-emerald-50/50">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">{successData.full_name}</h2>
                <p className="text-sm text-slate-600">{successData.email}</p>
              </div>
            </div>

            {successData.tempPassword && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="mb-2 text-sm font-medium text-amber-800">Temporary password</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-white px-3 py-2 font-mono text-sm">
                    {successData.tempPassword}
                  </code>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyPassword}
                    className="shrink-0"
                  >
                    {copiedPassword ? (
                      <><Check className="mr-1.5 h-4 w-4" />Copied</>
                    ) : (
                      <><Copy className="mr-1.5 h-4 w-4" />Copy</>
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-amber-700">
                  Share this password securely. The staff member should change it after first login.
                </p>
              </div>
            )}
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleInviteAnother}>
            Invite another
          </Button>
          <Link href="/dashboard/staff">
            <Button>Back to staff list</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/staff">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invite staff member</h1>
          <p className="text-sm text-slate-600">Add a new team member to your organisation.</p>
        </div>
      </div>

      {errors.general && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary-600" />
              Staff details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Full name *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.full_name}
              placeholder="Enter full name"
              disabled={isSubmitting}
              icon={<User className="h-4 w-4" />}
            />
            <Input
              label="Email address *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="staff@example.com"
              disabled={isSubmitting}
              icon={<Mail className="h-4 w-4" />}
            />
            <Input
              label="Phone number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
              disabled={isSubmitting}
              icon={<Phone className="h-4 w-4" />}
            />
          </CardContent>
        </Card>

        {/* Role Selection */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary-600" />
              Role & permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ROLE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all ${
                    role === option.value
                      ? 'border-primary-300 bg-primary-50/50 ring-2 ring-primary-200'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  } ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={role === option.value}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    disabled={isSubmitting}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{option.label}</div>
                    <div className="text-sm text-slate-500">{option.description}</div>
                  </div>
                </label>
              ))}
              {user?.role === 'admin' && (
                <label
                  className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all ${
                    role === 'admin'
                      ? 'border-purple-300 bg-purple-50/50 ring-2 ring-purple-200'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  } ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={role === 'admin'}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    disabled={isSubmitting}
                    className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">Administrator</div>
                    <div className="text-sm text-slate-500">Full system access including billing and organisation settings</div>
                  </div>
                </label>
              )}
            </div>
            {errors.role && (
              <p className="mt-2 text-sm text-care-red">{errors.role}</p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/staff">
            <Button type="button" variant="secondary" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? 'Sending invite...' : 'Send invite'}
          </Button>
        </div>
      </form>
    </div>
  )
}
