'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  CheckCircle2,
  Headphones,
  Loader2,
  Lock,
  Moon,
  Settings,
  Shield,
  Smartphone,
} from 'lucide-react'
import { MobileHeader, PageContainer } from '@/components/layout/mobile-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import type { Json } from '@/lib/database.types'

type SupportedSection = 'notifications' | 'pin' | 'appearance' | 'privacy' | 'help' | 'settings'

type TogglePreference = {
  key: string
  label: string
  description: string
}

type SectionConfig = {
  title: string
  badge: string
  description: string
  icon: React.ReactNode
  toggles?: TogglePreference[]
}

type PreferencesShape = {
  notifications?: Record<string, boolean>
  appearance?: {
    theme?: 'system' | 'light' | 'dark'
    denseMode?: boolean
    reduceMotion?: boolean
  }
  privacy?: {
    biometricPrompt?: boolean
    autoLockMinutes?: number
    shareDiagnostics?: boolean
  }
  support?: {
    preferredChannel?: 'email' | 'phone'
    includeDiagnostics?: boolean
    allowCallbacks?: boolean
  }
  pin?: {
    quickUnlockEnabled?: boolean
    quickUnlockHint?: string
  }
}

type OrgSettingsShape = {
  app?: {
    handoverReminders?: boolean
    defaultTaskPriority?: 'low' | 'medium' | 'high' | 'urgent'
    residentListView?: 'cards' | 'compact'
  }
}

const SECTION_CONFIG: Record<SupportedSection, SectionConfig> = {
  notifications: {
    title: 'Notifications',
    badge: 'Operational',
    description: 'Control which care events interrupt the shift and which ones can wait for a summary.',
    icon: <Bell className="h-5 w-5 text-primary-600" />,
    toggles: [
      { key: 'criticalIncidents', label: 'Critical incidents', description: 'Immediate alerts for high-severity incidents and safeguarding issues.' },
      { key: 'overdueTasks', label: 'Overdue tasks', description: 'Prompt staff when tasks pass their due time.' },
      { key: 'handoverReminders', label: 'Shift handover reminders', description: 'Send prompts before handover windows close.' },
      { key: 'dailySummary', label: 'Daily summary', description: 'Receive a calmer summary view for lower priority events.' },
    ],
  },
  pin: {
    title: 'PIN Lock',
    badge: 'Security',
    description: 'Quick unlock helps on shared floor devices while keeping sessions protected.',
    icon: <Lock className="h-5 w-5 text-primary-600" />,
  },
  appearance: {
    title: 'Appearance',
    badge: 'Experience',
    description: 'Tune the interface for speed, contrast, and calmer shift handovers.',
    icon: <Moon className="h-5 w-5 text-primary-600" />,
    toggles: [
      { key: 'denseMode', label: 'Compact lists', description: 'Show more residents and tasks per screen.' },
      { key: 'reduceMotion', label: 'Reduced motion', description: 'Tone down movement and transitions.' },
    ],
  },
  privacy: {
    title: 'Privacy & Security',
    badge: 'Protected',
    description: 'Protect resident data with scoped device habits and safer sign-in defaults.',
    icon: <Shield className="h-5 w-5 text-primary-600" />,
    toggles: [
      { key: 'biometricPrompt', label: 'Biometric prompt on resume', description: 'Ask for device auth when returning to the app.' },
      { key: 'shareDiagnostics', label: 'Share diagnostics with support', description: 'Include safe technical details when support is requested.' },
    ],
  },
  help: {
    title: 'Help & Support',
    badge: 'Support',
    description: 'Set how support should reach your team and what to include in help requests.',
    icon: <Headphones className="h-5 w-5 text-primary-600" />,
    toggles: [
      { key: 'includeDiagnostics', label: 'Include diagnostics in tickets', description: 'Attach environment details to speed up troubleshooting.' },
      { key: 'allowCallbacks', label: 'Allow callback requests', description: 'Let support arrange a return call for urgent issues.' },
    ],
  },
  settings: {
    title: 'App Settings',
    badge: 'Admin',
    description: 'Keep day-to-day workflows stable while tailoring defaults for your organisation.',
    icon: <Settings className="h-5 w-5 text-primary-600" />,
  },
}

const SUPPORTED_SECTIONS = Object.keys(SECTION_CONFIG) as SupportedSection[]

function asObject(value: Json | null | undefined): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {}
}

