'use client'

import { createContext, useContext, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, LogOut } from 'lucide-react'
import { useInactivity, INACTIVITY_DEFAULTS } from '@/lib/hooks/use-inactivity'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface InactivityContextValue {
  resetTimers: () => void
}

const InactivityContext = createContext<InactivityContextValue | null>(null)

export function useInactivityContext() {
  return useContext(InactivityContext)
}

interface InactivityProviderProps {
  children: ReactNode
  timeoutMs?: number
  warningMs?: number
  enabled?: boolean
}

export function InactivityProvider({
  children,
  timeoutMs = INACTIVITY_DEFAULTS.TIMEOUT_MS,
  warningMs = INACTIVITY_DEFAULTS.WARNING_MS,
  enabled = true,
}: InactivityProviderProps) {
  const router = useRouter()

  const handleLogout = useCallback(async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      router.replace('/login?reason=inactivity')
    }
  }, [router])

  const handleWarning = useCallback(() => {
  }, [])

  const handleActivity = useCallback(() => {
  }, [])

  const {
    isWarningVisible,
    remainingSeconds,
    dismissWarning,
    resetTimers,
  } = useInactivity({
    timeoutMs,
    warningMs,
    onWarning: handleWarning,
    onTimeout: handleLogout,
    onActivity: handleActivity,
    enabled,
  })

  return (
    <InactivityContext.Provider value={{ resetTimers }}>
      {children}

      {isWarningVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm animate-in fade-in zoom-in-95 rounded-[24px] border border-white/80 bg-white p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>

              <h2 className="text-xl font-semibold text-slate-900">
                Still there?
              </h2>

              <p className="mt-2 text-slate-600">
                You'll be logged out in
              </p>

              <div className="my-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                <span className="text-3xl font-bold text-slate-900">
                  {remainingSeconds}
                </span>
              </div>

              <p className="text-sm text-slate-500">
                seconds due to inactivity
              </p>

              <div className="mt-6 flex w-full flex-col gap-2">
                <Button
                  onClick={dismissWarning}
                  fullWidth
                  size="tap"
                >
                  I'm still here
                </Button>

                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  fullWidth
                  className="text-slate-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </InactivityContext.Provider>
  )
}
