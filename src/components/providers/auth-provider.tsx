'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 rounded-xl bg-primary-600 flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
