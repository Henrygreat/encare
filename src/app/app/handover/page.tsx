"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Check,
  ChevronRight,
  Clock,
  Users,
  AlertTriangle,
  Edit3,
} from "lucide-react";
import { MobileHeader, PageContainer } from "@/components/layout/mobile-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Avatar } from "@/components/ui/avatar";
import { formatDate, formatTime } from "@/lib/utils";
import {
  useTodayHandover,
  usePreviousHandovers,
  useHandoverActions,
  useAuth,
} from "@/lib/hooks";

function normalizePriorityItems(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item: unknown) => {
      if (typeof item === "string") return item.trim();

      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;

        if (typeof record.text === "string") return record.text.trim();
        if (typeof record.title === "string") return record.title.trim();
        if (typeof record.note === "string") return record.note.trim();
        if (typeof record.description === "string")
          return record.description.trim();
        if (typeof record.message === "string") return record.message.trim();
      }

      return "";
    })
    .filter((text) => text.length > 0);
}

function getSummaryValue(summary: unknown, key: string, fallback = 0): number {
  if (!summary || typeof summary !== "object") return fallback;

  const value = (summary as Record<string, unknown>)[key];
  return typeof value === "number" ? value : fallback;
}

export default function HandoverPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"current" | "previous">("current");
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  const { handover, isLoading: handoverLoading } = useTodayHandover();
  const { handovers: previousHandovers, isLoading: previousLoading } =
    usePreviousHandovers();
  const { updateManualNotes, markAsRead } = useHandoverActions();

  const isSeniorStaff = user?.role === "manager" || user?.role === "admin";

  useEffect(() => {
    setNotes(handover?.manual_notes || "");
  }, [handover?.manual_notes]);

  const handleSaveNotes = async () => {
    if (!handover) return;

    setIsSavingNotes(true);

    try {
      const result = await updateManualNotes(handover.id, notes);

      if (result.success) {
        setIsEditing(false);
      } else {
        alert(result.error || "Unable to save handover notes.");
      }
    } catch (error) {
      console.error("Save handover notes error:", error);
      alert("Unable to save handover notes.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleMarkAsRead = async () => {
    if (!handover) return;

    setIsMarkingRead(true);

    try {
      const result = await markAsRead(handover.id);

      if (!result.success) {
        alert(result.error || "Unable to mark handover as read.");
      }
    } catch (error) {
      console.error("Mark handover as read error:", error);
      alert("Unable to mark handover as read.");
    } finally {
      setIsMarkingRead(false);
    }
  };

  if (handoverLoading) {
    return (
      <PageContainer header={<MobileHeader title="Handover" />}>
        <div className="p-4 text-center text-gray-500">Loading handover...</div>
      </PageContainer>
    );
  }

  const summary = handover?.auto_summary;
  const priorityItems = normalizePriorityItems(handover?.priority_items);

  return (
    <PageContainer header={<MobileHeader title="Handover" />}>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("current")}
          className={`
            flex-1 py-3 rounded-button font-medium transition-colors
            ${
              activeTab === "current"
                ? "bg-primary-600 text-white"
                : "bg-surface-100 text-gray-700"
            }
          `}
        >
          Current Shift
        </button>

        <button
          onClick={() => setActiveTab("previous")}
          className={`
            flex-1 py-3 rounded-button font-medium transition-colors
            ${
              activeTab === "previous"
                ? "bg-primary-600 text-white"
                : "bg-surface-100 text-gray-700"
            }
          `}
        >
          Previous
        </button>
      </div>

      {activeTab === "current" && handover && (
        <>
          <Card className="mb-4" padding="md">
            <CardHeader>
              <CardTitle>Shift Summary</CardTitle>
              <Chip variant="primary" size="sm">
                {handover.shift_type || "morning"}
              </Chip>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <StatItem
                  icon={<FileText className="h-5 w-5 text-primary-600" />}
                  value={getSummaryValue(summary, "total_logs")}
                  label="Logs"
                />

                <StatItem
                  icon={<Users className="h-5 w-5 text-primary-600" />}
                  value={getSummaryValue(summary, "residents_logged")}
                  label="Residents"
                />

                <StatItem
                  icon={<Check className="h-5 w-5 text-care-green" />}
                  value={getSummaryValue(summary, "tasks_completed")}
                  label="Tasks done"
                />

                <StatItem
                  icon={<Clock className="h-5 w-5 text-care-amber" />}
                  value={getSummaryValue(summary, "tasks_pending")}
                  label="Tasks pending"
                />
              </div>

              {getSummaryValue(summary, "incidents") > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-button flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-care-red" />
                  <span className="text-care-red font-medium">
                    {getSummaryValue(summary, "incidents")} incident(s) reported
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-4 border-amber-200 bg-amber-50" padding="md">
            <CardHeader>
              <CardTitle className="text-amber-700 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Priority Items
              </CardTitle>
            </CardHeader>

            <CardContent>
              {priorityItems.length > 0 ? (
                <div className="space-y-3">
                  {priorityItems.map((text, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-button flex items-start gap-3"
                    >
                      <div className="h-2 w-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                      <p className="text-gray-700">{text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-white rounded-button">
                  <p className="text-sm text-amber-800">
                    No urgent priority items for this handover.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-4" padding="md">
            <CardHeader>
              <CardTitle>Handover Notes</CardTitle>

              {isSeniorStaff && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-primary-600"
                >
                  <Edit3 className="h-5 w-5" />
                </button>
              )}
            </CardHeader>

            <CardContent>
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes for the next shift..."
                    rows={4}
                    className="w-full rounded-button border border-surface-200 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />

                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveNotes}
                      isLoading={isSavingNotes}
                      disabled={isSavingNotes}
                    >
                      Save
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setNotes(handover.manual_notes || "");
                        setIsEditing(false);
                      }}
                      disabled={isSavingNotes}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">
                  {notes || "No additional notes. Tap edit to add."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle>Read By</CardTitle>
            </CardHeader>

            <CardContent>
              {(handover.read_by_list || []).length > 0 ? (
                <div className="space-y-2">
                  {(handover.read_by_list || []).map((reader) => (
                    <div
                      key={reader.user_id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={reader.name} size="sm" />
                        <span className="text-gray-700">{reader.name}</span>
                      </div>

                      <span className="text-sm text-gray-500">
                        {formatTime(reader.read_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Not yet read by anyone</p>
              )}
            </CardContent>
          </Card>

          <div className="mt-4">
            <Button
              fullWidth
              size="tap"
              variant="success"
              onClick={handleMarkAsRead}
              isLoading={isMarkingRead}
              disabled={isMarkingRead}
            >
              <Check className="h-5 w-5 mr-2" />
              Mark as Read
            </Button>
          </div>
        </>
      )}

      {activeTab === "current" && !handover && !handoverLoading && (
        <div className="p-4 text-center text-gray-500">
          No handover notes for today yet
        </div>
      )}

      {activeTab === "previous" && (
        <div className="space-y-3">
          {previousLoading ? (
            <div className="p-4 text-center text-gray-500">
              Loading handovers...
            </div>
          ) : previousHandovers.length > 0 ? (
            previousHandovers.map((handover) => (
              <Card
                key={handover.id}
                padding="md"
                className="cursor-pointer hover:shadow-card-hover transition-shadow"
                onClick={() => router.push(`/app/handover/${handover.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {formatDate(handover.shift_date)}
                      </span>

                      <Chip variant="default" size="sm">
                        {handover.shift_type}
                      </Chip>

                      {handover.finalized_at && (
                        <Check className="h-4 w-4 text-care-green" />
                      )}
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-1">
                      {handover.manual_notes || "Handover notes"}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      by {handover.created_by_name}
                    </p>
                  </div>

                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </div>
              </Card>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No previous handovers
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}

function StatItem({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}
