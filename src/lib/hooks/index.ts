// Authentication
export { useAuth, useRequireAuth, useRequireManager } from './use-auth'

// Data hooks
export { useResidents, useResident, type ResidentWithStatus } from './use-residents'
export { useTasks, useTaskActions, type TaskWithResident } from './use-tasks'
export { useResidentTimeline, useCreateLog, useTodayLogs, type TimelineEventWithUser } from './use-logs'
export {
  useCarePlan,
  useCarePlanById,
  useCarePlanVersions,
  useDraftCarePlan,
  useCarePlanAuditLogs,
  useCarePlanActions,
  useMarkCarePlanViewed,
  DEFAULT_CARE_PLAN_SECTIONS,
  HIGHLIGHTED_SECTIONS,
  type CarePlanWithResident,
  type CarePlanWithSections,
  type CarePlanVersionSummary,
} from './use-care-plans'
export { useTodayHandover, usePreviousHandovers, useHandoverActions, type HandoverWithSummary } from './use-handover'
export { useDashboard, type DashboardStats } from './use-dashboard'

// Sync
export { useSync, useSyncStatus } from './use-sync'

// Import
export { useImportJobs, useImportJob, useImportWorkflow, type ImportState, type ImportStep } from './use-import'

// Inactivity
export { useInactivity, INACTIVITY_DEFAULTS, type InactivityConfig } from './use-inactivity'

// Policies
export {
  usePolicies,
  usePolicy,
  usePolicyAssignments,
  useMyPolicies,
  usePolicyActions,
  useStaffForAssignment,
  type PolicyWithCreator,
  type PolicyWithStats,
  type PolicyAssignmentWithUser,
  type AssignedPolicyForStaff,
} from './use-policies'
