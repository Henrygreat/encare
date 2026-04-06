"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  FileText,
} from "lucide-react";
import { MobileHeader, PageContainer } from "@/components/layout/mobile-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import type { Task } from "@/lib/database.types";

type TaskWithResident = Task & {
  resident_name?: string;
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [task, setTask] = useState<TaskWithResident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string>("");

  const loadTask = async () => {
    if (!id) return;

    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          `
          *,
          residents (
            first_name,
            last_name,
            preferred_name
          )
        `,
        )
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setTask(null);
        return;
      }

      const resident = Array.isArray((data as any).residents)
        ? (data as any).residents[0]
        : (data as any).residents;

      const residentName = resident
        ? `${resident.preferred_name || resident.first_name} ${resident.last_name}`
        : undefined;

      setTask({
        ...(data as Task),
        resident_name: residentName,
      });
    } catch (err) {
      console.error("Failed to load task:", err);
      setError("Unable to load task details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTask();
  }, [id]);

  const handleComplete = async () => {
    if (!task || !user?.id) return;
    setIsActing(true);

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          completed_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      if (error) throw error;
      await loadTask();
    } catch (err) {
      console.error("Complete task error:", err);
      alert("Unable to complete task.");
    } finally {
      setIsActing(false);
    }
  };

  const handleSnooze = async () => {
    if (!task) return;
    setIsActing(true);

    try {
      const snoozedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from("tasks")
        .update({
          status: "snoozed",
          snoozed_until: snoozedUntil,
          snooze_reason: "Snoozed for 1 hour",
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      if (error) throw error;
      await loadTask();
    } catch (err) {
      console.error("Snooze task error:", err);
      alert("Unable to snooze task.");
    } finally {
      setIsActing(false);
    }
  };

  const handleEscalate = async () => {
    if (!task) return;
    setIsActing(true);

    try {
      const currentMetadata =
        task.metadata && typeof task.metadata === "object" ? task.metadata : {};

      const { error } = await supabase
        .from("tasks")
        .update({
          escalated_at: new Date().toISOString(),
          escalated_to: "manager",
          metadata: {
            ...currentMetadata,
            escalated: true,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      if (error) throw error;
      await loadTask();
    } catch (err) {
      console.error("Escalate task error:", err);
      alert("Unable to escalate task.");
    } finally {
      setIsActing(false);
    }
  };

  const getPriorityVariant = (priority?: string) => {
    if (priority === "high") return "danger";
    if (priority === "medium") return "warning";
    return "default";
  };

  const getStatusVariant = (status?: string) => {
    if (status === "completed") return "success";
    if (status === "snoozed") return "warning";
    return "default";
  };

  return (
    <PageContainer
      header={
        <MobileHeader
          title="Task Details"
          subtitle={task?.resident_name || "Care task"}
          showBack
          backHref="/app/tasks"
        />
      }
    >
      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Loading task...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : !task ? (
        <div className="py-12 text-center text-gray-500">Task not found.</div>
      ) : (
        <div className="space-y-4">
          <Card padding="md">
            <CardHeader>
              <CardTitle>{task.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.description ? (
                <p className="text-sm text-gray-600">{task.description}</p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Chip variant={getPriorityVariant(task.priority)} size="sm">
                  {task.priority || "normal"}
                </Chip>
                <Chip variant={getStatusVariant(task.status)} size="sm">
                  {task.status}
                </Chip>
                {task.task_type ? (
                  <Chip size="sm">{task.task_type}</Chip>
                ) : null}
              </div>

              <div className="space-y-3 text-sm">
                {task.resident_name ? (
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{task.resident_name}</span>
                  </div>
                ) : null}

                {task.due_at ? (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>Due: {new Date(task.due_at).toLocaleString()}</span>
                  </div>
                ) : null}

                {task.snoozed_until ? (
                  <div className="flex items-center gap-2 text-amber-700">
                    <Clock className="h-4 w-4" />
                    <span>
                      Snoozed until:{" "}
                      {new Date(task.snoozed_until).toLocaleString()}
                    </span>
                  </div>
                ) : null}

                {task.escalated_at ? (
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      Escalated at:{" "}
                      {new Date(task.escalated_at).toLocaleString()}
                    </span>
                  </div>
                ) : null}

                {task.completed_at ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>
                      Completed at:{" "}
                      {new Date(task.completed_at).toLocaleString()}
                    </span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button
                onClick={handleComplete}
                disabled={isActing || task.status === "completed"}
                fullWidth
              >
                Complete task
              </Button>

              <Button
                variant="secondary"
                onClick={handleSnooze}
                disabled={isActing || task.status === "completed"}
                fullWidth
              >
                Snooze for 1 hour
              </Button>

              <Button
                variant="secondary"
                onClick={handleEscalate}
                disabled={isActing}
                fullWidth
              >
                Escalate task
              </Button>
            </CardContent>
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle>Notes & audit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4 mt-0.5 text-gray-400" />
                <div>
                  {task.snooze_reason ? (
                    <p>Snooze reason: {task.snooze_reason}</p>
                  ) : (
                    <p>No notes or audit comments yet.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
