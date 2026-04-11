"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Bed,
  AlertTriangle,
  ClipboardList,
  FileText,
  BookOpen,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

type Resident = {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name?: string | null;
  room_number?: string | null;
  status?: string | null;
  risk_flags?: Array<{ type?: string; level?: string; notes?: string }> | null;
};

export default function ResidentDashboardPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [resident, setResident] = useState<Resident | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResident() {
      const supabase = createClient();

      const { data } = await supabase
        .from("residents")
        .select(
          `
          id,
          first_name,
          last_name,
          preferred_name,
          room_number,
          status,
          risk_flags
        `,
        )
        .eq("id", params.id)
        .single();

      if (data) setResident(data as Resident);

      setLoading(false);
    }

    fetchResident();
  }, [params.id]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!resident) {
    return <div className="p-6">Resident not found</div>;
  }

  const name = `${resident.preferred_name || resident.first_name} ${resident.last_name}`;

  const risks = Array.isArray(resident.risk_flags) ? resident.risk_flags : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/residents")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex gap-2">
          <Link href={`/dashboard/residents/${params.id}/care-plan`}>
            <Button variant="secondary">
              <BookOpen className="mr-2 h-4 w-4" />
              Care Plan
            </Button>
          </Link>

          <Link href={`/dashboard/residents/${params.id}/care-plan/edit`}>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>

          <Link href={`/dashboard/residents/${params.id}/care-plan/history`}>
            <Button variant="ghost">
              <Clock className="mr-2 h-4 w-4" />
              History
            </Button>
          </Link>
        </div>
      </div>

      {/* Resident Card */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-2xl font-bold">{name}</h1>
            {resident.room_number && (
              <p className="text-gray-500">Room {resident.room_number}</p>
            )}
            {resident.status && (
              <Chip className="mt-2" size="sm">
                {resident.status}
              </Chip>
            )}
          </div>

          <div className="rounded-full bg-gray-100 p-4">
            <User className="h-6 w-6 text-gray-600" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        <QuickAction
          icon={<ClipboardList />}
          label="Tasks"
          onClick={() => router.push(`/dashboard/residents/${params.id}/tasks`)}
        />
        <QuickAction
          icon={<FileText />}
          label="Notes"
          onClick={() => router.push(`/dashboard/residents/${params.id}/notes`)}
        />
        <QuickAction
          icon={<BookOpen />}
          label="Care Plan"
          onClick={() =>
            router.push(`/dashboard/residents/${params.id}/care-plan`)
          }
          primary
        />
        <QuickAction
          icon={<Clock />}
          label="History"
          onClick={() =>
            router.push(`/dashboard/residents/${params.id}/care-plan/history`)
          }
        />
      </div>

      {/* Risks */}
      {risks.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Risks
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {risks.map((risk, i) => (
              <div key={i} className="rounded-lg bg-red-50 p-3">
                <div className="flex justify-between">
                  <span className="font-medium">{risk.type}</span>
                  <Chip size="sm">{risk.level}</Chip>
                </div>
                {risk.notes && (
                  <p className="text-sm text-gray-600 mt-1">{risk.notes}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* Quick Action Component */
function QuickAction({
  icon,
  label,
  onClick,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 ${
        primary ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
      }`}
    >
      <div className="h-5 w-5">{icon}</div>
      <span className="text-xs">{label}</span>
    </button>
  );
}
