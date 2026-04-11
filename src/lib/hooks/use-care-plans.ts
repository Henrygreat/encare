'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth-store'
import type {
  CarePlan,
  CarePlanUpdate,
  CarePlanSection,
  CarePlanAuditLog,
  CarePlanStatus,
} from '@/lib/database.types'

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

export const HIGHLIGHTED_SECTIONS = ['risk_notes', 'escalation_guidance'] as const

type ResidentRelation = {
  first_name?: string | null
  last_name?: string | null
  preferred_name?: string | null
}

type UserRelation = {
  full_name?: string | null
}

type CarePlanSectionRow = {
  id: string
  section_key: string | null
  section_label: string | null
  content: string | null
  sort_order: number | null
}

type CarePlanRowWithRelations = CarePlan & {
  residents?: ResidentRelation | ResidentRelation[] | null
  care_plan_sections?: CarePlanSectionRow[] | null
  creator?: UserRelation | UserRelation[] | null
  updater?: UserRelation | UserRelation[] | null
}

type CarePlanVersionRow = {
  id: string
  version: number
  status: CarePlanStatus
  published_at: string | null
  created_at: string
  creator?: UserRelation | UserRelation[] | null
}

type CarePlanAuditLogRow = CarePlanAuditLog & {
  actor?: UserRelation | UserRelation[] | null
}

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

function pickSingleRelation<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) return value[0]
  return value ?? undefined
}

function buildResidentName(resident?: ResidentRelation): string | undefined {
  if (!resident) return undefined

  const first = resident.preferred_name || resident.first_name || ''
  const last = resident.last_name || ''
  const full = `${first} ${last}`.trim()

  return full || undefined
}

