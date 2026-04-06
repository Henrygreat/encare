"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import type { Task } from "@/lib/database.types";

type TaskWithResident = Task & {
  resident_name?: string;
};

export default function DashboardTasksPage() {
  const router = useRouter();
  const supabase = createClient();
  const { organisation, isLoading: authLoading, user } = useAuth();

  const [tasks, setTasks] = useState<TaskWithResident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTasks = async () => {
    if (!organisation?.id) return;

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
        .eq("organisation_id", organisation.id)
        .order("due_at", { ascending: true });

      if (error) throw error;

      const mapped: TaskWithResident[] = (data || []).map((task: any) => {
        const resident = Array.isArray(task.residents)
          ? task.residents[0]
          : task.residents;
        const residentName = resident
          ? `${resident.preferred_name || resident.first_name} ${resident.last_name}`
          : undefined;

        return {
          ...task,
          resident_name: residentName,
        };
      });

      setTasks(mapped);
    } catch (err) {
      console.error("Failed to load manager tasks:", err);
      setError("Unable to load task oversight.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && organisation?.id) {
      void loadTasks();
    }
  }, [authLoading, organisation?.id]);

  const now = new Date();

  const overdueTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.status === "pending" &&
          t.due_at &&
          new Date(t.due_at).getTime() < now.getTime(),
      ),
    [tasks],
  );

  const pendingTasks = useMemo(
    () => tasks.filter((t) => t.status === "pending"),
    [tasks],
  );

  const completedToday = useMemo(
    () =>
      tasks.filter((t) => {
        if (t.status !== "completed" || !t.completed_at) return false;
        const completed = new Date(t.completed_at);
        return completed.toDateString() === now.toDateString();
      }),
    [tasks],
  );

  const snoozedTasks = useMemo(
    () => tasks.filter((t) => t.status === "snoozed"),
    [tasks],
  );

  const escalateTask = async (task: Task) => {
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
            escalated_by_dashboard: true,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      if (error) throw error;
      await loadTasks();
    } catch (err) {
      console.error("Failed to escalate task:", err);
      alert("Unable to escalate task.");
    }
  };

  const markDone = async (task: Task) => {
    if (!user?.id) return;

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
      await loadTasks();
    } catch (err) {
      console.error("Failed to complete task:", err);
      alert("Unable to complete task.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manager tasks</h1>
        <p className="mt-1 text-sm text-slate-600">
          Monitor overdue work, snoozed tasks, and operational exceptions.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          title="Overdue"
          value={overdueTasks.length}
          tone="danger"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <SummaryCard
          title="Pending"
          value={pendingTasks.length}
          tone="default"
          icon={<Clock className="h-5 w-5" />}
        />
        <SummaryCard
          title="Completed today"
          value={completedToday.length}
          tone="success"
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <SummaryCard
          title="Snoozed"
          value={snoozedTasks.length}
          tone="warning"
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      <Card padding="md">
        <CardHeader>
          <CardTitle>Overdue tasks requiring attention</CardTitle>
        </CardHeader>
        <CardContent>
          {authLoading || isLoading ? (
            <div className="py-8 text-sm text-slate-500">Loading tasks...</div>
          ) : overdueTasks.length === 0 ? (
            <div className="py-8 text-sm text-slate-500">
              No overdue tasks right now.
            </div>
          ) : (
            <div className="space-y-4">
              {overdueTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border border-red-200 bg-red-50/40 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <button
                        onClick={() => router.push(`/app/tasks/${task.id}`)}
                        className="text-left"
                      >
                        <h3 className="font-semibold text-slate-900 hover:text-primary-700">
                          {task.title}
                        </h3>
                      </button>

                      {task.description ? (
                        <p className="text-sm text-slate-600">
                          {task.description}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap gap-2">
                        {task.resident_name ? (
                          <Chip size="sm">{task.resident_name}</Chip>
                        ) : null}
                        <Chip size="sm" variant="danger">
                          {task.priority || "normal"}
                        </Chip>
                        {task.due_at ? (
                          <Chip size="sm" variant="warning">
                            Due {new Date(task.due_at).toLocaleString()}
                          </Chip>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => escalateTask(task)}
                      >
                        Escalate
                      </Button>
                      <Button onClick={() => markDone(task)}>Mark done</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card padding="md">
        <CardHeader>
          <CardTitle>Snoozed tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {snoozedTasks.length === 0 ? (
            <div className="py-6 text-sm text-slate-500">No snoozed tasks.</div>
          ) : (
            <div className="space-y-3">
              {snoozedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                >
                  <div>
                    <button
                      onClick={() => router.push(`/app/tasks/${task.id}`)}
                      className="font-medium text-slate-900 hover:text-primary-700"
                    >
                      {task.title}
                    </button>
                    <p className="text-sm text-slate-500">
                      {task.resident_name || "No resident"} · Snoozed until{" "}
                      {task.snoozed_until
                        ? new Date(task.snoozed_until).toLocaleString()
                        : "not set"}
                    </p>
                  </div>
                  <Chip size="sm" variant="warning">
                    snoozed
                  </Chip>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  tone = "default",
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  tone?: "default" | "danger" | "warning" | "success";
}) {
  const toneClasses =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-700";

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
