'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth-store'
import type {
  CarePlan,
  CarePlanInsert,
  CarePlanUpdate,
  CarePlanSection,
  CarePlanSectionUpdate,
  CarePlanAuditLog,
  CarePlanStatus,
  User,
} from '@/lib/database.types'

// Default section configuration
export const DEFAULT_CARE_PLAN_SECTIONS = [
  { key: 'dietary_requirements', label: 'Dietary Requirements', sortOrder: 1 },
  { key: 'mobility', label: 'Mobility', sortOrder: 2 },
  { key: 'communication', label: 'Communication', sortOrder: 3 },
  { key: 'medication_support', label: 'Medication Support', sortOrder: 4 },
  { key: 'personal_care', label: 'Personal Care', sortOrder: 5 },
  { key: 'behaviour_support', label: 'Behaviour Support', sortOrder: 6 },
  { key: 'risk_notes', label: 'Risk Notes', sortOrder: 7 },
  { key: 'care_instructions', label: 'Care Instructions', sortOrder: 8 },
  { key: 'escalation_guidance', label: 'Escalation Guidance', sortOrder: 9 },
] as const

// Sections that should be highlighted (risk-related)
export const HIGHLIGHTED_SECTIONS = ['risk_notes', 'escalation_guidance'] as const

// Extended types
export interface CarePlanWithSections extends CarePlan {
  sections: CarePlanSection[]
  resident_name?: string
  created_by_name?: string
  updated_by_name?: string
}

export interface CarePlanWithResident extends CarePlan {
  resident_name?: string
  has_viewed?: boolean
  sections?: CarePlanSection[]
}

export interface CarePlanVersionSummary {
  id: string
  version: number
  status: CarePlanStatus
  published_at: string | null
  created_at: string
  created_by_name?: string
}

// =======================
// GET ACTIVE CARE PLAN FOR A RESIDENT
// =======================