function normalizeSections(
  sections: CarePlanSectionRow[] | null | undefined
): CarePlanSection[] {
  return (sections || [])
    .map(
      (section) =>
        ({
          id: section.id,
          section_key: section.section_key ?? '',
          section_label: section.section_label ?? '',
          content: section.content ?? null,
          sort_order: section.sort_order ?? 0,
        }) as CarePlanSection
    )
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
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
    if (!residentId) {
      setCarePlan(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error: carePlanError } = await supabase
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

      if (carePlanError) throw carePlanError

      if (!data) {
        setCarePlan(null)
        return
      }

      const typedData = data as unknown as CarePlanRowWithRelations

      let hasViewed = false

      if (user?.id) {
        const { data: viewData, error: viewError } = await supabase
          .from('care_plan_views')
          .select('id')
          .eq('care_plan_id', typedData.id)
          .eq('user_id', user.id)
          .limit(1)

        if (!viewError) {
          hasViewed = (viewData?.length || 0) > 0
        }
      }

      const resident = pickSingleRelation(typedData.residents)
      const sections = normalizeSections(typedData.care_plan_sections)

      setCarePlan({
        ...typedData,
        resident_name: buildResidentName(resident),
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
        .maybeSingle()

      if (fetchError) throw fetchError

      if (!data) {
        setCarePlan(null)
        return
      }

      const typedData = data as unknown as CarePlanRowWithRelations
      const resident = pickSingleRelation(typedData.residents)
      const creator = pickSingleRelation(typedData.creator)
      const updater = pickSingleRelation(typedData.updater)
      const sections = normalizeSections(typedData.care_plan_sections)

      setCarePlan({
        ...typedData,
        sections,
        resident_name: buildResidentName(resident),
        created_by_name: creator?.full_name || undefined,
        updated_by_name: updater?.full_name || undefined,
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

      const rows = (data || []) as CarePlanVersionRow[]

      setVersions(
        rows.map((row) => {
          const creator = pickSingleRelation(row.creator)

          return {
            id: row.id,
            version: row.version,
            status: row.status,
            published_at: row.published_at,
            created_at: row.created_at,
            created_by_name: creator?.full_name || undefined,
          }
        })
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

      const typedData = data as unknown as CarePlanRowWithRelations
      const resident = pickSingleRelation(typedData.residents)
      const sections = normalizeSections(typedData.care_plan_sections)

      setCarePlan({
        ...typedData,
        sections,
        resident_name: buildResidentName(resident),
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
  const [logs, setLogs] = useState<Array<CarePlanAuditLog & { actor_name?: string }>>([])
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

      const rows = (data || []) as CarePlanAuditLogRow[]

      setLogs(
        rows.map((row) => {
          const actor = pickSingleRelation(row.actor)

          return {
            ...row,
            actor_name: actor?.full_name || undefined,
          }
        })
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

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('organisation_id')
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError
        if (!profile?.organisation_id) throw new Error('No organisation found')

        const { data: existingDraft, error: existingDraftError } = await supabase
          .from('care_plans')
          .select('id')
          .eq('resident_id', residentId)
          .eq('status', 'draft')
          .maybeSingle()

        if (existingDraftError) throw existingDraftError
        if (existingDraft) {
          throw new Error('A draft care plan already exists for this resident')
        }

        const { data: latestVersion, error: latestVersionError } = await supabase
          .from('care_plans')
          .select('version')
          .eq('resident_id', residentId)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (latestVersionError) throw latestVersionError

        const newVersion = (latestVersion?.version || 0) + 1

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

        const sectionsToInsert = DEFAULT_CARE_PLAN_SECTIONS.map((section) => ({
          care_plan_id: newCarePlan.id,
          section_key: section.key,
          section_label: section.label,
          section_type: section.key,
          sort_order: section.sortOrder,
          content: null,
        }))

        const { error: sectionsError } = await supabase
          .from('care_plan_sections')
          .insert(sectionsToInsert)

        if (sectionsError) throw sectionsError

        const { error: auditError } = await supabase
          .from('care_plan_audit_logs')
          .insert({
            care_plan_id: newCarePlan.id,
            action: 'created',
            actor_id: user.id,
            details: { version: newVersion },
          })

        if (auditError) throw auditError

        return { carePlan: newCarePlan as CarePlan }
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

        const { error: auditError } = await supabase
          .from('care_plan_audit_logs')
          .insert({
            care_plan_id: carePlanId,
            action: 'updated',
            actor_id: user.id,
            details: { fields: Object.keys(data) },
          })

        if (auditError) throw auditError

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

        const { data: section, error: sectionError } = await supabase
          .from('care_plan_sections')
          .select('section_key, section_label')
          .eq('id', sectionId)
          .single()

        if (sectionError) throw sectionError

        const { error: updateError } = await supabase
          .from('care_plan_sections')
          .update({ content })
          .eq('id', sectionId)

        if (updateError) throw updateError

        const { error: touchPlanError } = await supabase
          .from('care_plans')
          .update({ updated_by: user.id })
          .eq('id', carePlanId)

        if (touchPlanError) throw touchPlanError

        const { error: auditError } = await supabase
          .from('care_plan_audit_logs')
          .insert({
            care_plan_id: carePlanId,
            action: 'updated',
            actor_id: user.id,
            details: {
              section_key: section?.section_key,
              section_label: section?.section_label,
            },
          })

        if (auditError) throw auditError

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

        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('care_plan_sections')
            .update({ content: update.content })
            .eq('id', update.id)

          if (updateError) throw updateError
        }

        const { error: touchPlanError } = await supabase
          .from('care_plans')
          .update({ updated_by: user.id })
          .eq('id', carePlanId)

        if (touchPlanError) throw touchPlanError

        const { error: auditError } = await supabase
          .from('care_plan_audit_logs')
          .insert({
            care_plan_id: carePlanId,
            action: 'updated',
            actor_id: user.id,
            details: { sections_count: updates.length },
          })

        if (auditError) throw auditError

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

  const publishCarePlan = useCallback(
    async (carePlanId: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true)

      try {
        const supabase = createClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) throw new Error('Not authenticated')

        const { data: carePlan, error: carePlanError } = await supabase
          .from('care_plans')
          .select('id, status, resident_id')
          .eq('id', carePlanId)
          .single()

        if (carePlanError) throw carePlanError
        if (!carePlan) throw new Error('Care plan not found')
        if (carePlan.status !== 'draft') throw new Error('Only draft care plans can be published')

        const { error: archiveExistingError } = await supabase
          .from('care_plans')
          .update({
            status: 'archived',
            updated_by: user.id,
          })
          .eq('resident_id', carePlan.resident_id)
          .eq('status', 'active')

        if (archiveExistingError) throw archiveExistingError

        const { error: publishError } = await supabase
          .from('care_plans')
          .update({
            status: 'active',
            published_at: new Date().toISOString(),
            updated_by: user.id,
          })
          .eq('id', carePlanId)

        if (publishError) throw publishError

        const { error: auditError } = await supabase
          .from('care_plan_audit_logs')
          .insert({
            care_plan_id: carePlanId,
            action: 'published',
            actor_id: user.id,
            details: {},
          })

        if (auditError) throw auditError

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

        const { error: auditError } = await supabase
          .from('care_plan_audit_logs')
          .insert({
            care_plan_id: carePlanId,
            action: 'archived',
            actor_id: user.id,
            details: {},
          })

        if (auditError) throw auditError

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

        const { data: existing, error: existingError } = await supabase
          .from('care_plan_views')
          .select('id')
          .eq('care_plan_id', carePlanId)
          .eq('user_id', user.id)
          .limit(1)

        if (existingError) throw existingError

        if (existing && existing.length > 0) {
          return { success: true }
        }

        const { error } = await supabase
          .from('care_plan_views')
          .insert({
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