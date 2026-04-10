'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  Database,
  Policy,
  PolicyInsert,
  PolicyUpdate,
  PolicyAssignment,
  PolicyAssignmentInsert,
  PolicyAcknowledgement,
  PolicyAcknowledgementInsert,
  User,
} from '@/lib/database.types'

// Base row types
type PolicyRow = Database['public']['Tables']['policies']['Row']
type PolicyAssignmentRow = Database['public']['Tables']['policy_assignments']['Row']
type PolicyAcknowledgementRow =
  Database['public']['Tables']['policy_acknowledgements']['Row']

type PolicyAssignmentWithUserRow = PolicyAssignmentRow & {
  user: Pick<User, 'id' | 'full_name' | 'email' | 'role'>
}

type PolicyAssignmentWithPolicyRow = PolicyAssignmentRow & {
  policy: PolicyRow | null
}

// Extended types
export interface PolicyWithCreator extends Policy {
  creator?: Pick<User, 'id' | 'full_name' | 'email'>
}

export interface PolicyWithStats extends PolicyWithCreator {
  total_assigned: number
  total_acknowledged: number
}

export interface PolicyAssignmentWithUser extends PolicyAssignment {
  user: Pick<User, 'id' | 'full_name' | 'email' | 'role'>
  acknowledgement?: PolicyAcknowledgement | null
}

export interface AssignedPolicyForStaff extends Policy {
  assignment: PolicyAssignment
  acknowledgement?: PolicyAcknowledgement | null
  is_acknowledged: boolean
}

// =======================
// POLICIES LIST
// =======================

