// Authentication
export { useAuth, useRequireAuth, useRequireManager } from './use-auth'

// Data hooks
export { useResidents, useResident, type ResidentWithStatus } from './use-residents'
export { useTasks, useTaskActions, type TaskWithResident } from './use-tasks'
export { useResidentTimeline, useCreateLog, useTodayLogs, type TimelineEventWithUser } from './use-logs'

// Sync
export { useSync, useSyncStatus } from './use-sync'
