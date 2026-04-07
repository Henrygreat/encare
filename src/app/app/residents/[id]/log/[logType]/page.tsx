"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, X } from "lucide-react";
import { MobileHeader, PageContainer } from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { LOG_TYPE_CONFIG, type LogTypeKey } from "@/lib/utils";
import { useCreateLog } from "@/lib/hooks/use-logs";
import type { LogType } from "@/lib/database.types";

// Preset configurations for each log type
const PRESETS: Record<LogType, { value: string; emoji?: string }[] | null> = {
  meal: [
    { value: "All", emoji: "✓" },
    { value: "Half", emoji: "½" },
    { value: "Little", emoji: "¼" },
    { value: "Refused", emoji: "✗" },
  ],
  drink: [
    { value: "Full", emoji: "●" },
    { value: "Half", emoji: "◐" },
    { value: "Little", emoji: "○" },
    { value: "Refused", emoji: "✗" },
  ],
  medication: [
    { value: "Given", emoji: "✓" },
    { value: "Refused", emoji: "✗" },
    { value: "Not available", emoji: "!" },
    { value: "N/A", emoji: "-" },
  ],
  toileting: [
    { value: "Assisted", emoji: "👐" },
    { value: "Independent", emoji: "✓" },
    { value: "Refused", emoji: "✗" },
    { value: "Issue", emoji: "!" },
  ],
  mood: [
    { value: "Calm", emoji: "😌" },
    { value: "Happy", emoji: "😊" },
    { value: "Anxious", emoji: "😰" },
    { value: "Upset", emoji: "😢" },
    { value: "Other", emoji: "•" },
  ],
  personal_care: [
    { value: "Wash", emoji: "🧼" },
    { value: "Shower", emoji: "🚿" },
    { value: "Dressing", emoji: "👕" },
    { value: "Oral care", emoji: "🦷" },
  ],
  activity: [
    { value: "Group activity", emoji: "👥" },
    { value: "One-to-one", emoji: "👤" },
    { value: "Walk", emoji: "🚶" },
    { value: "Exercise", emoji: "💪" },
  ],
  observation: null,
  incident: [
    { value: "Fall", emoji: "⚠️" },
    { value: "Behaviour", emoji: "!" },
    { value: "Medical", emoji: "🏥" },
    { value: "Safeguarding", emoji: "🛡" },
  ],
  note: null,
};

export default function LogPage({
  params,
}: {
  params: { id: string; logType: string };
}) {
  const router = useRouter();
  const { createLog, isLoading: isSaving, authLoading } = useCreateLog();
  const logType = params.logType as LogType;
  const config = LOG_TYPE_CONFIG[logType as LogTypeKey];
  const presets = PRESETS[logType];

  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (authLoading) {
      setError("Still loading your account. Please try again.");
      return;
    }

    if (!selectedValue && !notes.trim()) return;

    setError(null);

    const result = await createLog({
      residentId: params.id,
      logType,
      logData: { value: selectedValue },
      notes: notes.trim() || undefined,
    });

    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => {
        router.push(`/app/residents/${params.id}`);
      }, 800);
    } else {
      setError(result.error || "Failed to save log");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (showSuccess) {
    return (
      <PageContainer
        header={<MobileHeader title={config?.label || "Log"} showBack />}
      >
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-care-green animate-scale-in">
            <Check className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Logged!</h2>
        </div>
        <style jsx>{`
          @keyframes scale-in {
            from {
              transform: scale(0);
            }
            to {
              transform: scale(1);
            }
          }
          .animate-scale-in {
            animation: scale-in 0.3s ease-out;
          }
        `}</style>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={
        <MobileHeader
          title={config?.label || "Log"}
          subtitle="Select an option"
          showBack
          rightAction={
            <button
              onClick={handleCancel}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          }
        />
      }
      noPadding
    >
      <div className="p-4">
        {authLoading && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Loading your account…
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {presets && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            {presets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setSelectedValue(preset.value)}
                disabled={authLoading || isSaving}
                className={`
                  flex flex-col items-center justify-center rounded-card border-2 p-6 transition-all active:scale-95
                  ${
                    selectedValue === preset.value
                      ? "border-primary-500 bg-primary-50"
                      : "border-surface-200 bg-white hover:border-surface-300"
                  }
                  ${authLoading || isSaving ? "cursor-not-allowed opacity-60" : ""}
                `}
              >
                {preset.emoji && (
                  <span className="mb-2 text-3xl">{preset.emoji}</span>
                )}
                <span
                  className={`
                    text-lg font-medium
                    ${selectedValue === preset.value ? "text-primary-700" : "text-gray-900"}
                  `}
                >
                  {preset.value}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes..."
            rows={3}
            disabled={authLoading || isSaving}
            className="w-full resize-none rounded-button border border-surface-200 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <button
          disabled
          className="mb-6 flex w-full items-center gap-3 rounded-card border-2 border-dashed border-surface-200 p-4 text-gray-500 opacity-60"
        >
          <Camera className="h-6 w-6" />
          <span>Add photo (optional)</span>
        </button>

        <Button
          fullWidth
          size="tap"
          onClick={handleSubmit}
          isLoading={isSaving}
          disabled={authLoading || (!selectedValue && !notes.trim())}
        >
          <Check className="mr-2 h-5 w-5" />
          Save Log
        </Button>
      </div>
    </PageContainer>
  );
}
