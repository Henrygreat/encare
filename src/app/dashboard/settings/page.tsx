'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Building2, Palette, Shield, FileText, BarChart3, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BillingSettings } from '@/components/billing/billing-settings'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import type { Json } from '@/lib/database.types'

function asObject(value: Json | null | undefined): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {}
}

export default function DashboardSettingsPage() {
  const { user, organisation, setOrganisation } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const [brandingName, setBrandingName] = useState('')
  const [accentColor, setAccentColor] = useState('#0284c7')
  const [allowManagerEscalation, setAllowManagerEscalation] = useState(true)
  const [allowCarerIncidentClosure, setAllowCarerIncidentClosure] = useState(false)
  const [defaultTemplate, setDefaultTemplate] = useState('General care')
  const [showComplianceSummary, setShowComplianceSummary] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const settings = asObject(organisation?.settings)
    const branding = asObject(settings.branding)
    const permissions = asObject(settings.permissions)
    const templates = asObject(settings.templates)
    const reporting = asObject(settings.reporting)

    setBrandingName(String(branding.workspaceLabel || organisation?.name || ''))
    setAccentColor(String(branding.accentColor || '#0284c7'))
    setAllowManagerEscalation(permissions.allowManagerEscalation !== false)
    setAllowCarerIncidentClosure(permissions.allowCarerIncidentClosure === true)
    setDefaultTemplate(String(templates.defaultTaskTemplate || 'General care'))
    setShowComplianceSummary(reporting.showComplianceSummary !== false)
  }, [organisation?.name, organisation?.settings])

  const saveWorkspaceSettings = async () => {
    if (!organisation?.id || !isAdmin) return

    setIsSaving(true)
    setMessage(null)
    setError(null)

    try {
      const supabase = createClient()
      const currentSettings = asObject(organisation.settings)
      const nextSettings = {
        ...currentSettings,
        branding: {
          ...asObject(currentSettings.branding),
          workspaceLabel: brandingName.trim() || organisation.name,
          accentColor,
        },
        permissions: {
          ...asObject(currentSettings.permissions),
          allowManagerEscalation,
          allowCarerIncidentClosure,
        },
        templates: {
          ...asObject(currentSettings.templates),
          defaultTaskTemplate: defaultTemplate.trim() || 'General care',
        },
        reporting: {
          ...asObject(currentSettings.reporting),
          showComplianceSummary,
        },
      }

      const { error: updateError } = await supabase
        .from('organisations')
        .update({ settings: nextSettings })
        .eq('id', organisation.id)

      if (updateError) throw updateError

      setOrganisation({ ...organisation, settings: nextSettings })
      setMessage('Workspace settings saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save workspace settings right now.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="sticky top-0 z-10 border-b border-white/60 bg-white/80 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="-ml-2 rounded-full p-2 transition-colors hover:bg-surface-100">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Workspace Settings</h1>
            <p className="text-sm text-slate-500">{organisation?.name || 'Organisation unavailable'}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">Name</p>
                <p className="font-medium text-slate-900">{organisation?.name || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Slug</p>
                <p className="font-medium text-slate-900">{organisation?.slug || 'Not set'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isAdmin ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Branding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input label="Workspace label" value={brandingName} onChange={(event) => setBrandingName(event.target.value)} placeholder="EnCare Central" />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Accent colour</label>
                  <input type="color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} className="h-12 w-full rounded-[14px] border border-slate-200 bg-white px-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Permissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ToggleRow label="Managers can escalate tasks" description="Let manager accounts escalate unresolved task pressure." checked={allowManagerEscalation} onChange={setAllowManagerEscalation} />
                <ToggleRow label="Carers can close incidents" description="Allow direct incident closure without manager handoff." checked={allowCarerIncidentClosure} onChange={setAllowCarerIncidentClosure} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input label="Default task template" value={defaultTemplate} onChange={(event) => setDefaultTemplate(event.target.value)} placeholder="General care" />
                <p className="text-sm text-slate-500">Use this as the default task label for newly created manager tasks.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Reporting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ToggleRow label="Show compliance summary by default" description="Open reports with compliance risk surfaced first." checked={showComplianceSummary} onChange={setShowComplianceSummary} />
              </CardContent>
            </Card>

            {error ? <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            {message ? <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

            <Button onClick={saveWorkspaceSettings} isLoading={isSaving} fullWidth size="tap">
              <CheckCircle2 className="h-4 w-4" />
              Save workspace settings
            </Button>

            <BillingSettings />
          </>
        ) : (
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-3 text-slate-500">
                <Shield className="h-5 w-5" />
                <p className="text-sm">Billing and workspace controls are only available to administrators.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
      <div>
        <p className="font-medium text-slate-900">{label}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <button type="button" aria-pressed={checked} onClick={() => onChange(!checked)} className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-primary-600' : 'bg-slate-200'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  )
}
