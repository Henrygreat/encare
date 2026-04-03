import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, Organisation } from '@/lib/database.types'

interface AuthState {
  user: User | null
  organisation: Organisation | null
  isLoading: boolean
  isAuthenticated: boolean
  pinUnlocked: boolean
  setUser: (user: User | null) => void
  setOrganisation: (org: Organisation | null) => void
  setIsLoading: (loading: boolean) => void
  setPinUnlocked: (unlocked: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      organisation: null,
      isLoading: true,
      isAuthenticated: false,
      pinUnlocked: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setOrganisation: (organisation) => set({ organisation }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setPinUnlocked: (pinUnlocked) => set({ pinUnlocked }),
      clear: () => set({ user: null, organisation: null, pinUnlocked: false, isAuthenticated: false }),
    }),
    {
      name: 'encare-auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist user ID and org for session recovery
        user: state.user ? {
          id: state.user.id,
          email: state.user.email,
          organisation_id: state.user.organisation_id,
          full_name: state.user.full_name,
          role: state.user.role,
        } : null,
      }),
    }
  )
)
