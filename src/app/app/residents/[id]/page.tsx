"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ClipboardList,
  FileText,
  BookOpen,
  AlertTriangle,
  Utensils,
} from "lucide-react";
import { MobileHeader, PageContainer } from "@/components/layout/mobile-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Chip } from "@/components/ui/chip";
import { Timeline } from "@/components/ui/timeline";
import { QuickActionGrid } from "@/components/ui/quick-action-tile";
import { useResident } from "@/lib/hooks/use-residents";
import { useResidentTimeline } from "@/lib/hooks/use-logs";
import type { LogType } from "@/lib/database.types";

export default function ResidentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { resident, isLoading, error } = useResident(params.id);
  const { events, isLoading: timelineLoading } = useResidentTimeline(
    params.id,
    10,
  );
  const [showQuickLog, setShowQuickLog] = useState(false);

  const handleQuickLogSelect = (logType: LogType) => {
    if (logType === "incident") {
      router.push(`/app/residents/${params.id}/incident`);
      return;
    }

    router.push(`/app/residents/${params.id}/log/${logType}`);
  };

  if (isLoading) {
    return (
      <PageContainer
        header={
          <MobileHeader title="Loading..." showBack backHref="/app/residents" />
        }
      >
        <div className="animate-pulse space-y-4 p-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-surface-200" />
            <div className="flex-1">
              <div className="mb-2 h-5 w-40 rounded bg-surface-200" />
              <div className="h-4 w-24 rounded bg-surface-100" />
            </div>
          </div>
          <div className="h-32 rounded-2xl bg-surface-100" />
          <div className="h-48 rounded-2xl bg-surface-100" />
        </div>
      </PageContainer>
    );
  }

  if (error || !resident) {
    return (
      <PageContainer
        header={
          <MobileHeader title="Resident" showBack backHref="/app/residents" />
        }
      >
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <p className="font-medium text-gray-700">
            {error ? "Unable to load resident" : "Resident not found"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {error
              ? "Please try again later"
              : "This resident may have been removed"}
          </p>
          <button
            onClick={() => router.push("/app/residents")}
            className="mt-4 font-medium text-primary-600"
            type="button"
          >
            Back to residents
          </button>
        </div>
      </PageContainer>
    );
  }

  const riskFlags =
    (resident.risk_flags as Array<{
      type: string;
      level: string;
      notes: string;
    }>) || [];

  return (
    <PageContainer
      header={
        <MobileHeader
          title={`${resident.preferred_name || resident.first_name} ${resident.last_name}`}
          subtitle={
            resident.room_number ? `Room ${resident.room_number}` : undefined
          }
          showBack
          backHref="/app/residents"
        />
      }
      noPadding
    >
      <div className="border-b border-surface-200 bg-white px-4 py-5">
        <div className="flex items-center gap-4">
          <Avatar
            src={resident.photo_url}
            name={`${resident.first_name} ${resident.last_name}`}
            size="xl"
          />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {resident.preferred_name || resident.first_name}{" "}
              {resident.last_name}
            </h1>
            {resident.room_number && (
              <p className="text-gray-500">Room {resident.room_number}</p>
            )}
            {riskFlags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {riskFlags.map((risk, i) => (
                  <Chip
                    key={i}
                    variant={risk.level === "high" ? "danger" : "warning"}
                    size="sm"
                  >
                    {risk.type}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4 grid grid-cols-4 gap-3">
          <QuickActionButton
            icon={<Utensils className="h-6 w-6" />}
            label="Log Care"
            onClick={() => setShowQuickLog(!showQuickLog)}
            primary
          />
          <QuickActionButton
            icon={<ClipboardList className="h-6 w-6" />}
            label="Tasks"
            onClick={() => router.push(`/app/residents/${params.id}/tasks`)}
          />
          <QuickActionButton
            icon={<FileText className="h-6 w-6" />}
            label="Notes"
            onClick={() => router.push(`/app/residents/${params.id}/notes`)}
          />
          <QuickActionButton
            icon={<BookOpen className="h-6 w-6" />}
            label="Care Plan"
            onClick={() => router.push(`/app/residents/${params.id}/care-plan`)}
          />
        </div>

        {showQuickLog && (
          <Card className="mb-4 animate-slide-up" padding="md">
            <CardHeader>
              <CardTitle>Quick Log</CardTitle>
              <button
                onClick={() => setShowQuickLog(false)}
                className="text-sm text-gray-500"
                type="button"
              >
                Close
              </button>
            </CardHeader>
            <CardContent>
              <QuickActionGrid onSelect={handleQuickLogSelect} />
            </CardContent>
          </Card>
        )}

        {(resident.dietary_requirements ||
          resident.mobility_notes ||
          resident.communication_needs) && (
          <Card className="mb-4" padding="md">
            <CardHeader>
              <CardTitle>Key Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {resident.dietary_requirements && (
                <InfoRow label="Diet" value={resident.dietary_requirements} />
              )}
              {resident.mobility_notes && (
                <InfoRow label="Mobility" value={resident.mobility_notes} />
              )}
              {resident.communication_needs && (
                <InfoRow
                  label="Communication"
                  value={resident.communication_needs}
                />
              )}
            </CardContent>
          </Card>
        )}

        <Card padding="md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <Link
              href={`/app/residents/${params.id}/timeline`}
              className="text-sm font-medium text-primary-600"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {timelineLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex animate-pulse gap-3">
                    <div className="h-8 w-8 rounded-full bg-surface-200" />
                    <div className="flex-1">
                      <div className="mb-2 h-3 w-24 rounded bg-surface-200" />
                      <div className="h-3 w-full rounded bg-surface-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="py-6 text-center text-gray-500">
                <p className="text-sm">No activity recorded yet</p>
              </div>
            ) : (
              <Timeline events={events} />
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

function QuickActionButton({
  icon,
  label,
  onClick,
  primary = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex flex-col items-center justify-center gap-1.5 rounded-card p-3 transition-all active:scale-95 ${
        primary
          ? "bg-primary-600 text-white"
          : "bg-surface-100 text-gray-700 hover:bg-surface-200"
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-surface-100 py-2 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-medium text-gray-900">
        {value}
      </span>
    </div>
  );
}
