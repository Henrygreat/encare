"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Filter,
  Plus,
  Search,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Chip } from "@/components/ui/chip";
import { createClient } from "@/lib/supabase/client";
import { useAuth, useRequireManager } from "@/lib/hooks/use-auth";
import { useToast } from "@/components/providers/toast-provider";
import { formatRelativeTime } from "@/lib/utils";
import type { Json, Resident } from "@/lib/database.types";

type ResidentRow = Resident & {
  assignedStaffCount: number;
  lastLogAt: string | null;
  riskLevel: "low" | "medium" | "high";
  overdueTasks: number;
  logCount7Days: number;
};

function asObject(value: Json | null | undefined): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function getResidentListView(
  settings: Json | null | undefined,
): "cards" | "compact" {
  const settingsObj = asObject(settings);
  const app =
    settingsObj.app && typeof settingsObj.app === "object"
      ? settingsObj.app
      : {};
  const listView = app.residentListView;

  return listView === "compact" ? "compact" : "cards";
}

function getRiskLevel(riskFlags: Json): "low" | "medium" | "high" {
  if (!Array.isArray(riskFlags) || riskFlags.length === 0) return "low";

  const hasHigh = riskFlags.some(
    (flag: any) => flag?.severity === "high" || flag?.priority === "high",
  );

  if (hasHigh) return "high";
  if (riskFlags.length >= 2) return "medium";
  return "low";
}

