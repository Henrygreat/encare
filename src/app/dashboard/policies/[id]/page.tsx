"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  ExternalLink,
  UserPlus,
  Send,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Avatar } from "@/components/ui/avatar";
import {
  usePolicy,
  usePolicyAssignments,
  usePolicyActions,
  useStaffForAssignment,
} from "@/lib/hooks";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { PolicyStatus } from "@/lib/database.types";

const statusConfig: Record<
  PolicyStatus,
  { label: string; variant: "default" | "success" | "warning" }
> = {
  draft: { label: "Draft", variant: "warning" },
  published: { label: "Published", variant: "success" },
  archived: { label: "Archived", variant: "default" },
};

export default function PolicyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const {
    policy,
    isLoading: policyLoading,
    refetch: refetchPolicy,
  } = usePolicy(params.id);
  const {
    assignments,
    isLoading: assignmentsLoading,
    refetch: refetchAssignments,
  } = usePolicyAssignments(params.id);
  const { staff, isLoading: staffLoading } = useStaffForAssignment();
  const {
    publishPolicy,
    assignPolicy,
    removeAssignment,
    isLoading: actionLoading,
  } = usePolicyActions();

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  const assignedUserIds = new Set(assignments.map((a) => a.user_id));
  const unassignedStaff = staff.filter((s) => !assignedUserIds.has(s.id));

  const handlePublish = async () => {
    if (!policy) return;
    try {
      await publishPolicy(policy.id);
      await refetchPolicy();
    } catch (err) {
      console.error("Error publishing:", err);
    }
  };

  const handleAssign = async () => {
    if (!policy || selectedStaff.length === 0) return;
    try {
      await assignPolicy(policy.id, selectedStaff);
      setSelectedStaff([]);
      setShowAssignModal(false);
      await refetchAssignments();
    } catch (err) {
      console.error("Error assigning:", err);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      await removeAssignment(assignmentId);
      await refetchAssignments();
    } catch (err) {
      console.error("Error removing assignment:", err);
    }
  };

  const handleAssignAll = async () => {
    if (!policy || unassignedStaff.length === 0) return;
    try {
      await assignPolicy(
        policy.id,
        unassignedStaff.map((s) => s.id),
      );
      await refetchAssignments();
    } catch (err) {
      console.error("Error assigning all:", err);
    }
  };

  if (policyLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded bg-slate-200" />
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-6 w-1/3 rounded bg-slate-200" />
            <div className="mt-4 h-32 rounded bg-slate-100" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          Policy not found
        </h2>
        <Link href="/dashboard/policies" className="mt-4">
          <Button variant="secondary">Back to Policies</Button>
        </Link>
      </div>
    );
  }

  const config = statusConfig[policy.status];
  const acknowledgedCount = assignments.filter((a) => a.acknowledgement).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/policies"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {policy.title}
              </h1>
              <Chip variant={config.variant}>{config.label}</Chip>
              {policy.version > 1 && (
                <span className="text-sm text-slate-500">
                  v{policy.version}
                </span>
              )}
            </div>
            {policy.summary && (
              <p className="mt-1 text-slate-600">{policy.summary}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {policy.status === "draft" && (
            <Button onClick={handlePublish} disabled={actionLoading}>
              <Send className="mr-2 h-4 w-4" />
              Publish
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Policy Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              {policy.content ? (
                <div className="prose prose-slate max-w-none whitespace-pre-wrap text-sm">
                  {policy.content}
                </div>
              ) : policy.file_url ? (
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                  <FileText className="h-8 w-8 text-slate-400" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">
                      {policy.file_name || "Attached Document"}
                    </p>
                    <p className="text-sm text-slate-500">External file</p>
                  </div>
                  <a
                    href={policy.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Open <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ) : (
                <p className="text-slate-500">No content added yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-slate-500">Created</dt>
                  <dd className="font-medium text-slate-900">
                    {formatDate(policy.created_at)}
                  </dd>
                </div>
                {policy.published_at && (
                  <div>
                    <dt className="text-sm text-slate-500">Published</dt>
                    <dd className="font-medium text-slate-900">
                      {formatDate(policy.published_at)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-slate-500">Created by</dt>
                  <dd className="font-medium text-slate-900">
                    {policy.creator?.full_name || "Unknown"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">
                    Requires acknowledgement
                  </dt>
                  <dd className="font-medium text-slate-900">
                    {policy.requires_acknowledgement ? "Yes" : "No"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assigned Staff
              </CardTitle>
              {policy.status === "published" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAssignModal(true)}
                >
                  <UserPlus className="mr-1 h-4 w-4" />
                  Assign
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {policy.status !== "published" ? (
                <p className="text-sm text-slate-500">
                  Publish the policy to assign it to staff.
                </p>
              ) : assignmentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-12 animate-pulse rounded-lg bg-slate-100"
                    />
                  ))}
                </div>
              ) : assignments.length === 0 ? (
                <div className="py-6 text-center">
                  <Users className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">
                    No staff assigned yet
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={handleAssignAll}
                    disabled={actionLoading || unassignedStaff.length === 0}
                  >
                    Assign All Staff
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center gap-4 rounded-xl bg-slate-50 p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          className={`h-5 w-5 ${
                            acknowledgedCount === assignments.length
                              ? "text-emerald-500"
                              : "text-slate-400"
                          }`}
                        />
                        <span className="font-semibold text-slate-900">
                          {acknowledgedCount} / {assignments.length}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        have acknowledged
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-slate-900">
                        {assignments.length > 0
                          ? Math.round(
                              (acknowledgedCount / assignments.length) * 100,
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>

                  <div className="max-h-80 space-y-2 overflow-y-auto">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
                      >
                        <Avatar name={assignment.user.full_name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-900">
                            {assignment.user.full_name}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {assignment.user.email}
                          </p>
                        </div>
                        {assignment.acknowledgement ? (
                          <div className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs">
                              {formatRelativeTime(
                                assignment.acknowledgement.acknowledged_at,
                              )}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">
                              Pending
                            </span>
                            <button
                              onClick={() =>
                                handleRemoveAssignment(assignment.id)
                              }
                              className="text-slate-400 hover:text-red-500"
                              title="Remove assignment"
                              type="button"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {unassignedStaff.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => setShowAssignModal(true)}
                    >
                      <UserPlus className="mr-1 h-4 w-4" />
                      Assign More ({unassignedStaff.length} remaining)
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-[24px] border border-white/80 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Assign Staff
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Select staff members to assign this policy to
            </p>

            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {staffLoading ? (
                <div className="py-4 text-center text-slate-500">
                  Loading...
                </div>
              ) : unassignedStaff.length === 0 ? (
                <div className="py-4 text-center text-slate-500">
                  All staff have been assigned
                </div>
              ) : (
                unassignedStaff.map((member) => (
                  <label
                    key={member.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStaff.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStaff([...selectedStaff, member.id]);
                        } else {
                          setSelectedStaff(
                            selectedStaff.filter((id) => id !== member.id),
                          );
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <Avatar name={member.full_name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">
                        {member.full_name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {member.role}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedStaff([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={selectedStaff.length === 0 || actionLoading}
                isLoading={actionLoading}
              >
                Assign ({selectedStaff.length})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