export default function ProfileSectionPage({ params }: { params: { section: string } }) {
  const router = useRouter()
  const { user, organisation, refreshAuth } = useAuth()
  const [preferences, setPreferences] = useState<PreferencesShape>({})
  const [orgSettings, setOrgSettings] = useState<OrgSettingsShape>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [pinHint, setPinHint] = useState('')
  const [autoLockMinutes, setAutoLockMinutes] = useState('15')
  const [supportChannel, setSupportChannel] = useState<'email' | 'phone'>('email')
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system')
  const [defaultTaskPriority, setDefaultTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [residentListView, setResidentListView] = useState<'cards' | 'compact'>('cards')

  const section = params.section as SupportedSection
  const config = SECTION_CONFIG[section]

  useEffect(() => {
    if (!config) {
      router.replace('/app/profile')
      return
    }

    const nextPreferences = asObject(user?.preferences) as PreferencesShape
    const nextOrgSettings = asObject(organisation?.settings) as OrgSettingsShape
    setPreferences(nextPreferences)
    setOrgSettings(nextOrgSettings)
    setPinHint(nextPreferences.pin?.quickUnlockHint || '')
    setAutoLockMinutes(String(nextPreferences.privacy?.autoLockMinutes || 15))
    setSupportChannel(nextPreferences.support?.preferredChannel || 'email')
    setTheme(nextPreferences.appearance?.theme || 'system')
    setDefaultTaskPriority(nextOrgSettings.app?.defaultTaskPriority || 'medium')
    setResidentListView(nextOrgSettings.app?.residentListView || 'cards')
    setIsLoading(false)
  }, [config, organisation?.settings, router, user?.preferences])

  const toggleValue = useMemo(() => ({
    notifications: preferences.notifications || {},
    appearance: preferences.appearance || {},
    privacy: preferences.privacy || {},
    support: preferences.support || {},
    pin: preferences.pin || {},
    app: orgSettings.app || {},
  }), [preferences, orgSettings])

  if (!config) {
    return null
  }

  const setPreferenceToggle = (group: keyof PreferencesShape, key: string, value: boolean) => {
    setPreferences((current) => ({
      ...current,
      [group]: {
        ...(current[group] && typeof current[group] === 'object' ? current[group] : {}),
        [key]: value,
      },
    }))
  }

  const setOrganisationToggle = (key: keyof NonNullable<OrgSettingsShape['app']>, value: boolean) => {
    setOrgSettings((current) => ({
      ...current,
      app: {
        ...current.app,
        [key]: value,
      },
    }))
  }

  const saveSection = async () => {
    if (!user) {
      setError('Your session is not ready yet. Please reopen your profile and try again.')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const supabase = createClient()
      const nextPreferences: PreferencesShape = {
        ...preferences,
        pin: {
          ...(preferences.pin || {}),
          quickUnlockHint: pinHint.trim(),
        },
        privacy: {
          ...(preferences.privacy || {}),
          autoLockMinutes: Math.max(1, Number.parseInt(autoLockMinutes || '15', 10) || 15),
        },
        support: {
          ...(preferences.support || {}),
          preferredChannel: supportChannel,
        },
        appearance: {
          ...(preferences.appearance || {}),
          theme,
        },
      }

      const updates: Array<Promise<any>> = [
        supabase.from('users').update({ preferences: nextPreferences }).eq('id', user.id),
      ]

      if (section === 'settings' || section === 'notifications') {
        const nextOrgSettings: OrgSettingsShape = {
          ...orgSettings,
          app: {
            ...(orgSettings.app || {}),
            defaultTaskPriority,
            residentListView,
          },
        }
        if (section === 'notifications') {
          nextOrgSettings.app = {
            ...nextOrgSettings.app,
            handoverReminders: !!preferences.notifications?.handoverReminders,
          }
        }

        setOrgSettings(nextOrgSettings)

        if (organisation?.id) {
          updates.push(
            supabase.from('organisations').update({ settings: nextOrgSettings }).eq('id', organisation.id)
          )
        }
      }

      const results = await Promise.all(updates)
      const failed = results.find((result) => result.error)
      if (failed?.error) {
        throw new Error(failed.error.message)
      }

      setPreferences(nextPreferences)
      setSuccessMessage(`${config.title} saved.`)
      await refreshAuth()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save this section right now.')
    } finally {
      setIsSaving(false)
    }
  }

  const renderSectionControls = () => {
    switch (section) {
      case 'notifications':
        return (
          <div className="space-y-3">
            {config.toggles?.map((toggle) => (
              <ToggleRow
                key={toggle.key}
                label={toggle.label}
                description={toggle.description}
                checked={!!toggleValue.notifications[toggle.key]}
                onChange={(checked) => setPreferenceToggle('notifications', toggle.key, checked)}
              />
            ))}
          </div>
        )

      case 'pin':
        return (
          <div className="space-y-4">
            <ToggleRow
              label="Enable quick unlock"
              description="Staff can return to the app faster on shared devices after the first sign-in."
              checked={!!toggleValue.pin.quickUnlockEnabled}
              onChange={(checked) => setPreferenceToggle('pin', 'quickUnlockEnabled', checked)}
            />
            <Input
              label="PIN hint label"
              placeholder="e.g. Staff floor tablet"
              value={pinHint}
              onChange={(event) => setPinHint(event.target.value)}
              icon={<Smartphone className="h-4 w-4" />}
            />
          </div>
        )

      case 'appearance':
        return (
          <div className="space-y-4">
            <SegmentedChoice
              label="Theme"
              value={theme}
              onChange={(value) => setTheme(value as 'system' | 'light' | 'dark')}
              options={[
                ['system', 'System'],
                ['light', 'Light'],
                ['dark', 'Dark'],
              ]}
            />
            <div className="space-y-3">
              {config.toggles?.map((toggle) => (
                <ToggleRow
                  key={toggle.key}
                  label={toggle.label}
                  description={toggle.description}
                  checked={!!toggleValue.appearance[toggle.key]}
                  onChange={(checked) => setPreferenceToggle('appearance', toggle.key, checked)}
                />
              ))}
            </div>
          </div>
        )

      case 'privacy':
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {config.toggles?.map((toggle) => (
                <ToggleRow
                  key={toggle.key}
                  label={toggle.label}
                  description={toggle.description}
                  checked={!!toggleValue.privacy[toggle.key]}
                  onChange={(checked) => setPreferenceToggle('privacy', toggle.key, checked)}
                />
              ))}
            </div>
            <Input
              label="Auto-lock after minutes"
              type="number"
              min={1}
              max={120}
              value={autoLockMinutes}
              onChange={(event) => setAutoLockMinutes(event.target.value)}
            />
          </div>
        )

      case 'help':
        return (
          <div className="space-y-4">
            <SegmentedChoice
              label="Preferred support channel"
              value={supportChannel}
              onChange={(value) => setSupportChannel(value as 'email' | 'phone')}
              options={[
                ['email', 'Email'],
                ['phone', 'Phone'],
              ]}
            />
            <div className="space-y-3">
              {config.toggles?.map((toggle) => (
                <ToggleRow
                  key={toggle.key}
                  label={toggle.label}
                  description={toggle.description}
                  checked={!!toggleValue.support[toggle.key]}
                  onChange={(checked) => setPreferenceToggle('support', toggle.key, checked)}
                />
              ))}
            </div>
          </div>
        )

      case 'settings':
        return (
          <div className="space-y-4">
            <ToggleRow
              label="Shift handover reminders"
              description="Use the organisation default for handover reminders across the team."
              checked={!!toggleValue.app.handoverReminders}
              onChange={(checked) => setOrganisationToggle('handoverReminders', checked)}
            />
            <SegmentedChoice
              label="Default task priority"
              value={defaultTaskPriority}
              onChange={(value) => setDefaultTaskPriority(value as 'low' | 'medium' | 'high' | 'urgent')}
              options={[
                ['low', 'Low'],
                ['medium', 'Medium'],
                ['high', 'High'],
                ['urgent', 'Urgent'],
              ]}
            />
            <SegmentedChoice
              label="Resident list view"
              value={residentListView}
              onChange={(value) => setResidentListView(value as 'cards' | 'compact')}
              options={[
                ['cards', 'Cards'],
                ['compact', 'Compact'],
              ]}
            />
          </div>
        )
    }
  }

  return (
    <PageContainer header={<MobileHeader title={config.title} backHref="/app/profile" />}>
      {isLoading ? (
        <Card padding="lg"><div className="flex items-center justify-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading settings…</div></Card>
      ) : (
        <div className="space-y-4">
          <Card className="border-white/70 bg-gradient-to-br from-white via-slate-50 to-primary-50 shadow-xl" padding="lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100">{config.icon}</div>
                <h1 className="text-2xl font-semibold text-slate-900">{config.title}</h1>
                <p className="mt-2 text-sm text-slate-600">{config.description}</p>
              </div>
              <Chip variant="primary" size="sm">{config.badge}</Chip>
            </div>
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
              {successMessage ? <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div> : null}
              {renderSectionControls()}
              <Button fullWidth size="tap" onClick={saveSection} isLoading={isSaving}>
                <CheckCircle2 className="h-4 w-4" />
                Save {config.title}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
      <div>
        <p className="font-medium text-slate-900">{label}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-primary-600' : 'bg-slate-200'}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  )
}

function SegmentedChoice({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<[string, string]>
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-2 sm:grid-cols-4">
        {options.map(([optionValue, optionLabel]) => {
          const active = value === optionValue
          return (
            <button
              key={optionValue}
              type="button"
              onClick={() => onChange(optionValue)}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${active ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'}`}
            >
              {optionLabel}
            </button>
          )
        })}
      </div>
    </div>
  )
}
