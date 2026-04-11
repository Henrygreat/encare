"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Archive,
  ExternalLink,
  UserRound,
  BookOpen,
  Clock3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth, useRequireManager } from "@/lib/hooks/use-auth";
import { useToast } from "@/components/providers/toast-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Avatar } from "@/components/ui/avatar";
import type { Resident } from "@/lib/database.types";

export default function DashboardResidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { organisation, isLoading: authLoading } = useAuth();
  const { isManager, isLoading: managerLoading } =
    useRequireManager("/dashboard");
  const { showToast } = useToast();

  const residentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [resident, setResident] = useState<Resident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    async function loadResident() {
      if (!organisation?.id || !residentId) return;

      setIsLoading(true);

      const { data, error } = await supabase
        .from("residents")
        .select("*")
        .eq("id", residentId)
        .eq("organisation_id", organisation.id)
        .maybeSingle();

      if (error) {
        showToast({
          title: "Unable to load resident",
          description: error.message,
          variant: "error",
        });
        setIsLoading(false);
        return;
      }

      setResident(data);
      setIsLoading(false);
    }

    if (!authLoading) {
      void loadResident();
    }
  }, [authLoading, organisation?.id, residentId, showToast, supabase]);

  const handleArchive = async () => {
    if (
      !organisation?.id ||
      !residentId ||
      !window.confirm("Archive this resident?")
    ) {
      return;
    }

    setIsArchiving(true);

    const { error } = await supabase
      .from("residents")
      .update({ status: "inactive", updated_at: new Date().toISOString() })
      .eq("id", residentId)
      .eq("organisation_id", organisation.id);

    if (error) {
      showToast({
        title: "Unable to archive resident",
        description: error.message,
        variant: "error",
      });
      setIsArchiving(false);
      return;
    }

    showToast({ title: "Resident archived", variant: "success" });
    router.push("/dashboard/residents");
  };

  if (authLoading || managerLoading || isLoading) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Loading resident…
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        You do not have permission to manage residents.
      </div>
    );
  }

  if (!resident) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Resident not found.
      </div>
    );
  }

  const displayName = `${resident.preferred_name || resident.first_name} ${resident.last_name}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/dashboard/residents">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4" />
            Back to residents
          </Button>
        </Link>

        <div className="flex gap-2">
          <Link href={`/dashboard/residents/${resident.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Button
            variant="danger"
            isLoading={isArchiving}
            onClick={() => void handleArchive()}
          >
            <Archive className="h-4 w-4" />
            Archive
          </Button>
        </div>
      </div>

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Resident overview</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar src={resident.photo_url} name={displayName} size="lg" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {displayName}
                </h1>
                <p className="text-sm text-slate-600">
                  Room {resident.room_number || "Unassigned"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Chip size="sm">{resident.status}</Chip>
                  {resident.preferred_name ? (
                    <Chip size="sm">
                      Preferred name: {resident.preferred_name}
                    </Chip>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/residents/${resident.id}/care-plan`}>
                <Button variant="outline">
                  <BookOpen className="h-4 w-4" />
                  Care Plan
                </Button>
              </Link>

              <Link
                href={`/dashboard/residents/${resident.id}/care-plan/history`}
              >
                <Button variant="outline">
                  <Clock3 className="h-4 w-4" />
                  History
                </Button>
              </Link>

              <Link href={`/app/residents/${resident.id}`}>
                <Button variant="secondary">
                  <ExternalLink className="h-4 w-4" />
                  Open care workspace
                </Button>
              </Link>
            </div>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date of birth
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {resident.date_of_birth || "Not recorded"}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Admission date
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {resident.admission_date || "Not recorded"}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Dietary requirements
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {resident.dietary_requirements || "Not recorded"}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Communication needs
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {resident.communication_needs || "Not recorded"}
              </dd>
            </div>
          </dl>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <UserRound className="mt-0.5 h-5 w-5 text-slate-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Mobility notes
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {resident.mobility_notes || "No mobility notes recorded."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
