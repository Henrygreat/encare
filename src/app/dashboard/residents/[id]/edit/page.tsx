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

type FormErrors = {
  firstName?: string
  lastName?: string
  general?: string
}

export default function EditResidentPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { organisation, isLoading: authLoading } = useAuth()
  const { isManager, isLoading: managerLoading } = useRequireManager('/dashboard')
  const { showToast } = useToast()

  const residentId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id])

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [preferredName, setPreferredName] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [status, setStatus] = useState('active')
  const [dietaryRequirements, setDietaryRequirements] = useState('')
  const [mobilityNotes, setMobilityNotes] = useState('')
  const [communicationNeeds, setCommunicationNeeds] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    async function fetchResident() {
      if (!organisation?.id || !residentId) return

      setIsLoading(true)
      const { data, error } = await supabase
        .from('residents')
        .select('first_name, last_name, preferred_name, room_number, status, dietary_requirements, mobility_notes, communication_needs')
        .eq('id', residentId)
        .eq('organisation_id', organisation.id)
        .maybeSingle()

      if (error) {
        setErrors({ general: error.message })
        setIsLoading(false)
        return
      }

      if (!data) {
        setErrors({ general: 'Resident not found.' })
        setIsLoading(false)
        return
      }

      setFirstName(data.first_name)
      setLastName(data.last_name)
      setPreferredName(data.preferred_name || '')
      setRoomNumber(data.room_number || '')
      setStatus(data.status)
      setDietaryRequirements(data.dietary_requirements || '')
      setMobilityNotes(data.mobility_notes || '')
      setCommunicationNeeds(data.communication_needs || '')
      setIsLoading(false)
    }

    if (!authLoading) {
      void fetchResident()
    }
  }, [authLoading, organisation?.id, residentId, supabase])

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!firstName.trim()) nextErrors.firstName = 'First name is required.'
    if (!lastName.trim()) nextErrors.lastName = 'Last name is required.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!organisation?.id || !residentId || !validate()) return

    setIsSubmitting(true)
    const { error } = await supabase
      .from('residents')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        preferred_name: preferredName.trim() || null,
        room_number: roomNumber.trim() || null,
        status,
        dietary_requirements: dietaryRequirements.trim() || null,
        mobility_notes: mobilityNotes.trim() || null,
        communication_needs: communicationNeeds.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', residentId)
      .eq('organisation_id', organisation.id)

    if (error) {
      setErrors({ general: error.message })
      showToast({ title: 'Unable to update resident', description: error.message, variant: 'error' })
      setIsSubmitting(false)
      return
    }

    showToast({ title: 'Resident updated', variant: 'success' })
    router.push(`/dashboard/residents/${residentId}`)
  }

  if (authLoading || managerLoading || isLoading) {
    return <div className="py-12 text-center text-sm text-slate-500">Loading resident editor…</div>
  }

  if (!isManager) {
    return <div className="py-12 text-center text-sm text-slate-500">You do not have permission to edit residents.</div>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/residents/${residentId}`}><Button variant="ghost"><ArrowLeft className="h-4 w-4" />Back</Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit resident</h1>
          <p className="text-sm text-slate-600">Update resident details while preserving the existing resident workflow.</p>
        </div>
      </div>
      <Card padding="lg">
        <CardHeader><CardTitle>Resident details</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="First name" value={firstName} onChange={(event) => setFirstName(event.target.value)} error={errors.firstName} />
              <Input label="Last name" value={lastName} onChange={(event) => setLastName(event.target.value)} error={errors.lastName} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Preferred name" value={preferredName} onChange={(event) => setPreferredName(event.target.value)} />
              <Input label="Room number" value={roomNumber} onChange={(event) => setRoomNumber(event.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-12 w-full rounded-[14px] border border-slate-200/80 bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Dietary requirements</label>
              <textarea value={dietaryRequirements} onChange={(event) => setDietaryRequirements(event.target.value)} rows={3} className="flex w-full rounded-[14px] border border-slate-200/80 bg-white/92 px-4 py-3 text-base text-slate-900 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Mobility notes</label>
              <textarea value={mobilityNotes} onChange={(event) => setMobilityNotes(event.target.value)} rows={3} className="flex w-full rounded-[14px] border border-slate-200/80 bg-white/92 px-4 py-3 text-base text-slate-900 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Communication needs</label>
              <textarea value={communicationNeeds} onChange={(event) => setCommunicationNeeds(event.target.value)} rows={3} className="flex w-full rounded-[14px] border border-slate-200/80 bg-white/92 px-4 py-3 text-base text-slate-900 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            {errors.general ? <p className="text-sm text-care-red">{errors.general}</p> : null}
            <div className="flex justify-end gap-3">
              <Link href={`/dashboard/residents/${residentId}`}><Button type="button" variant="secondary">Cancel</Button></Link>
              <Button type="submit" isLoading={isSubmitting}>Save changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
