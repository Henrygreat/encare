"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Clock,
  MapPin,
  Users,
  Camera,
} from "lucide-react";
import { MobileHeader, PageContainer } from "@/components/layout/mobile-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { createClient } from "@/lib/supabase/client";
import type { IncidentSeverity } from "@/lib/database.types";

const INCIDENT_TYPES = [
  { value: "fall", label: "Fall", icon: "⚠️" },
  { value: "behaviour", label: "Behaviour", icon: "!" },
  { value: "medical", label: "Medical", icon: "🏥" },
  { value: "medication_error", label: "Medication Error", icon: "💊" },
  { value: "safeguarding", label: "Safeguarding", icon: "🛡" },
  { value: "property", label: "Property Damage", icon: "🔧" },
  { value: "other", label: "Other", icon: "•" },
];

const SEVERITY_OPTIONS: {
  value: IncidentSeverity;
  label: string;
  color: string;
}[] = [
  {
    value: "low",
    label: "Low",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  {
    value: "medium",
    label: "Medium",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    value: "high",
    label: "High",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  {
    value: "critical",
    label: "Critical",
    color: "bg-red-100 text-red-700 border-red-200",
  },
];

type CurrentUserProfile = {
  id: string;
  organisation_id: string | null;
  full_name: string | null;
};

export default function IncidentReportPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [incidentType, setIncidentType] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("low");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [witnesses, setWitnesses] = useState("");
  const [immediateAction, setImmediateAction] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);

  const canProceed = () => {
    if (step === 1) return incidentType !== "";
    if (step === 2) return description.trim().length >= 10;
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const supabase = createClient();

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        throw new Error("You must be signed in to submit an incident.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id, organisation_id, full_name")
        .eq("id", authUser.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Could not load your user profile.");
      }

      const currentUser = profile as CurrentUserProfile;

      if (!currentUser.organisation_id) {
        throw new Error("No organisation is linked to your account.");
      }

      const cleanedWitnesses = witnesses
        .split(",")
        .map((w) => w.trim())
        .filter(Boolean);

      const payload = {
        organisation_id: currentUser.organisation_id,
        resident_id: params.id,
        reported_by: currentUser.id,
        incident_type: incidentType,
        severity,
        description: description.trim(),
        location: location.trim() || null,
        occurred_at: new Date(occurredAt).toISOString(),
        witnesses: cleanedWitnesses,
        immediate_action: immediateAction.trim() || null,
        follow_up_required: followUpRequired,
      };

      const { data: insertedIncident, error: insertError } = await supabase
        .from("incidents")
        .insert(payload)
        .select("id, organisation_id, resident_id, incident_type, occurred_at")
        .single();

      if (insertError) {
        throw insertError;
      }

      console.log("Incident inserted successfully:", insertedIncident);

      setShowSuccess(true);

      window.setTimeout(() => {
        router.push(`/app/residents/${params.id}`);
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error("Failed to submit incident:", err);
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Failed to submit incident. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <PageContainer header={<MobileHeader title="Report Incident" showBack />}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-care-green">
            <Check className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Incident Reported
          </h2>
          <p className="mt-1 text-gray-500">Manager will be notified</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={
        <MobileHeader
          title="Report Incident"
          subtitle={`Step ${step} of 3`}
          showBack
          backHref={`/app/residents/${params.id}`}
        />
      }
    >
      <div className="mb-6 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              s <= step ? "bg-primary-600" : "bg-surface-200"
            }`}
          />
        ))}
      </div>

      {submitError && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              What type of incident?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {INCIDENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setIncidentType(type.value)}
                  className={`flex flex-col items-center justify-center rounded-card border-2 p-4 transition-all ${
                    incidentType === type.value
                      ? "border-primary-500 bg-primary-50"
                      : "border-surface-200 bg-white"
                  }`}
                >
                  <span className="mb-1 text-2xl">{type.icon}</span>
                  <span
                    className={`text-sm font-medium ${
                      incidentType === type.value
                        ? "text-primary-700"
                        : "text-gray-700"
                    }`}
                  >
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Severity level
            </h2>
            <div className="flex gap-2">
              {SEVERITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSeverity(option.value)}
                  className={`flex-1 rounded-button border-2 px-2 py-3 text-sm font-medium transition-all ${
                    severity === option.value
                      ? `${option.color} border-current`
                      : "border-surface-200 bg-white text-gray-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Describe what happened
            </h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of the incident..."
              rows={5}
              className="w-full resize-none rounded-card border border-surface-200 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">
              Minimum 10 characters ({description.trim().length}/10)
            </p>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Clock className="h-4 w-4" />
              When did it happen?
            </label>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="w-full rounded-button border border-surface-200 bg-white px-4 py-3 text-base text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <MapPin className="h-4 w-4" />
              Location (optional)
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Room 101, Dining room, Garden"
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Additional Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Users className="h-4 w-4" />
                  Witnesses (optional)
                </label>
                <Input
                  value={witnesses}
                  onChange={(e) => setWitnesses(e.target.value)}
                  placeholder="Names separated by commas"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Immediate action taken (optional)
                </label>
                <textarea
                  value={immediateAction}
                  onChange={(e) => setImmediateAction(e.target.value)}
                  placeholder="What did you do immediately after the incident?"
                  rows={3}
                  className="w-full resize-none rounded-button border border-surface-200 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <label className="flex items-center gap-3 rounded-card bg-surface-50 p-4">
                <input
                  type="checkbox"
                  checked={followUpRequired}
                  onChange={(e) => setFollowUpRequired(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="font-medium text-gray-900">
                    Follow-up required
                  </span>
                  <p className="text-sm text-gray-500">
                    Manager will be alerted for review
                  </p>
                </div>
              </label>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-card border-2 border-dashed border-surface-200 p-4 text-gray-500 transition-colors hover:border-surface-300 hover:text-gray-700"
              >
                <Camera className="h-6 w-6" />
                <span>Add photos (optional)</span>
              </button>
            </div>
          </div>

          <Card className="border-amber-200 bg-amber-50" padding="md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">
                  {INCIDENT_TYPES.find((t) => t.value === incidentType)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Severity:</span>
                <Chip
                  variant={
                    severity === "critical" || severity === "high"
                      ? "danger"
                      : severity === "medium"
                        ? "warning"
                        : "success"
                  }
                  size="sm"
                >
                  {severity}
                </Chip>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">
                  {new Date(occurredAt).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="fixed bottom-20 left-0 right-0 border-t border-surface-200 bg-white p-4">
        <div className="flex gap-3">
          {step > 1 && (
            <Button
              variant="secondary"
              size="tap"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              Back
            </Button>
          )}

          {step < 3 ? (
            <Button
              variant="primary"
              size="tap"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1"
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="danger"
              size="tap"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              className="flex-1"
            >
              <AlertTriangle className="mr-2 h-5 w-5" />
              Submit Incident Report
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