export default function ResidentsManagementPage() {
  const { organisation, isLoading: authLoading } = useAuth();
  const { isManager, isLoading: managerLoading } =
    useRequireManager("/dashboard");
  const { showToast } = useToast();

  const [residents, setResidents] = useState<ResidentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [riskFilter, setRiskFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const residentListView = getResidentListView(organisation?.settings);

  useEffect(() => {
    async function loadResidents() {
      if (!organisation?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const startOfWindow = new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const nowIso = new Date().toISOString();

        const [
          residentsResult,
          logsResult,
          assignmentsResult,
          overdueTasksResult,
        ] = await Promise.all([
          supabase
            .from("residents")
            .select("*")
            .eq("organisation_id", organisation.id)
            .order("last_name"),
          supabase
            .from("daily_logs")
            .select("resident_id, logged_at")
            .eq("organisation_id", organisation.id)
            .gte("logged_at", startOfWindow),
          supabase
            .from("staff_assignments")
            .select("resident_id, user_id")
            .gte("shift_date", new Date().toISOString().split("T")[0]),
          supabase
            .from("tasks")
            .select("resident_id")
            .eq("organisation_id", organisation.id)
            .eq("status", "pending")
            .lt("due_at", nowIso),
        ]);

        if (residentsResult.error) throw residentsResult.error;
        if (logsResult.error) throw logsResult.error;
        if (assignmentsResult.error) throw assignmentsResult.error;
        if (overdueTasksResult.error) throw overdueTasksResult.error;

        const logsByResident = new Map<
          string,
          { count: number; lastLogAt: string | null }
        >();

        for (const log of logsResult.data || []) {
          const current = logsByResident.get(log.resident_id) || {
            count: 0,
            lastLogAt: null,
          };

          const nextLastLogAt =
            !current.lastLogAt ||
            new Date(log.logged_at) > new Date(current.lastLogAt)
              ? log.logged_at
              : current.lastLogAt;

          logsByResident.set(log.resident_id, {
            count: current.count + 1,
            lastLogAt: nextLastLogAt,
          });
        }

        const assignmentCounts = new Map<string, number>();
        for (const assignment of assignmentsResult.data || []) {
          assignmentCounts.set(
            assignment.resident_id,
            (assignmentCounts.get(assignment.resident_id) || 0) + 1,
          );
        }

        const overdueByResident = new Map<string, number>();
        for (const task of overdueTasksResult.data || []) {
          if (!task.resident_id) continue;
          overdueByResident.set(
            task.resident_id,
            (overdueByResident.get(task.resident_id) || 0) + 1,
          );
        }

        const residentRows = (residentsResult.data || []) as Resident[];

        setResidents(
          residentRows.map((resident: Resident) => {
            const logMeta = logsByResident.get(resident.id);

            return {
              ...resident,
              assignedStaffCount: assignmentCounts.get(resident.id) || 0,
              lastLogAt: logMeta?.lastLogAt || null,
              riskLevel: getRiskLevel(resident.risk_flags),
              overdueTasks: overdueByResident.get(resident.id) || 0,
              logCount7Days: logMeta?.count || 0,
            };
          }),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load residents",
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) void loadResidents();
  }, [authLoading, organisation?.id]);

  const handleArchive = async (residentId: string) => {
    if (!organisation?.id) return;

    if (
      !window.confirm(
        "Archive this resident? Their record will remain available but marked inactive.",
      )
    ) {
      return;
    }

    const previousResidents = residents;

    setArchivingId(residentId);
    setResidents((current) =>
      current.map((resident) =>
        resident.id === residentId
          ? { ...resident, status: "inactive" }
          : resident,
      ),
    );

    const { error: updateError } = await createClient()
      .from("residents")
      .update({ status: "inactive", updated_at: new Date().toISOString() })
      .eq("id", residentId)
      .eq("organisation_id", organisation.id);

    if (updateError) {
      setResidents(previousResidents);
      showToast({
        title: "Unable to archive resident",
        description: updateError.message,
        variant: "error",
      });
      setArchivingId(null);
      return;
    }

    showToast({ title: "Resident archived", variant: "success" });
    setArchivingId(null);
  };

  const filteredResidents = useMemo(() => {
    let list = [...residents];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((resident) =>
        [
          resident.first_name,
          resident.last_name,
          resident.preferred_name || "",
          resident.room_number || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((resident) => resident.status === statusFilter);
    }

    if (riskFilter !== "all") {
      list = list.filter((resident) => resident.riskLevel === riskFilter);
    }

    return list;
  }, [residents, riskFilter, searchQuery, statusFilter]);

  const stats = useMemo(
    () => ({
      total: residents.length,
      active: residents.filter((resident) => resident.status === "active")
        .length,
      highRisk: residents.filter((resident) => resident.riskLevel === "high")
        .length,
      overdue: residents.filter((resident) => resident.overdueTasks > 0).length,
    }),
    [residents],
  );

  if (authLoading || managerLoading) {
    return (
      <Card padding="lg">
        <p className="text-center text-slate-500">
          Loading residents workspace…
        </p>
      </Card>
    );
  }

  if (!isManager) {
    return (
      <Card padding="lg">
        <p className="text-center text-slate-500">
          You do not have permission to manage residents.
        </p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br from-slate-900 via-slate-800 to-primary-700 p-6 text-white shadow-2xl shadow-primary-900/10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary-100">
              <Sparkles className="h-3.5 w-3.5" />
              Live resident oversight
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Resident management, grounded in live care data
            </h1>
            <p className="mt-2 text-sm text-slate-200">
              Keep room status, risk flags, overdue care, and recent activity in
              one calm workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/residents/new">
              <Button
                variant="primary"
                className="bg-white text-slate-900 hover:bg-white/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add resident
              </Button>
            </Link>

            <Link href="/dashboard/import">
              <Button
                variant="secondary"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </Link>

            <Link href="/app/residents">
              <Button
                variant="secondary"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                Open care workspace
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Residents"
          value={stats.total}
          copy="Organisation-wide live roster"
        />
        <MetricCard
          label="Active"
          value={stats.active}
          copy="Currently receiving care"
        />
        <MetricCard
          label="High risk"
          value={stats.highRisk}
          copy="Residents with elevated flags"
          tone="warning"
        />
        <MetricCard
          label="Overdue tasks"
          value={stats.overdue}
          copy="Residents needing action now"
          tone="danger"
        />
      </div>

      <Card
        className="border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur"
        padding="md"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search name, preferred name, or room"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                ["all", "All status"],
                ["active", "Active"],
                ["inactive", "Inactive"],
              ]}
            />
            <FilterSelect
              value={riskFilter}
              onChange={setRiskFilter}
              options={[
                ["all", "All risk"],
                ["high", "High risk"],
                ["medium", "Medium risk"],
                ["low", "Low risk"],
              ]}
            />
            <Chip variant="primary" size="sm">
              {residentListView === "compact" ? "Compact view" : "Card view"}
            </Chip>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card padding="lg">
          <p className="text-center text-slate-500">Loading residents…</p>
        </Card>
      ) : error ? (
        <Card padding="lg">
          <p className="text-center text-care-red">{error}</p>
        </Card>
      ) : filteredResidents.length === 0 ? (
        <Card padding="lg">
          <div className="text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <h2 className="text-lg font-semibold text-slate-900">
              No residents matched
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Try another filter, or add residents through the care app.
            </p>
          </div>
        </Card>
      ) : residentListView === "compact" ? (
        <div className="overflow-hidden rounded-[24px] border border-white/70 bg-white/90 shadow-xl shadow-slate-200/60">
          {filteredResidents.map((resident, index) => {
            const displayName = `${resident.preferred_name || resident.first_name} ${resident.last_name}`;

            return (
              <div
                key={resident.id}
                className={`flex items-center justify-between gap-4 px-4 py-4 ${
                  index !== filteredResidents.length - 1
                    ? "border-b border-slate-100"
                    : ""
                }`}
              >
                <Link
                  href={`/dashboard/residents/${resident.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <Avatar
                    src={resident.photo_url}
                    name={displayName}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-slate-900">
                        {displayName}
                      </p>
                      <Chip
                        size="sm"
                        variant={
                          resident.riskLevel === "high"
                            ? "danger"
                            : resident.riskLevel === "medium"
                              ? "warning"
                              : "default"
                        }
                      >
                        {resident.riskLevel} risk
                      </Chip>
                      {resident.status !== "active" ? (
                        <Chip size="sm">{resident.status}</Chip>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Room {resident.room_number || "Unassigned"} ·{" "}
                      {resident.assignedStaffCount} staff assigned today
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <SoftBadge
                        label={`${resident.logCount7Days} logs / 7 days`}
                      />
                      <SoftBadge
                        label={
                          resident.lastLogAt
                            ? `Last log ${formatRelativeTime(resident.lastLogAt)}`
                            : "No recent logs"
                        }
                      />
                      {resident.overdueTasks > 0 ? (
                        <SoftBadge
                          label={`${resident.overdueTasks} overdue task${resident.overdueTasks > 1 ? "s" : ""}`}
                          tone="danger"
                        />
                      ) : (
                        <SoftBadge label="No overdue tasks" tone="success" />
                      )}
                    </div>
                  </div>
                </Link>

                <div className="flex shrink-0 items-center gap-2">
                  <Link href={`/dashboard/residents/${resident.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={archivingId === resident.id}
                    onClick={() => void handleArchive(resident.id)}
                  >
                    Archive
                  </Button>
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredResidents.map((resident) => {
            const displayName = `${resident.preferred_name || resident.first_name} ${resident.last_name}`;

            return (
              <Card
                key={resident.id}
                className="group h-full border-white/70 bg-white/85 shadow-lg shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary-100/80"
                padding="lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <Link
                    href={`/dashboard/residents/${resident.id}`}
                    className="flex min-w-0 flex-1 items-start gap-4"
                  >
                    <Avatar
                      src={resident.photo_url}
                      name={displayName}
                      size="lg"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-semibold text-slate-900">
                          {displayName}
                        </h2>
                        <Chip
                          size="sm"
                          variant={
                            resident.riskLevel === "high"
                              ? "danger"
                              : resident.riskLevel === "medium"
                                ? "warning"
                                : "default"
                          }
                        >
                          {resident.riskLevel} risk
                        </Chip>
                        {resident.status !== "active" ? (
                          <Chip size="sm">{resident.status}</Chip>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        Room {resident.room_number || "Unassigned"} ·{" "}
                        {resident.assignedStaffCount} staff assigned today
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <SoftBadge
                          label={`${resident.logCount7Days} logs / 7 days`}
                        />
                        <SoftBadge
                          label={
                            resident.lastLogAt
                              ? `Last log ${formatRelativeTime(resident.lastLogAt)}`
                              : "No recent logs"
                          }
                        />
                        {resident.overdueTasks > 0 ? (
                          <SoftBadge
                            label={`${resident.overdueTasks} overdue task${resident.overdueTasks > 1 ? "s" : ""}`}
                            tone="danger"
                          />
                        ) : (
                          <SoftBadge label="No overdue tasks" tone="success" />
                        )}
                      </div>
                      {Array.isArray(resident.risk_flags) &&
                      resident.risk_flags.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {resident.risk_flags
                            .slice(0, 3)
                            .map((flag: any, index: number) => (
                              <span
                                key={`${resident.id}-${index}`}
                                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                              >
                                {flag?.type || "Risk flag"}
                              </span>
                            ))}
                        </div>
                      ) : null}
                    </div>
                  </Link>

                  <div className="flex shrink-0 flex-col gap-2">
                    <Link href={`/dashboard/residents/${resident.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      isLoading={archivingId === resident.id}
                      onClick={() => void handleArchive(resident.id)}
                    >
                      Archive
                    </Button>
                    <ChevronRight className="mx-auto mt-1 h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-primary-500" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  copy,
  tone = "default",
}: {
  label: string;
  value: number;
  copy: string;
  tone?: "default" | "warning" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "from-red-50 to-white border-red-100"
      : tone === "warning"
        ? "from-amber-50 to-white border-amber-100"
        : "from-white to-slate-50 border-white/70";

  return (
    <Card
      className={`border bg-gradient-to-br ${toneClass} shadow-lg shadow-slate-200/60`}
      padding="md"
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500">{copy}</p>
    </Card>
  );
}

function FilterSelect<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<[T, string]>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      className="h-10 rounded-button border border-surface-200 bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      {options.map(([optionValue, label]) => (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  );
}

function SoftBadge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "danger" | "success";
}) {
  const classes =
    tone === "danger"
      ? "bg-red-50 text-red-700"
      : tone === "success"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-slate-100 text-slate-600";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
