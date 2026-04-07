'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Home, Calendar, Phone, AlertTriangle, Utensils, MessageSquare, Move } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRequireManager } from '@/lib/hooks/use-auth'
import type { ResidentInsert } from '@/lib/database.types'

type FormErrors = {
  first_name?: string
  last_name?: string
  room_number?: string
  date_of_birth?: string
  general?: string
}

export default function NewResidentPage() {
  const router = useRouter()
  const { organisation, user, isLoading: authLoading } = useAuth()
  const { isManager, isLoading: managerLoading } = useRequireManager()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [successMessage, setSuccessMessage] = useState('')

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [preferredName, setPreferredName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [admissionDate, setAdmissionDate] = useState('')
  const [emergencyContactName, setEmergencyContactName] = useState('')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('')
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('')
  const [dietaryRequirements, setDietaryRequirements] = useState('')
  const [mobilityNotes, setMobilityNotes] = useState('')
  const [communicationNeeds, setCommunicationNeeds] = useState('')

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!firstName.trim()) {
      newErrors.first_name = 'First name is required'
    }

    if (!lastName.trim()) {
      newErrors.last_name = 'Last name is required'
    }

    if (dateOfBirth) {
      const dob = new Date(dateOfBirth)
      const now = new Date()
      if (dob > now) {
        newErrors.date_of_birth = 'Date of birth cannot be in the future'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return
    if (!organisation?.id || !user?.id) {
      setErrors({ general: 'Session expired. Please refresh the page.' })
      return
    }

    setIsSubmitting(true)
    setErrors({})
    setSuccessMessage('')

    try {
      const supabase = createClient()

      const emergencyContact = emergencyContactName || emergencyContactPhone || emergencyContactRelation
        ? {
            name: emergencyContactName || null,
            phone: emergencyContactPhone || null,
            relationship: emergencyContactRelation || null,
          }
        : {}

      const residentData: ResidentInsert = {
        organisation_id: organisation.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        preferred_name: preferredName.trim() || null,
        date_of_birth: dateOfBirth || null,
        room_number: roomNumber.trim() || null,
        admission_date: admissionDate || new Date().toISOString().split('T')[0],
        status: 'active',
        emergency_contact: emergencyContact,
        medical_info: {},
        dietary_requirements: dietaryRequirements.trim() || null,
        mobility_notes: mobilityNotes.trim() || null,
        communication_needs: communicationNeeds.trim() || null,
        risk_flags: [],
      }

      const { data, error } = await supabase
        .from('residents')
        .insert(residentData)
        .select()
        .single()

      if (error) throw error

      setSuccessMessage(`${firstName} ${lastName} has been added successfully.`)

      // Redirect after brief delay to show success message
      setTimeout(() => {
        router.push('/dashboard/residents')
      }, 1500)
    } catch (err) {
      console.error('Failed to create resident:', err)
      setErrors({
        general: err instanceof Error ? err.message : 'Unable to add resident. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || managerLoading) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    )
  }

  if (!isManager) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <p className="text-slate-500">You do not have permission to add residents.</p>
        <Link href="/dashboard/residents">
          <Button variant="secondary" className="mt-4">Back to Residents</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/residents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add new resident</h1>
          <p className="text-sm text-slate-600">Enter the resident's details to add them to your care home.</p>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

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
              Basic information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="First name *"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={errors.first_name}
                placeholder="Enter first name"
                disabled={isSubmitting}
              />
              <Input
                label="Last name *"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                error={errors.last_name}
                placeholder="Enter last name"
                disabled={isSubmitting}
              />
            </div>
            <Input
              label="Preferred name"
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
              placeholder="What do they like to be called?"
              disabled={isSubmitting}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Date of birth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                error={errors.date_of_birth}
                disabled={isSubmitting}
              />
              <Input
                label="Admission date"
                type="date"
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        {/* Room Assignment */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary-600" />
              Room assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label="Room number"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g., 12A or Suite 3"
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary-600" />
              Emergency contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Contact name"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              placeholder="Full name of emergency contact"
              disabled={isSubmitting}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Phone number"
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="Contact phone number"
                disabled={isSubmitting}
              />
              <Input
                label="Relationship"
                value={emergencyContactRelation}
                onChange={(e) => setEmergencyContactRelation(e.target.value)}
                placeholder="e.g., Son, Daughter, Spouse"
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        {/* Care Notes */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary-600" />
              Care notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Dietary requirements
              </label>
              <textarea
                value={dietaryRequirements}
                onChange={(e) => setDietaryRequirements(e.target.value)}
                placeholder="Any allergies, preferences, or special diets..."
                rows={3}
                disabled={isSubmitting}
                className="flex w-full rounded-[14px] border border-slate-200/80 bg-white/92 px-4 py-3 text-base text-slate-900 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-surface-50 disabled:opacity-50 transition-all duration-200"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Mobility notes
              </label>
              <textarea
                value={mobilityNotes}
                onChange={(e) => setMobilityNotes(e.target.value)}
                placeholder="Mobility aids, assistance needed, fall risk..."
                rows={3}
                disabled={isSubmitting}
                className="flex w-full rounded-[14px] border border-slate-200/80 bg-white/92 px-4 py-3 text-base text-slate-900 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-surface-50 disabled:opacity-50 transition-all duration-200"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Communication needs
              </label>
              <textarea
                value={communicationNeeds}
                onChange={(e) => setCommunicationNeeds(e.target.value)}
                placeholder="Hearing aids, language preferences, cognitive considerations..."
                rows={3}
                disabled={isSubmitting}
                className="flex w-full rounded-[14px] border border-slate-200/80 bg-white/92 px-4 py-3 text-base text-slate-900 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-surface-50 disabled:opacity-50 transition-all duration-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/residents">
            <Button type="button" variant="secondary" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? 'Adding resident...' : 'Add resident'}
          </Button>
        </div>
      </form>
    </div>
  )
}
