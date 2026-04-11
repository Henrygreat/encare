"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  FileText,
} from "lucide-react";
import { MobileHeader, PageContainer } from "@/components/layout/mobile-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { formatDate } from "@/lib/utils";
import { useCarePlan, useMarkCarePlanViewed } from "@/lib/hooks";

type CarePlanSection = {
  id: string;
  section_key?: string | null;
  section_label?: string | null;
  content?: string | null;
  sort_order?: number | null;
};

function safeFormatDate(value?: string | null, fallback = "Not set") {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return formatDate(value);
}

function asSectionArray(value: unknown): CarePlanSection[] {
  return Array.isArray(value) ? (value as CarePlanSection[]) : [];
}

function getSectionContent(
  sections: CarePlanSection[],
  key: string,
  fallback = "No information recorded.",
) {
  const section = sections.find((item) => item.section_key === key);
  return section?.content?.trim() || fallback;
}

export default function CarePlanPage({ params }: { params: { id: string } }) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "dietary_requirements",
    "mobility",
    "risk_notes",
  ]);
  const [markedAsViewed, setMarkedAsViewed] = useState(false);
  const [isMarkingViewed, setIsMarkingViewed] = useState(false);

  const { carePlan, isLoading, error } = useCarePlan(params.id);
  const { markAsViewed: recordView } = useMarkCarePlanViewed();

  useEffect(() => {
    if ((carePlan as any)?.has_viewed) {
      setMarkedAsViewed(true);
    } else {
      setMarkedAsViewed(false);
    }
  }, [(carePlan as any)?.has_viewed]);

  const sections = useMemo(() => {
    const raw =
      (carePlan as any)?.care_plan_sections ||
      (carePlan as any)?.sections ||
      [];
    return asSectionArray(raw).sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
    );
  }, [carePlan]);

  const residentName =
    (carePlan as any)?.resident_name ||
    (() => {
      const resident = (carePlan as any)?.residents;
      if (!resident) return "Resident";
      return resident.preferred_name || resident.first_name || "Resident";
    })();

  const summary =
    (carePlan as any)?.summary || "No care plan summary has been added yet.";

  const reviewDate = safeFormatDate((carePlan as any)?.review_date);
  const publishedAt = safeFormatDate((carePlan as any)?.published_at);
  const createdAt = safeFormatDate((carePlan as any)?.created_at);

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionKey)
        ? prev.filter((item) => item !== sectionKey)
        : [...prev, sectionKey],
    );
  };

  const handleMarkAsViewed = async () => {
    if (!carePlan?.id) return;

    setIsMarkingViewed(true);
    const result = await recordView(carePlan.id);

    if (result.success) {
      setMarkedAsViewed(true);
    }

    setIsMarkingViewed(false);
  };

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

  if (error) {
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
          Error loading care plan
        </div>
      </PageContainer>
    );
  }

  if (!carePlan) {
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
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-100">
            <FileText className="h-7 w-7 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            No active care plan
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            A care plan has not been published for this resident yet.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={
        <MobileHeader
          title="Care Plan"
          subtitle={residentName}
          showBack
          backHref={`/app/residents/${params.id}`}
        />
      }
    >
      <Card className="mb-4" padding="md">
        <CardContent>
          <p className="text-gray-700">{summary}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Chip variant="success" size="sm">
              {(carePlan as any)?.status || "active"}
            </Chip>
            <Chip variant="default" size="sm">
              Version {(carePlan as any)?.version || 1}
            </Chip>
          </div>

          <div className="mt-4 grid gap-3 border-t border-surface-100 pt-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Review date: {reviewDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Published: {publishedAt}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Created: {createdAt}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <CollapsibleSection
        title="Dietary requirements"
        sectionKey="dietary_requirements"
        expanded={expandedSections.includes("dietary_requirements")}
        onToggle={() => toggleSection("dietary_requirements")}
      >
        <p className="text-sm text-gray-700">
          {getSectionContent(
            sections,
            "dietary_requirements",
            "No dietary requirements recorded.",
          )}
        </p>
      </CollapsibleSection>

      <CollapsibleSection
        title="Mobility"
        sectionKey="mobility"
        expanded={expandedSections.includes("mobility")}
        onToggle={() => toggleSection("mobility")}
      >
        <p className="text-sm text-gray-700">
          {getSectionContent(
            sections,
            "mobility",
            "No mobility guidance recorded.",
          )}
        </p>
      </CollapsibleSection>

      <CollapsibleSection
        title="Communication needs"
        sectionKey="communication"
        expanded={expandedSections.includes("communication")}
        onToggle={() => toggleSection("communication")}
      >
        <p className="text-sm text-gray-700">
          {getSectionContent(
            sections,
            "communication",
            "No communication needs recorded.",
          )}
        </p>
      </CollapsibleSection>

      <CollapsibleSection
        title="Medication support"
        sectionKey="medication_support"
        expanded={expandedSections.includes("medication_support")}
        onToggle={() => toggleSection("medication_support")}
      >
        <p className="text-sm text-gray-700">
          {getSectionContent(
            sections,
            "medication_support",
            "No medication support guidance recorded.",
          )}
        </p>
      </CollapsibleSection>

      <CollapsibleSection
        title="Personal care"
        sectionKey="personal_care"
        expanded={expandedSections.includes("personal_care")}
        onToggle={() => toggleSection("personal_care")}
      >
        <p className="text-sm text-gray-700">
          {getSectionContent(
            sections,
            "personal_care",
            "No personal care guidance recorded.",
          )}
        </p>
      </CollapsibleSection>

      <CollapsibleSection
        title="Behaviour support"
        sectionKey="behaviour_support"
        expanded={expandedSections.includes("behaviour_support")}
        onToggle={() => toggleSection("behaviour_support")}
      >
        <p className="text-sm text-gray-700">
          {getSectionContent(
            sections,
            "behaviour_support",
            "No behaviour support guidance recorded.",
          )}
        </p>
      </CollapsibleSection>

      <CollapsibleSection
        title="Risk notes"
        sectionKey="risk_notes"
        expanded={expandedSections.includes("risk_notes")}
        onToggle={() => toggleSection("risk_notes")}
        badge={
          <Chip variant="danger" size="sm">
            High attention
          </Chip>
        }
      >
        <div className="rounded-button bg-red-50 p-3">
          <p className="text-sm text-gray-700">
            {getSectionContent(
              sections,
              "risk_notes",
              "No risk notes recorded.",
            )}
          </p>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Care instructions"
        sectionKey="care_instructions"
        expanded={expandedSections.includes("care_instructions")}
        onToggle={() => toggleSection("care_instructions")}
      >
        <p className="text-sm text-gray-700">
          {getSectionContent(
            sections,
            "care_instructions",
            "No care instructions recorded.",
          )}
        </p>
      </CollapsibleSection>

      <CollapsibleSection
        title="Escalation guidance"
        sectionKey="escalation_guidance"
        expanded={expandedSections.includes("escalation_guidance")}
        onToggle={() => toggleSection("escalation_guidance")}
        badge={
          <Chip variant="warning" size="sm">
            Important
          </Chip>
        }
      >
        <div className="rounded-button bg-amber-50 p-3">
          <p className="text-sm text-gray-700">
            {getSectionContent(
              sections,
              "escalation_guidance",
              "No escalation guidance recorded.",
            )}
          </p>
        </div>
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
  sectionKey,
  expanded,
  onToggle,
  badge,
  children,
}: {
  title: string;
  sectionKey: string;
  expanded: boolean;
  onToggle: () => void;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const isRisk = sectionKey === "risk_notes";

  return (
    <Card
      className={`mb-4 ${isRisk ? "border-care-red/20" : ""}`}
      padding="none"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          {isRisk ? (
            <AlertTriangle className="h-5 w-5 text-care-red" />
          ) : (
            <FileText className="h-5 w-5 text-primary-500" />
          )}
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
