'use client'

import { type ReactNode } from 'react'
import { InactivityProvider } from '@/components/providers/inactivity-provider'

interface DashboardClientWrapperProps {
  children: ReactNode
}

export function DashboardClientWrapper({ children }: DashboardClientWrapperProps) {
  return (
    <InactivityProvider>
      {children}
    </InactivityProvider>
  )
}
