"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Shield,
  Settings2,
  BarChart3,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/database.types";

function asObject(value: Json | null | undefined): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

export default function DashboardSettingsPage() {
  const { user, organisation } = useAuth();
  const { setOrganisation } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [allowManagerEscalation, setAllowManagerEscalation] = useState(true);
  const [allowCarerIncidentClosure, setAllowCarerIncidentClosure] =
    useState(false);
  const [defaultPriority, setDefaultPriority] = useState("normal");
  const [defaultTemplate, setDefaultTemplate] = useState("General care");
  const [residentListView, setResidentListView] = useState("compact");
  const [shiftHandoverReminders, setShiftHandoverReminders] = useState(true);
  const [showComplianceSummary, setShowComplianceSummary] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const settings = asObject(organisation?.settings);
    const permissions = asObject(settings.permissions);
    const workflow = asObject(settings.workflow);
    const templates = asObject(settings.templates);
    const reporting = asObject(settings.reporting);

    setAllowManagerEscalation(permissions.allowManagerEscalation !== false);
    setAllowCarerIncidentClosure(
      permissions.allowCarerIncidentClosure === true,
    );
    setDefaultPriority(String(workflow.defaultPriority || "normal"));
    setDefaultTemplate(String(templates.defaultTaskTemplate || workflow.defaultTaskTemplate || "General care"));
    setResidentListView(String(workflow.residentListView || "compact"));
    setShiftHandoverReminders(workflow.shiftHandoverReminders !== false);
    setShowComplianceSummary(reporting.showComplianceSummary !== false);
  }, [organisation?.settings]);

  const saveWorkspaceSettings = async () => {
    if (!organisation?.id || !isAdmin) return;

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const supabase = createClient();
      const currentSettings = asObject(organisation.settings);

      const nextSettings = {
        ...currentSettings,
        permissions: {
          ...asObject(currentSettings.permissions),
          allowManagerEscalation,
          allowCarerIncidentClosure,
        },
        workflow: {
          ...asObject(currentSettings.workflow),
          defaultPriority: defaultPriority.trim() || "normal",
          defaultTaskTemplate: defaultTemplate.trim() || "General care",
          residentListView: residentListView.trim() || "compact",
          shiftHandoverReminders,
        },
        templates: {
          ...asObject(currentSettings.templates),
          defaultTaskTemplate: defaultTemplate.trim() || "General care",
        },
        reporting: {
          ...asObject(currentSettings.reporting),
          showComplianceSummary,
        },
      };

      const { data: updatedOrganisation, error: updateError } = await supabase
        .from("organisations")
        .update({ settings: nextSettings })
        .eq("id", organisation.id)
        .select("*")
        .single();

      if (updateError) throw updateError;
      if (!updatedOrganisation) {
        throw new Error(
          "Organisation settings were saved, but the updated record was not returned.",
        );
      }

      setOrganisation(updatedOrganisation);
      setMessage("Settings saved.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save settings right now.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="sticky top-0 z-10 border-b border-white/60 bg-white/80 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="-ml-2 rounded-full p-2 transition-colors hover:bg-surface-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Workspace Settings
            </h1>
            <p className="text-sm text-slate-500">
              {organisation?.name || "Organisation unavailable"}
            </p>
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
                <p className="font-medium text-slate-900">
                  {organisation?.name || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Slug</p>
                <p className="font-medium text-slate-900">
                  {organisation?.slug || "Not set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isAdmin ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Workflow defaults
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Default task priority
                  </label>
                  <select
                    value={defaultPriority}
                    onChange={(e) => setDefaultPriority(e.target.value)}
                    className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-slate-900 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <Input
                  label="Default task template"
                  value={defaultTemplate}
                  onChange={(event) => setDefaultTemplate(event.target.value)}
                  placeholder="General care"
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Resident list view
                  </label>
                  <select
                    value={residentListView}
                    onChange={(e) => setResidentListView(e.target.value)}
                    className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-slate-900 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="compact">Compact</option>
                    <option value="detailed">Detailed</option>
                    <option value="cards">Cards</option>
                  </select>
                </div>
                <ToggleRow
                  label="Shift handover reminders"
                  description="Prompt carers to complete handover notes at shift end."
                  checked={shiftHandoverReminders}
                  onChange={setShiftHandoverReminders}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Permissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ToggleRow
                  label="Managers can escalate tasks"
                  description="Let manager accounts escalate unresolved task pressure."
                  checked={allowManagerEscalation}
                  onChange={setAllowManagerEscalation}
                />
                <ToggleRow
                  label="Carers can close incidents"
                  description="Allow direct incident closure without manager handoff."
                  checked={allowCarerIncidentClosure}
                  onChange={setAllowCarerIncidentClosure}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Reporting
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ToggleRow
                  label="Show compliance summary"
                  description="Open reports with compliance risk surfaced first."
                  checked={showComplianceSummary}
                  onChange={setShowComplianceSummary}
                />
              </CardContent>
            </Card>

            {error ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}

            <Button
              onClick={saveWorkspaceSettings}
              isLoading={isSaving}
              fullWidth
              size="tap"
            >
              <CheckCircle2 className="h-4 w-4" />
              Save settings
            </Button>

            <div className="pt-2 text-center">
              <Link
                href="/dashboard/billing"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700"
              >
                <CreditCard className="h-4 w-4" />
                Manage billing
              </Link>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-3 text-slate-500">
                <Shield className="h-5 w-5" />
                <p className="text-sm">
                  Workspace controls are only available to administrators.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
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
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-primary-600" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
