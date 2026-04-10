'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  Moon,
  Lock,
  AlertCircle,
  ScrollText,
} from 'lucide-react'
import { MobileHeader, PageContainer } from '@/components/layout/mobile-header'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import { SyncStatus } from '@/components/ui/sync-status'
import { useAuth } from '@/lib/hooks/use-auth'
import type { Json } from '@/lib/database.types'

const ROLE_LABELS = {
  admin: 'Administrator',
  manager: 'Manager',
  senior_carer: 'Senior Carer',
  carer: 'Care Worker',
}

function asObject(value: Json | null | undefined): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {}
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, organisation, signOut } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await signOut()
    setIsLoggingOut(false)
  }

  const preferences = useMemo(() => asObject(user?.preferences), [user?.preferences])

  const displayUser = {
    full_name: user?.full_name || 'Care Team User',
    email: user?.email || 'No email available',
    role: user?.role || 'manager',
    avatar_url: user?.avatar_url || null,
    organisation_name: organisation?.name || null,
  }

  const menuItems = [
    { href: '/app/profile/notifications', icon: <Bell className="h-5 w-5" />, label: 'Notifications', sublabel: preferences.notifications?.criticalIncidents ? 'Critical alerts enabled' : 'Review alert channels' },
    { href: '/app/profile/pin', icon: <Lock className="h-5 w-5" />, label: 'PIN Lock', sublabel: preferences.pin?.quickUnlockEnabled ? 'Quick unlock enabled' : 'Set up quick unlock' },
    { href: '/app/profile/appearance', icon: <Moon className="h-5 w-5" />, label: 'Appearance', sublabel: `${preferences.appearance?.theme || 'System'} theme` },
    { href: '/app/profile/privacy', icon: <Shield className="h-5 w-5" />, label: 'Privacy & Security', sublabel: `${preferences.privacy?.autoLockMinutes || 15} minute auto-lock` },
    { href: '/app/profile/help', icon: <HelpCircle className="h-5 w-5" />, label: 'Help & Support', sublabel: `${preferences.support?.preferredChannel || 'email'} support` },
    { href: '/app/profile/settings', icon: <Settings className="h-5 w-5" />, label: 'App Settings', sublabel: 'Organisation workflow defaults' },
  ]

  return (
    <PageContainer header={<MobileHeader title="Profile" />}>
      <Card className="mb-4 bg-gradient-to-br from-white via-white to-sky-50" padding="lg">
        <div className="flex items-center gap-4">
          <Avatar src={displayUser.avatar_url} name={displayUser.full_name} size="xl" />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{displayUser.full_name}</h2>
            <p className="text-gray-500">{displayUser.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <Chip variant="primary" size="sm">
                {ROLE_LABELS[displayUser.role as keyof typeof ROLE_LABELS]}
              </Chip>
            </div>
          </div>
        </div>
        <div className="mt-4 border-t border-surface-100 pt-4">
          <p className="text-sm text-gray-500">Organisation</p>
          {displayUser.organisation_name ? (
            <p className="font-medium text-gray-900">{displayUser.organisation_name}</p>
          ) : (
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              <AlertCircle className="h-4 w-4" />
              Organisation details are unavailable. Reload after your workspace finishes syncing.
            </div>
          )}
        </div>
      </Card>

      <Card className="mb-4" padding="md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Sync Status</h3>
            <p className="text-sm text-gray-500">Data synchronization</p>
          </div>
          <SyncStatus />
        </div>
      </Card>

      <Card className="mb-4" padding="none">
        <MenuItem
          icon={<ScrollText className="h-5 w-5" />}
          label="Company Policies"
          sublabel="View and acknowledge policies"
          onClick={() => router.push('/app/policies')}
          isLast
        />
      </Card>

      <Card className="mb-4" padding="none">
        {menuItems.slice(0, 4).map((item, index) => (
          <MenuItem key={item.href} icon={item.icon} label={item.label} sublabel={item.sublabel} onClick={() => router.push(item.href)} isLast={index === 3} />
        ))}
      </Card>

      <Card className="mb-4" padding="none">
        {menuItems.slice(4).map((item, index) => (
          <MenuItem key={item.href} icon={item.icon} label={item.label} sublabel={item.sublabel} onClick={() => router.push(item.href)} isLast={index === menuItems.slice(4).length - 1} />
        ))}
      </Card>

      <Button variant="danger" fullWidth size="tap" onClick={handleLogout} isLoading={isLoggingOut}>
        <LogOut className="mr-2 h-5 w-5" />
        Sign Out
      </Button>

      <p className="mt-6 text-center text-xs text-gray-400">EnCare v1.0.0</p>
    </PageContainer>
  )
}

function MenuItem({
  icon,
  label,
  sublabel,
  onClick,
  isLast = false,
}: {
  icon: React.ReactNode
  label: string
  sublabel?: string
  onClick: () => void
  isLast?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between p-4 transition-colors hover:bg-surface-50 ${!isLast ? 'border-b border-surface-100' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="text-gray-500">{icon}</div>
        <div className="text-left">
          <p className="font-medium text-gray-900">{label}</p>
          {sublabel ? <p className="text-sm text-gray-500">{sublabel}</p> : null}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400" />
    </button>
  )
}