export function useCarePlan(residentId: string) {
  const [carePlan, setCarePlan] = useState<CarePlanWithResident | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()

  const fetchCarePlan = useCallback(async () => {
    if (!residentId) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Fetch active care plan with resident info and sections
      const { data: carePlanData, error: carePlanError } = await supabase
        .from('care_plans')
        .select(`
          *,
          residents (
            first_name,
            last_name,
            preferred_name
          ),
          care_plan_sections (
            id,
            section_key,
            section_label,
            content,
            sort_order
          )
        `)
        .eq('resident_id', residentId)
        .eq('status', 'active')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (carePlanError) {
        throw carePlanError
      }

      if (!carePlanData) {
        setCarePlan(null)
        return
      }

      // Check if current user has viewed this care plan
      let hasViewed = false
      if (user?.id) {
        const { data: viewData } = await supabase
          .from('care_plan_views')
          .select('id')
          .eq('care_plan_id', carePlanData.id)
          .eq('user_id', user.id)
          .limit(1)

        hasViewed = (viewData && viewData.length > 0) || false
      }

      const resident = Array.isArray(carePlanData.residents)
        ? carePlanData.residents[0]
        : carePlanData.residents

      const residentName = resident
        ? `${resident.preferred_name || resident.first_name} ${resident.last_name}`
        : undefined

      // Sort sections by sort_order
      const sections = (carePlanData.care_plan_sections || []).sort(
        (a: CarePlanSection, b: CarePlanSection) => a.sort_order - b.sort_order
      )

      setCarePlan({
        ...carePlanData,
        resident_name: residentName,
        has_viewed: hasViewed,
        sections,
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch care plan'))
    } finally {
      setIsLoading(false)
    }
  }, [residentId, user?.id])

  useEffect(() => {
    void fetchCarePlan()
  }, [fetchCarePlan])

  return { carePlan, isLoading, error, refetch: fetchCarePlan }
}

// =======================
// GET CARE PLAN BY ID (for editing)
// =======================

export function useCarePlanById(carePlanId: string | null) {
  const [carePlan, setCarePlan] = useState<CarePlanWithSections | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCarePlan = useCallback(async () => {
    if (!carePlanId) {
      setCarePlan(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('care_plans')
        .select(`
          *,
          residents (
            first_name,
            last_name,
            preferred_name
          ),
          care_plan_sections (
            id,
            section_key,
            section_label,
            content,
            sort_order
          ),
          creator:users!care_plans_created_by_fkey (
            full_name
          ),
          updater:users!care_plans_updated_by_fkey (
            full_name
          )
        `)
        .eq('id', carePlanId)
        .single()

      if (fetchError) throw fetchError

      const resident = Array.isArray(data.residents)
        ? data.residents[0]
        : data.residents

      const residentName = resident
        ? `${resident.preferred_name || resident.first_name} ${resident.last_name}`
        : undefined

      const sections = (data.care_plan_sections || []).sort(
        (a: CarePlanSection, b: CarePlanSection) => a.sort_order - b.sort_order
      )

      setCarePlan({
        ...data,
        sections,
        resident_name: residentName,
        created_by_name: (data.creator as any)?.full_name || undefined,
        updated_by_name: (data.updater as any)?.full_name || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch care plan'))
    } finally {
      setIsLoading(false)
    }
  }, [carePlanId])

  useEffect(() => {
    void fetchCarePlan()
  }, [fetchCarePlan])

  return { carePlan, isLoading, error, refetch: fetchCarePlan }
}

// =======================
// GET ALL CARE PLAN VERSIONS FOR A RESIDENT
// =======================

export function useCarePlanVersions(residentId: string) {
  const [versions, setVersions] = useState<CarePlanVersionSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchVersions = useCallback(async () => {
    if (!residentId) {
      setVersions([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('care_plans')
        .select(`
          id,
          version,
          status,
          published_at,
          created_at,
          creator:users!care_plans_created_by_fkey (
            full_name
          )
        `)
        .eq('resident_id', residentId)
        .order('version', { ascending: false })

      if (fetchError) throw fetchError

      setVersions(
        (data || []).map((v: any) => ({
          id: v.id,
          version: v.version,
          status: v.status as CarePlanStatus,
          published_at: v.published_at,
          created_at: v.created_at,
          created_by_name: (v.creator as any)?.full_name || undefined,
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch versions'))
    } finally {
      setIsLoading(false)
    }
  }, [residentId])

  useEffect(() => {
    void fetchVersions()
  }, [fetchVersions])

  return { versions, isLoading, error, refetch: fetchVersions }
}

// =======================
// GET DRAFT CARE PLAN FOR A RESIDENT
// =======================

export function useDraftCarePlan(residentId: string) {
  const [carePlan, setCarePlan] = useState<CarePlanWithSections | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchDraft = useCallback(async () => {
    if (!residentId) {
      setCarePlan(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('care_plans')
        .select(`
          *,
          residents (
            first_name,
            last_name,
            preferred_name
          ),
          care_plan_sections (
            id,
            section_key,
            section_label,
            content,
            sort_order
          )
        `)
        .eq('resident_id', residentId)
        .eq('status', 'draft')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fetchError) throw fetchError

      if (!data) {
        setCarePlan(null)
        return
      }

      const resident = Array.isArray(data.residents)
        ? data.residents[0]
        : data.residents

      const residentName = resident
        ? `${resident.preferred_name || resident.first_name} ${resident.last_name}`
        : undefined

      const sections = (data.care_plan_sections || []).sort(
        (a: CarePlanSection, b: CarePlanSection) => a.sort_order - b.sort_order
      )

      setCarePlan({
        ...data,
        sections,
        resident_name: residentName,
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch draft'))
    } finally {
      setIsLoading(false)
    }
  }, [residentId])

  useEffect(() => {
    void fetchDraft()
  }, [fetchDraft])

  return { carePlan, isLoading, error, refetch: fetchDraft }
}

// =======================
// GET CARE PLAN AUDIT LOGS
// =======================

export function useCarePlanAuditLogs(carePlanId: string | null) {
  const [logs, setLogs] = useState<(CarePlanAuditLog & { actor_name?: string })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchLogs = useCallback(async () => {
    if (!carePlanId) {
      setLogs([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('care_plan_audit_logs')
        .select(`
          *,
          actor:users!care_plan_audit_logs_actor_id_fkey (
            full_name
          )
        `)
        .eq('care_plan_id', carePlanId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) throw fetchError

      setLogs(
        (data || []).map((log: any) => ({
          ...log,
          actor_name: (log.actor as any)?.full_name || undefined,
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch audit logs'))
    } finally {
      setIsLoading(false)
    }
  }, [carePlanId])

  useEffect(() => {
    void fetchLogs()
  }, [fetchLogs])

  return { logs, isLoading, error, refetch: fetchLogs }
}

// =======================
// CARE PLAN ACTIONS
// =======================

export function useCarePlanActions() {
  const [isLoading, setIsLoading] = useState(false)

  // Create a new draft care plan
  const createDraftCarePlan = useCallback(
    async (
      residentId: string,
      data?: { title?: string; summary?: string; review_date?: string; next_review_date?: string }
    ): Promise<{ carePlan: CarePlan | null; error?: string }> => {
      setIsLoading(true)
      try {
        const supabase = createClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) throw new Error('Not authenticated')

        const { data: profile } = await supabase
          .from('users')
          .select('organisation_id')
          .eq('id', user.id)
          .single()

        if (!profile?.organisation_id) {
          throw new Error('No organisation found')
        }

        // Check for existing draft
        const { data: existingDraft } = await supabase
          .from('care_plans')
          .select('id')
          .eq('resident_id', residentId)
          .eq('status', 'draft')
          .maybeSingle()

        if (existingDraft) {
          throw new Error('A draft care plan already exists for this resident')
        }

        // Get the latest version number
        const { data: latestVersion } = await supabase
          .from('care_plans')
          .select('version')
          .eq('resident_id', residentId)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle()

        const newVersion = (latestVersion?.version || 0) + 1

        // Create the care plan
        const { data: newCarePlan, error: insertError } = await supabase
          .from('care_plans')
          .insert({
            organisation_id: profile.organisation_id,
            resident_id: residentId,
            title: data?.title || 'Care Plan',
            summary: data?.summary || null,
            status: 'draft',
            version: newVersion,
            review_date: data?.review_date || null,
            next_review_date: data?.next_review_date || null,
            created_by: user.id,
            updated_by: user.id,
          })
          .select()
          .single()

        if (insertError) throw insertError

        // Create default sections
        const sectionsToInsert = DEFAULT_CARE_PLAN_SECTIONS.map((section) => ({
          care_plan_id: newCarePlan.id,
          section_key: section.key,
          section_label: section.label,
          sort_order: section.sortOrder,
          content: null,
        }))

        const { error: sectionsError } = await supabase
          .from('care_plan_sections')
          .insert(sectionsToInsert)

        if (sectionsError) throw sectionsError

        // Create audit log
        await supabase.from('care_plan_audit_logs').insert({
          care_plan_id: newCarePlan.id,
          action: 'created',
          actor_id: user.id,
          details: { version: newVersion },
        })

        return { carePlan: newCarePlan }
      } catch (err) {
        console.error('Failed to create care plan:', err)
        return {
          carePlan: null,
          error: err instanceof Error ? err.message : 'Failed to create care plan',
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Update care plan details
  const updateCarePlan = useCallback(
    async (
      carePlanId: string,
      data: CarePlanUpdate
    ): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true)
      try {
        const supabase = createClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) throw new Error('Not authenticated')

        const { error: updateError } = await supabase
          .from('care_plans')
          .update({
            ...data,
            updated_by: user.id,
          })
          .eq('id', carePlanId)

        if (updateError) throw updateError

        // Create audit log
        await supabase.from('care_plan_audit_logs').insert({
          care_plan_id: carePlanId,
          action: 'updated',
          actor_id: user.id,
          details: { fields: Object.keys(data) },
        })

        return { success: true }
      } catch (err) {
        console.error('Failed to update care plan:', err)
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to update care plan',
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Update a section
  const updateSection = useCallback(
    async (
      sectionId: string,
      carePlanId: string,
      content: string | null
    ): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true)
      try {
        const supabase = createClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) throw new Error('Not authenticated')

        // Get section info for audit
        const { data: section } = await supabase
          .from('care_plan_sections')
          .select('section_key, section_label')
          .eq('id', sectionId)
          .single()

        const { error: updateError } = await supabase
          .from('care_plan_sections')
          .update({ content })
          .eq('id', sectionId)

        if (updateError) throw updateError

        // Update the care plan's updated_by and updated_at
        await supabase
          .from('care_plans')
          .update({ updated_by: user.id })
          .eq('id', carePlanId)

        // Create audit log
        await supabase.from('care_plan_audit_logs').insert({
          care_plan_id: carePlanId,
          action: 'section_updated',
          actor_id: user.id,
          details: {
            section_key: section?.section_key,
            section_label: section?.section_label,
          },
        })

        return { success: true }
      } catch (err) {
        console.error('Failed to update section:', err)
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to update section',
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Bulk update sections
  const updateSections = useCallback(
    async (
      carePlanId: string,
      updates: Array<{ id: string; content: string | null }>
    ): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true)
      try {
        const supabase = createClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) throw new Error('Not authenticated')

        // Update all sections
        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('care_plan_sections')
            .update({ content: update.content })
            .eq('id', update.id)

          if (updateError) throw updateError
        }

        // Update the care plan's updated_by
        await supabase
          .from('care_plans')
          .update({ updated_by: user.id })
          .eq('id', carePlanId)

        // Create audit log
        await supabase.from('care_plan_audit_logs').insert({
          care_plan_id: carePlanId,
          action: 'sections_updated',
          actor_id: user.id,
          details: { sections_count: updates.length },
        })

        return { success: true }
      } catch (err) {
        console.error('Failed to update sections:', err)
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to update sections',
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Publish care plan
  const publishCarePlan = useCallback(
    async (carePlanId: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true)
      try {
        const supabase = createClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) throw new Error('Not authenticated')

        // Get the care plan to verify it's a draft and get resident_id
        const { data: carePlan } = await supabase
          .from('care_plans')
          .select('id, status, resident_id')
          .eq('id', carePlanId)
          .single()

        if (!carePlan) throw new Error('Care plan not found')
        if (carePlan.status !== 'draft') throw new Error('Only draft care plans can be published')

        // Archive any existing active care plan for this resident
        await supabase
          .from('care_plans')
          .update({
            status: 'archived',
            updated_by: user.id,
          })
          .eq('resident_id', carePlan.resident_id)
          .eq('status', 'active')

        // Publish the new care plan
        const { error: publishError } = await supabase
          .from('care_plans')
          .update({
            status: 'active',
            published_at: new Date().toISOString(),
            updated_by: user.id,
          })
          .eq('id', carePlanId)

        if (publishError) throw publishError

        // Create audit log
        await supabase.from('care_plan_audit_logs').insert({
          care_plan_id: carePlanId,
          action: 'published',
          actor_id: user.id,
          details: {},
        })

        return { success: true }
      } catch (err) {
        console.error('Failed to publish care plan:', err)
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to publish care plan',
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Archive care plan
  const archiveCarePlan = useCallback(
    async (carePlanId: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true)
      try {
        const supabase = createClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) throw new Error('Not authenticated')

        const { error: archiveError } = await supabase
          .from('care_plans')
          .update({
            status: 'archived',
            updated_by: user.id,
          })
          .eq('id', carePlanId)

        if (archiveError) throw archiveError

        // Create audit log
        await supabase.from('care_plan_audit_logs').insert({
          care_plan_id: carePlanId,
          action: 'archived',
          actor_id: user.id,
          details: {},
        })

        return { success: true }
      } catch (err) {
        console.error('Failed to archive care plan:', err)
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to archive care plan',
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return {
    createDraftCarePlan,
    updateCarePlan,
    updateSection,
    updateSections,
    publishCarePlan,
    archiveCarePlan,
    isLoading,
  }
}

// =======================
// MARK CARE PLAN AS VIEWED
// =======================

export function useMarkCarePlanViewed() {
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuthStore()

  const markAsViewed = useCallback(
    async (carePlanId: string): Promise<{ success: boolean; error?: string }> => {
      if (!user?.id) {
        return { success: false, error: 'Not authenticated' }
      }

      setIsLoading(true)

      try {
        const supabase = createClient()

        // Check if already viewed
        const { data: existing } = await supabase
          .from('care_plan_views')
          .select('id')
          .eq('care_plan_id', carePlanId)
          .eq('user_id', user.id)
          .limit(1)

        if (existing && existing.length > 0) {
          // Already viewed
          return { success: true }
        }

        // Insert view record
        const { error } = await supabase.from('care_plan_views').insert({
          care_plan_id: carePlanId,
          user_id: user.id,
          viewed_at: new Date().toISOString(),
        })

        if (error) throw error

        return { success: true }
      } catch (err) {
        console.error('Failed to mark care plan as viewed:', err)
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to record view',
        }
      } finally {
        setIsLoading(false)
      }
    },
    [user?.id]
  )

  return { markAsViewed, isLoading }
}
