'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth, useRequireManager } from '@/lib/hooks/use-auth'
import { useToast } from '@/components/providers/toast-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { UserRole } from '@/lib/database.types'

type FormErrors = {
  fullName?: string
  email?: string
  general?: string
}

export default function EditStaffPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { organisation, isLoading: authLoading } = useAuth()
  const { isManager, isLoading: managerLoading } = useRequireManager('/dashboard')
  const { showToast } = useToast()

  const staffId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id])

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<UserRole>('carer')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    async function fetchStaff() {
      if (!organisation?.id || !staffId) return

      setIsLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('full_name, email, phone, role')
        .eq('id', staffId)
        .eq('organisation_id', organisation.id)
        .maybeSingle()

      if (error) {
        setErrors({ general: error.message })
        setIsLoading(false)
        return
      }

      if (!data) {
        setErrors({ general: 'Staff member not found.' })
        setIsLoading(false)
        return
      }

      setFullName(data.full_name)
      setEmail(data.email)
      setPhone(data.phone || '')
      setRole(data.role)
      setIsLoading(false)
    }

    if (!authLoading) {
      void fetchStaff()
    }
  }, [authLoading, organisation?.id, staffId, supabase])

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!fullName.trim()) nextErrors.fullName = 'Full name is required.'
    if (!email.trim()) nextErrors.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email address.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!organisation?.id || !staffId || !validate()) return

    setIsSubmitting(true)

    const { error } = await supabase
      .from('users')
      .update({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', staffId)
      .eq('organisation_id', organisation.id)

    if (error) {
      setErrors({ general: error.message })
      showToast({ title: 'Unable to update staff member', description: error.message, variant: 'error' })
      setIsSubmitting(false)
      return
    }

    showToast({ title: 'Staff member updated', variant: 'success' })
    router.push(`/dashboard/staff/${staffId}`)
  }

  if (authLoading || managerLoading || isLoading) {
    return <div className="py-12 text-center text-sm text-slate-500">Loading staff editor…</div>
  }

  if (!isManager) {
    return <div className="py-12 text-center text-sm text-slate-500">You do not have permission to edit staff.</div>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/staff/${staffId}`}><Button variant="ghost"><ArrowLeft className="h-4 w-4" />Back</Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit staff member</h1>
          <p className="text-sm text-slate-600">Update profile details without changing your authentication flow.</p>
        </div>
      </div>
      <Card padding="lg">
        <CardHeader><CardTitle>Profile details</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} error={errors.fullName} />
            <Input label="Email" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} />
            <Input label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
              <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="h-12 w-full rounded-[14px] border border-slate-200/80 bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="senior_carer">Senior carer</option>
                <option value="carer">Care worker</option>
              </select>
            </div>
            {errors.general ? <p className="text-sm text-care-red">{errors.general}</p> : null}
            <div className="flex justify-end gap-3">
              <Link href={`/dashboard/staff/${staffId}`}><Button type="button" variant="secondary">Cancel</Button></Link>
              <Button type="submit" isLoading={isSubmitting}>Save changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
