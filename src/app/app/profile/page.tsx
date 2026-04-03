'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  Moon,
  Lock
} from 'lucide-react'
import { MobileHeader, PageContainer } from '@/components/layout/mobile-header'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import { SyncStatus } from '@/components/ui/sync-status'
import { createClient } from '@/lib/supabase/client'

// Demo user data
const DEMO_USER = {
  id: 'user1',
  full_name: 'Sarah Johnson',
  email: 'sarah.johnson@carehome.com',
  role: 'senior_carer' as const,
  avatar_url: null,
  organisation_name: 'Sunny Days Care Home',
}

const ROLE_LABELS = {
  admin: 'Administrator',
  manager: 'Manager',
  senior_carer: 'Senior Carer',
  carer: 'Care Worker',
}

export default function ProfilePage() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <PageContainer
      header={<MobileHeader title="Profile" />}
    >
      {/* User Info */}
      <Card className="mb-4" padding="lg">
        <div className="flex items-center gap-4">
          <Avatar
            src={DEMO_USER.avatar_url}
            name={DEMO_USER.full_name}
            size="xl"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {DEMO_USER.full_name}
            </h2>
            <p className="text-gray-500">{DEMO_USER.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Chip variant="primary" size="sm">
                {ROLE_LABELS[DEMO_USER.role]}
              </Chip>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-surface-100">
          <p className="text-sm text-gray-500">Organisation</p>
          <p className="font-medium text-gray-900">{DEMO_USER.organisation_name}</p>
        </div>
      </Card>

      {/* Sync Status */}
      <Card className="mb-4" padding="md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Sync Status</h3>
            <p className="text-sm text-gray-500">Data synchronization</p>
          </div>
          <SyncStatus />
        </div>
      </Card>

      {/* Settings Menu */}
      <Card className="mb-4" padding="none">
        <MenuItem
          icon={<Bell className="h-5 w-5" />}
          label="Notifications"
          onClick={() => router.push('/app/profile/notifications')}
        />
        <MenuItem
          icon={<Lock className="h-5 w-5" />}
          label="PIN Lock"
          sublabel="Quick unlock enabled"
          onClick={() => router.push('/app/profile/pin')}
        />
        <MenuItem
          icon={<Moon className="h-5 w-5" />}
          label="Appearance"
          sublabel="System default"
          onClick={() => router.push('/app/profile/appearance')}
        />
        <MenuItem
          icon={<Shield className="h-5 w-5" />}
          label="Privacy & Security"
          onClick={() => router.push('/app/profile/privacy')}
          isLast
        />
      </Card>

      {/* Help & Support */}
      <Card className="mb-4" padding="none">
        <MenuItem
          icon={<HelpCircle className="h-5 w-5" />}
          label="Help & Support"
          onClick={() => router.push('/app/profile/help')}
        />
        <MenuItem
          icon={<Settings className="h-5 w-5" />}
          label="App Settings"
          onClick={() => router.push('/app/profile/settings')}
          isLast
        />
      </Card>

      {/* Sign Out */}
      <Button
        variant="danger"
        fullWidth
        size="tap"
        onClick={handleLogout}
        isLoading={isLoggingOut}
      >
        <LogOut className="h-5 w-5 mr-2" />
        Sign Out
      </Button>

      {/* App Version */}
      <p className="text-center text-xs text-gray-400 mt-6">
        EnCare v0.1.0
      </p>
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
      className={`
        w-full flex items-center justify-between p-4 hover:bg-surface-50 transition-colors
        ${!isLast && 'border-b border-surface-100'}
      `}
    >
      <div className="flex items-center gap-3">
        <div className="text-gray-500">{icon}</div>
        <div className="text-left">
          <p className="font-medium text-gray-900">{label}</p>
          {sublabel && (
            <p className="text-sm text-gray-500">{sublabel}</p>
          )}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400" />
    </button>
  )
}
