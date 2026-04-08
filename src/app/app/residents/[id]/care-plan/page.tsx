"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Target,
  Heart,
  Check,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
} from "lucide-react";
import { MobileHeader, PageContainer } from "@/components/layout/mobile-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { formatDate } from "@/lib/utils";
import { useCarePlan, useMarkCarePlanViewed } from "@/lib/hooks";

type KeyNeed = {
  category?: string;
  description?: string;
};

type KeyRisk = {
  type?: string;
  level?: string;
  description?: string;
  mitigation?: string;
};

type Goal = {
  description?: string;
  status?: string;
  target_date?: string | null;
};

function safeFormatDate(value?: string | null, fallback = "Not set") {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return formatDate(value);
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export default function CarePlanPage({ params }: { params: { id: string } }) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "risks",
    "needs",
  ]);
  const [markedAsViewed, setMarkedAsViewed] = useState(false);
  const [isMarkingViewed, setIsMarkingViewed] = useState(false);

  const { carePlan, isLoading, error } = useCarePlan(params.id);
  const { markAsViewed: recordView } = useMarkCarePlanViewed();

  useEffect(() => {
    if (carePlan?.has_viewed) {
      setMarkedAsViewed(true);
    } else {
      setMarkedAsViewed(false);
    }
  }, [carePlan?.has_viewed]);

  if (isLoading) {
    return (
      <PageContainer
        header={
          <MobileHeader
            title="Care Plan"
            showBack
            backHref={`/app/residents/${params.id}`}
          />
        }
      >
        <div className="p-4 text-center text-gray-500">
          Loading care plan...
        </div>
      </PageContainer>
    );
  }

  if (error || !carePlan) {
    return (
      <PageContainer
        header={
          <MobileHeader
            title="Care Plan"
            showBack
            backHref={`/app/residents/${params.id}`}
          />
        }
      >
        <div className="p-4 text-center text-gray-500">
          {error
            ? "Error loading care plan"
            : "No care plan found for this resident"}
        </div>
      </PageContainer>
    );
  }

  const keyNeeds = asArray<KeyNeed>((carePlan as any).key_needs);
  const keyRisks = asArray<KeyRisk>((carePlan as any).key_risks);
  const goals = asArray<Goal>((carePlan as any).goals);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const handleMarkAsViewed = async () => {
    setIsMarkingViewed(true);
    const result = await recordView(carePlan.id);
    if (result.success) {
      setMarkedAsViewed(true);
    }
    setIsMarkingViewed(false);
  };

  const summary =
    (carePlan as any).summary || "No care plan summary has been added yet.";

  const reviewDate = safeFormatDate((carePlan as any).review_date);
  const lastReviewedAt = safeFormatDate((carePlan as any).last_reviewed_at);

  return (
    <PageContainer
      header={
        <MobileHeader
          title="Care Plan"
          subtitle={carePlan.resident_name}
          showBack
          backHref={`/app/residents/${params.id}`}
        />
      }
    >
      <Card className="mb-4" padding="md">
        <CardContent>
          <p className="text-gray-700">{summary}</p>
          <div className="mt-4 flex items-center gap-4 border-t border-surface-100 pt-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Review: {reviewDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>Last reviewed: {lastReviewedAt}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <CollapsibleSection
        title="Key Risks"
        icon={<AlertTriangle className="h-5 w-5 text-care-red" />}
        expanded={expandedSections.includes("risks")}
        onToggle={() => toggleSection("risks")}
        badge={
          <Chip variant="danger" size="sm">
            {keyRisks.length}
          </Chip>
        }
      >
        {keyRisks.length > 0 ? (
          <div className="space-y-3">
            {keyRisks.map((risk, idx) => {
              const riskLevel = String(risk.level || "").toLowerCase();
              return (
                <div key={idx} className="rounded-button bg-surface-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {risk.type || "Risk"}
                    </span>
                    <Chip
                      variant={riskLevel === "high" ? "danger" : "warning"}
                      size="sm"
                    >
                      {risk.level || "Unknown"}
                    </Chip>
                  </div>
                  <p className="mb-2 text-sm text-gray-600">
                    {risk.description || "No description added."}
                  </p>
                  <div className="text-sm">
                    <span className="text-gray-500">Mitigation: </span>
                    <span className="text-gray-700">
                      {risk.mitigation || "No mitigation recorded."}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No key risks recorded.</p>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Key Needs"
        icon={<Heart className="h-5 w-5 text-pink-500" />}
        expanded={expandedSections.includes("needs")}
        onToggle={() => toggleSection("needs")}
      >
        {keyNeeds.length > 0 ? (
          <div className="space-y-3">
            {keyNeeds.map((need, idx) => (
              <div key={idx} className="rounded-button bg-surface-50 p-3">
                <span className="mb-1 block font-medium text-gray-900">
                  {need.category || "Need"}
                </span>
                <p className="text-sm text-gray-600">
                  {need.description || "No description added."}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No key needs recorded.</p>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Goals"
        icon={<Target className="h-5 w-5 text-primary-500" />}
        expanded={expandedSections.includes("goals")}
        onToggle={() => toggleSection("goals")}
      >
        {goals.length > 0 ? (
          <div className="space-y-3">
            {goals.map((goal, idx) => {
              const status = String(goal.status || "").toLowerCase();
              return (
                <div key={idx} className="rounded-button bg-surface-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="flex-1 text-gray-700">
                      {goal.description || "No goal description added."}
                    </p>
                    <Chip
                      variant={status === "on_track" ? "success" : "warning"}
                      size="sm"
                    >
                      {status === "on_track" ? "On track" : "Attention"}
                    </Chip>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Target: {safeFormatDate(goal.target_date)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No goals recorded.</p>
        )}
      </CollapsibleSection>

      <div className="mt-6">
        <Button
          fullWidth
          size="tap"
          variant={markedAsViewed ? "success" : "primary"}
          onClick={handleMarkAsViewed}
          disabled={markedAsViewed || isMarkingViewed}
          isLoading={isMarkingViewed}
        >
          {markedAsViewed ? (
            <>
              <Check className="mr-2 h-5 w-5" />
              Marked as Viewed
            </>
          ) : (
            <>
              <Check className="mr-2 h-5 w-5" />
              Mark as Viewed
            </>
          )}
        </Button>
        <p className="mt-2 text-center text-xs text-gray-500">
          This confirms you have read and understood this care plan
        </p>
      </div>
    </PageContainer>
  );
}

function CollapsibleSection({
  title,
  icon,
  expanded,
  onToggle,
  badge,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-4" padding="none">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold text-gray-900">{title}</span>
          {badge}
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-surface-100 px-4 pb-4 pt-4">
          {children}
        </div>
      )}
    </Card>
  );
}
