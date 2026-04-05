import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, Organisation } from '@/lib/database.types'

interface PersistedAuthUser {
  id: string
  email: string
  organisation_id: string
  full_name: string
  role: User['role']
}

interface PersistedAuthOrganisation {
  id: string
  name: string
  slug: string
}

interface AuthState {
  user: User | null
  organisation: Organisation | null
  isLoading: boolean
  isAuthenticated: boolean
  pinUnlocked: boolean
  hasHydrated: boolean
  setUser: (user: User | null) => void
  setOrganisation: (org: Organisation | null) => void
  setIsLoading: (loading: boolean) => void
  setPinUnlocked: (unlocked: boolean) => void
  setHasHydrated: (hydrated: boolean) => void
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
      hasHydrated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setOrganisation: (organisation) =>
        set({
          organisation,
        }),

      setIsLoading: (isLoading) =>
        set({
          isLoading,
        }),

      setPinUnlocked: (pinUnlocked) =>
        set({
          pinUnlocked,
        }),

      setHasHydrated: (hasHydrated) =>
        set({
          hasHydrated,
        }),

      clear: () =>
        set({
          user: null,
          organisation: null,
          pinUnlocked: false,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: 'encare-auth-store',
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        user: state.user
          ? {
              id: state.user.id,
              email: state.user.email,
              organisation_id: state.user.organisation_id,
              full_name: state.user.full_name,
              role: state.user.role,
            }
          : null,
        organisation: state.organisation
          ? {
              id: state.organisation.id,
              name: state.organisation.name,
              slug: state.organisation.slug,
            }
          : null,
        pinUnlocked: state.pinUnlocked,
      }),

      onRehydrateStorage: () => {
        return (state) => {
          state?.setHasHydrated(true)
        }
      },
    }
  )
)