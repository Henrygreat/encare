"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { MobileHeader, PageContainer } from "@/components/layout/mobile-header";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { formatRelativeTime } from "@/lib/utils";

type IncidentResident = {
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
};

type IncidentReporter = {
  full_name: string | null;
};

type IncidentRow = {
  id: string;
  incident_type: string | null;
  severity: string | null;
  description: string | null;
  occurred_at: string;
  resolved_at: string | null;
  residents: IncidentResident | IncidentResident[] | null;
  users: IncidentReporter | IncidentReporter[] | null;
};

function getResidentName(resident: IncidentResident | null | undefined) {
  if (!resident) return "Unknown resident";

  const firstName = resident.preferred_name || resident.first_name || "";
  const lastName = resident.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || "Unknown resident";
}

function getReporterName(reporter: IncidentReporter | null | undefined) {
  return reporter?.full_name || "Unknown reporter";
}

function getSeverityVariant(
  severity: string | null,
): "default" | "warning" | "danger" | "success" {
  if (severity === "high") return "danger";
  if (severity === "medium") return "warning";
  if (severity === "low") return "default";
  return "default";
}

export default function DashboardIncidentsPage() {
  const { user } = useAuthStore();
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchIncidents() {
      if (!user?.organisation_id) {
        setIncidents([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        const { data, error: fetchError } = await supabase
          .from("incidents")
          .select(
            `
            id,
            incident_type,
            severity,
            description,
            occurred_at,
            resolved_at,
            residents (first_name, last_name, preferred_name),
            users!reported_by (full_name)
          `,
          )
          .eq("organisation_id", user.organisation_id)
          .order("occurred_at", { ascending: false })
          .limit(100);

        if (fetchError) throw fetchError;

        setIncidents((data || []) as IncidentRow[]);
      } catch (err) {
        console.error("Error fetching incidents:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to fetch incidents"),
        );
      } finally {
        setIsLoading(false);
      }
    }

    void fetchIncidents();
  }, [user?.organisation_id]);

  return (
    <PageContainer
      header={<MobileHeader title="Incidents" backHref="/dashboard" />}
    >
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            Loading incidents...
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            Error loading incidents
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No incidents recorded
          </div>
        ) : (
          incidents.map((incident) => {
            const resident = Array.isArray(incident.residents)
              ? incident.residents[0]
              : incident.residents;

            const reporter = Array.isArray(incident.users)
              ? incident.users[0]
              : incident.users;

            const residentName = getResidentName(resident);
            const reporterName = getReporterName(reporter);
            const incidentType = incident.incident_type || "Incident";
            const severityLabel = incident.severity || "unknown";

            return (
              <Link
                key={incident.id}
                href={`/dashboard/incidents/${incident.id}`}
              >
                <Card
                  padding="md"
                  className="cursor-pointer transition-shadow hover:shadow-card-hover"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-care-red" />
                        <span className="font-semibold text-gray-900">
                          {incidentType}
                        </span>
                        <Chip
                          variant={getSeverityVariant(incident.severity)}
                          size="sm"
                        >
                          {severityLabel}
                        </Chip>
                      </div>

                      <p className="mb-2 text-sm text-gray-600">
                        {incident.description || "No description"}
                      </p>

                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span>{residentName}</span>
                        <span>&middot;</span>
                        <span>by {reporterName}</span>
                        <span>&middot;</span>
                        <span>{formatRelativeTime(incident.occurred_at)}</span>
                        {incident.resolved_at && (
                          <>
                            <span>&middot;</span>
                            <span className="text-care-green">Resolved</span>
                          </>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400" />
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </PageContainer>
  );
}
