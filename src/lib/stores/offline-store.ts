import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DailyLogInsert } from '@/lib/database.types'

interface QueuedLog extends DailyLogInsert {
  offline_id: string
  queued_at: number
}

interface OfflineState {
  isOnline: boolean
  queuedLogs: QueuedLog[]
  syncInProgress: boolean
  lastSyncAt: number | null
  setOnline: (online: boolean) => void
  addToQueue: (log: QueuedLog) => void
  removeFromQueue: (offlineId: string) => void
  clearQueue: () => void
  setSyncInProgress: (inProgress: boolean) => void
  setLastSyncAt: (time: number) => void
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      queuedLogs: [],
      syncInProgress: false,
      lastSyncAt: null,

      setOnline: (online) => set({ isOnline: online }),

      addToQueue: (log) =>
        set((state) => ({
          queuedLogs: [...state.queuedLogs, log],
        })),

      removeFromQueue: (offlineId) =>
        set((state) => ({
          queuedLogs: state.queuedLogs.filter((l) => l.offline_id !== offlineId),
        })),

      clearQueue: () => set({ queuedLogs: [] }),

      setSyncInProgress: (inProgress) => set({ syncInProgress: inProgress }),

      setLastSyncAt: (time) => set({ lastSyncAt: time }),
    }),
    {
      name: 'encare-offline-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// Initialize online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOfflineStore.getState().setOnline(true)
  })
  window.addEventListener('offline', () => {
    useOfflineStore.getState().setOnline(false)
  })
}
