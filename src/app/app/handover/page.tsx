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

type PriorityItemLike =
  | string
  | {
      text?: string;
      label?: string;
      title?: string;
    }
  | null
  | undefined;

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

  const priorityItems = (
    ((handover?.priority_items as any) || []) as PriorityItemLike[]
  )
    .map((item) => {
      if (!item) return "";
      if (typeof item === "string") return item.trim();
      if (typeof item === "object") {
        return String(item.text || item.label || item.title || "").trim();
      }
      return "";
    })
    .filter(Boolean);

  useEffect(() => {
    if (handover?.manual_notes) {
      setNotes(handover.manual_notes);
    } else {
      setNotes("");
    }
  }, [handover?.manual_notes]);

  const handleSaveNotes = async () => {
    if (!handover) return;
    setIsSavingNotes(true);
    const result = await updateManualNotes(handover.id, notes);
    if (result.success) {
      setIsEditing(false);
    }
    setIsSavingNotes(false);
  };

  const handleMarkAsRead = async () => {
    if (!handover) return;
    setIsMarkingRead(true);
    await markAsRead(handover.id);
    setIsMarkingRead(false);
  };

  if (handoverLoading) {
    return (
      <PageContainer header={<MobileHeader title="Handover" />}>
        <div className="p-4 text-center text-gray-500">Loading handover...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer header={<MobileHeader title="Handover" />}>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setActiveTab("current")}
          className={`
            flex-1 rounded-button py-3 font-medium transition-colors
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
            flex-1 rounded-button py-3 font-medium transition-colors
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
                  value={(handover.auto_summary as any)?.total_logs || 0}
                  label="Logs"
                />
                <StatItem
                  icon={<Users className="h-5 w-5 text-primary-600" />}
                  value={(handover.auto_summary as any)?.residents_logged || 0}
                  label="Residents"
                />
                <StatItem
                  icon={<Check className="h-5 w-5 text-care-green" />}
                  value={(handover.auto_summary as any)?.tasks_completed || 0}
                  label="Tasks done"
                />
                <StatItem
                  icon={<Clock className="h-5 w-5 text-care-amber" />}
                  value={(handover.auto_summary as any)?.tasks_pending || 0}
                  label="Tasks pending"
                />
              </div>

              {((handover.auto_summary as any)?.incidents || 0) > 0 && (
                <div className="mt-4 flex items-center gap-2 rounded-button bg-red-50 p-3">
                  <AlertTriangle className="h-5 w-5 text-care-red" />
                  <span className="font-medium text-care-red">
                    {(handover.auto_summary as any).incidents} incident(s)
                    reported
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {priorityItems.length > 0 && (
            <Card className="mb-4 border-amber-200 bg-amber-50" padding="md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                  Priority Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {priorityItems.map((item, idx) => (
                    <div
                      key={`${item}-${idx}`}
                      className="flex items-start gap-3 rounded-button border border-amber-100 bg-white px-4 py-3"
                    >
                      <div className="mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-amber-500" />
                      <p className="text-sm leading-6 text-gray-800">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-4" padding="md">
            <CardHeader>
              <CardTitle>Handover Notes</CardTitle>
              {isSeniorStaff && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-primary-600"
                  aria-label="Edit handover notes"
                  title="Edit handover notes"
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
                    className="w-full resize-none rounded-button border border-surface-200 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500">
                    This edits the main handover note. Priority items are
                    generated from saved handover data.
                  </p>
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
                <p className="text-sm text-gray-500">Not yet read by anyone</p>
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
              <Check className="mr-2 h-5 w-5" />
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
                className="cursor-pointer transition-shadow hover:shadow-card-hover"
                onClick={() => router.push(`/app/handover/${handover.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
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
                    <p className="line-clamp-1 text-sm text-gray-600">
                      {handover.manual_notes || "Handover notes"}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      by {handover.created_by_name}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
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