export function usePolicies() {
  const [policies, setPolicies] = useState<PolicyWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchPolicies = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('policies')
        .select(`
          *,
          creator:users!policies_created_by_fkey(id, full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const safePolicies = (data || []) as unknown as PolicyWithCreator[]

      const policiesWithStats: PolicyWithStats[] = await Promise.all(
        safePolicies.map(async (policy) => {
          const { count: assignedCount } = await supabase
            .from('policy_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('policy_id', policy.id)

          const { count: ackCount } = await supabase
            .from('policy_acknowledgements')
            .select('*', { count: 'exact', head: true })
            .eq('policy_id', policy.id)
            .eq('version_read', policy.version)

          return {
            ...policy,
            total_assigned: assignedCount || 0,
            total_acknowledged: ackCount || 0,
          }
        }),
      )

      setPolicies(policiesWithStats)
    } catch (err) {
      console.error('Error fetching policies:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch policies'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchPolicies()
  }, [fetchPolicies])

  return { policies, isLoading, error, refetch: fetchPolicies }
}

// =======================
// SINGLE POLICY
// =======================

export function usePolicy(policyId: string | null) {
  const [policy, setPolicy] = useState<PolicyWithCreator | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchPolicy = useCallback(async () => {
    if (!policyId) {
      setPolicy(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('policies')
        .select(`
          *,
          creator:users!policies_created_by_fkey(id, full_name, email)
        `)
        .eq('id', policyId)
        .single()

      if (error) throw error

      const typed = data as unknown as PolicyWithCreator
      setPolicy(typed || null)
    } catch (err) {
      console.error('Error fetching policy:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch policy'))
    } finally {
      setIsLoading(false)
    }
  }, [policyId])

  useEffect(() => {
    void fetchPolicy()
  }, [fetchPolicy])

  return { policy, isLoading, error, refetch: fetchPolicy }
}

// =======================
// POLICY ASSIGNMENTS
// =======================

export function usePolicyAssignments(policyId: string | null) {
  const [assignments, setAssignments] = useState<PolicyAssignmentWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAssignments = useCallback(async () => {
    if (!policyId) {
      setAssignments([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data: policy } = await supabase
        .from('policies')
        .select('version')
        .eq('id', policyId)
        .single()

      const currentVersion = policy?.version || 1

      const { data, error } = await supabase
        .from('policy_assignments')
        .select(`
          *,
          user:users!policy_assignments_user_id_fkey(id, full_name, email, role)
        `)
        .eq('policy_id', policyId)
        .order('assigned_at', { ascending: false })

      if (error) throw error

      const safeAssignments = (data || []) as PolicyAssignmentWithUserRow[]

      const result: PolicyAssignmentWithUser[] = await Promise.all(
        safeAssignments.map(async (assignment) => {
          const { data: ack } = await supabase
            .from('policy_acknowledgements')
            .select('*')
            .eq('policy_id', policyId)
            .eq('user_id', assignment.user_id)
            .eq('version_read', currentVersion)
            .maybeSingle()

          return {
            ...assignment,
            user: assignment.user,
            acknowledgement: (ack as PolicyAcknowledgementRow | null) || null,
          }
        }),
      )

      setAssignments(result)
    } catch (err) {
      console.error('Error fetching assignments:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch assignments'))
    } finally {
      setIsLoading(false)
    }
  }, [policyId])

  useEffect(() => {
    void fetchAssignments()
  }, [fetchAssignments])

  return { assignments, isLoading, error, refetch: fetchAssignments }
}

// =======================
// MY POLICIES
// =======================

export function useMyPolicies() {
  const [policies, setPolicies] = useState<AssignedPolicyForStaff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchMyPolicies = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const { data: assignments, error: assignError } = await supabase
        .from('policy_assignments')
        .select(`
          *,
          policy:policies!policy_assignments_policy_id_fkey(*)
        `)
        .eq('user_id', user.id)

      if (assignError) {
        throw assignError
      }

      const safeAssignments = (assignments || []) as PolicyAssignmentWithPolicyRow[]

      const assignedPolicies: AssignedPolicyForStaff[] = await Promise.all(
        safeAssignments
          .filter(
            (assignment: PolicyAssignmentWithPolicyRow) =>
              assignment.policy?.status === 'published',
          )
          .map(async (assignment: PolicyAssignmentWithPolicyRow) => {
            const policy = assignment.policy as PolicyRow

            const { data: ackData } = await supabase
              .from('policy_acknowledgements')
              .select('*')
              .eq('policy_id', policy.id)
              .eq('user_id', user.id)
              .eq('version_read', policy.version)
              .maybeSingle()

            return {
              ...policy,
              assignment: {
                id: assignment.id,
                policy_id: assignment.policy_id,
                user_id: assignment.user_id,
                assigned_at: assignment.assigned_at,
                due_at: assignment.due_at,
                is_required: assignment.is_required,
              },
              acknowledgement: (ackData as PolicyAcknowledgementRow | null) || null,
              is_acknowledged: !!ackData,
            }
          }),
      )

      assignedPolicies.sort((a, b) => {
        if (a.is_acknowledged !== b.is_acknowledged) {
          return a.is_acknowledged ? 1 : -1
        }

        return (
          new Date(b.assignment.assigned_at).getTime() -
          new Date(a.assignment.assigned_at).getTime()
        )
      })

      setPolicies(assignedPolicies)
    } catch (err) {
      console.error('Error fetching my policies:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch policies'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMyPolicies()
  }, [fetchMyPolicies])

  return { policies, isLoading, error, refetch: fetchMyPolicies }
}

// =======================
// POLICY ACTIONS
// =======================

export function usePolicyActions() {
  const [isLoading, setIsLoading] = useState(false)

  const createPolicy = useCallback(
    async (data: Omit<PolicyInsert, 'created_by' | 'organisation_id'>) => {
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

        const { data: newPolicy, error } = await supabase
          .from('policies')
          .insert({
            ...data,
            organisation_id: profile.organisation_id,
            created_by: user.id,
          })
          .select()
          .single()

        if (error) throw error
        return newPolicy
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const updatePolicy = useCallback(async (policyId: string, data: PolicyUpdate) => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { data: updated, error } = await supabase
        .from('policies')
        .update({
          ...data,
          updated_by: user.id,
        })
        .eq('id', policyId)
        .select()
        .single()

      if (error) throw error
      return updated
    } finally {
      setIsLoading(false)
    }
  }, [])

  const publishPolicy = useCallback(async (policyId: string) => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { data: updated, error } = await supabase
        .from('policies')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq('id', policyId)
        .select()
        .single()

      if (error) throw error
      return updated
    } finally {
      setIsLoading(false)
    }
  }, [])

  const assignPolicy = useCallback(async (policyId: string, userIds: string[], dueAt?: string) => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      const assignments: PolicyAssignmentInsert[] = userIds.map((userId) => ({
        policy_id: policyId,
        user_id: userId,
        due_at: dueAt || null,
        is_required: true,
      }))

      const { error } = await supabase
        .from('policy_assignments')
        .upsert(assignments, { onConflict: 'policy_id,user_id' })

      if (error) throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const removeAssignment = useCallback(async (assignmentId: string) => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('policy_assignments')
        .delete()
        .eq('id', assignmentId)

      if (error) throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const acknowledgePolicy = useCallback(async (policyId: string, versionRead: number, text?: string) => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { data: assignment } = await supabase
        .from('policy_assignments')
        .select('id')
        .eq('policy_id', policyId)
        .eq('user_id', user.id)
        .maybeSingle()

      const ackData: PolicyAcknowledgementInsert = {
        policy_id: policyId,
        user_id: user.id,
        version_read: versionRead,
        assignment_id: assignment?.id || null,
        acknowledgement_text: text || 'I have read and understood this policy.',
      }

      const { data: ack, error } = await supabase
        .from('policy_acknowledgements')
        .insert(ackData)
        .select()
        .single()

      if (error) throw error
      return ack
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    createPolicy,
    updatePolicy,
    publishPolicy,
    assignPolicy,
    removeAssignment,
    acknowledgePolicy,
    isLoading,
  }
}

// =======================
// STAFF FOR ASSIGNMENT
// =======================

export function useStaffForAssignment() {
  const [staff, setStaff] = useState<Pick<User, 'id' | 'full_name' | 'email' | 'role'>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchStaff() {
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

        const { data, error: fetchError } = await supabase
          .from('users')
          .select('id, full_name, email, role')
          .eq('organisation_id', profile.organisation_id)
          .eq('is_active', true)
          .order('full_name')

        if (fetchError) throw fetchError

        setStaff(data || [])
      } catch (err) {
        console.error('Error fetching staff:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch staff'))
      } finally {
        setIsLoading(false)
      }
    }

    void fetchStaff()
  }, [])

  return { staff, isLoading, error }
}