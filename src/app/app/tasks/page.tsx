"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { MobileHeader, PageContainer } from "@/components/layout/mobile-header";
import { TaskList } from "@/components/ui/task-card";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import type { Task } from "@/lib/database.types";

type TaskWithResident = Task & {
  resident_name?: string;
};

type TabType = "due" | "completed" | "snoozed";

export default function TasksPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, organisation, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("due");
  const [tasks, setTasks] = useState<TaskWithResident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const loadTasks = async () => {
    if (!organisation?.id) {
      setError("No organisation is linked to this account.");
      setIsLoading(false);
      return;
    }

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
      console.error("Failed to load tasks:", err);
      setError("Unable to load tasks right now.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!organisation?.id) {
      setError("No organisation is linked to this account.");
      setIsLoading(false);
      return;
    }

    void loadTasks();
  }, [authLoading, organisation?.id]);

  const handleComplete = async (task: Task) => {
    if (!user?.id) return;
    setActionLoadingId(task.id);

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
      console.error("Complete task error:", err);
      alert("Unable to complete task.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSnooze = async (task: Task) => {
    setActionLoadingId(task.id);

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
      await loadTasks();
    } catch (err) {
      console.error("Snooze task error:", err);
      alert("Unable to snooze task.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEscalate = async (task: Task) => {
    setActionLoadingId(task.id);

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
      await loadTasks();
    } catch (err) {
      console.error("Escalate task error:", err);
      alert("Unable to escalate task.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const now = new Date();

  const overdueTasks = useMemo(
    () =>
      tasks
        .filter(
          (t) =>
            t.status === "pending" &&
            t.due_at &&
            new Date(t.due_at).getTime() < now.getTime(),
        )
        .sort(
          (a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime(),
        ),
    [tasks],
  );

  const upcomingTasks = useMemo(
    () =>
      tasks
        .filter(
          (t) =>
            t.status === "pending" &&
            t.due_at &&
            new Date(t.due_at).getTime() >= now.getTime(),
        )
        .sort(
          (a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime(),
        ),
    [tasks],
  );

  const completedTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status === "completed")
        .sort(
          (a, b) =>
            new Date(b.completed_at || 0).getTime() -
            new Date(a.completed_at || 0).getTime(),
        ),
    [tasks],
  );

  const snoozedTasks = useMemo(
    () => tasks.filter((t) => t.status === "snoozed"),
    [tasks],
  );

  if (authLoading) {
    return (
      <PageContainer header={<MobileHeader title="Tasks" />}>
        <div className="py-12 text-center text-gray-500">
          Loading account...
        </div>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer header={<MobileHeader title="Tasks" />}>
        <div className="py-12 text-center text-gray-500">Loading tasks...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer header={<MobileHeader title="Tasks" />}>
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <TabButton
          active={activeTab === "due"}
          onClick={() => setActiveTab("due")}
          icon={<Clock className="h-4 w-4" />}
          count={overdueTasks.length + upcomingTasks.length}
          alert={overdueTasks.length > 0}
        >
          Due
        </TabButton>

        <TabButton
          active={activeTab === "completed"}
          onClick={() => setActiveTab("completed")}
          icon={<CheckCircle className="h-4 w-4" />}
          count={completedTasks.length}
        >
          Done
        </TabButton>

        <TabButton
          active={activeTab === "snoozed"}
          onClick={() => setActiveTab("snoozed")}
          icon={<Clock className="h-4 w-4" />}
          count={snoozedTasks.length}
        >
          Snoozed
        </TabButton>
      </div>

      {activeTab === "due" && (
        <div className="space-y-4">
          {overdueTasks.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-care-red" />
                <h3 className="font-semibold text-care-red">
                  Overdue ({overdueTasks.length})
                </h3>
              </div>

              <TaskList
                tasks={overdueTasks}
                onTaskClick={(task) => router.push(`/app/tasks/${task.id}`)}
                onComplete={handleComplete}
                onSnooze={handleSnooze}
                onEscalate={handleEscalate}
              />
            </div>
          )}

          {upcomingTasks.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold text-gray-700">
                Coming Up ({upcomingTasks.length})
              </h3>

              <TaskList
                tasks={upcomingTasks}
                onTaskClick={(task) => router.push(`/app/tasks/${task.id}`)}
                onComplete={handleComplete}
                onSnooze={handleSnooze}
              />
            </div>
          )}

          {overdueTasks.length === 0 && upcomingTasks.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              <CheckCircle className="mx-auto mb-3 h-12 w-12 text-care-green" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm">No pending tasks</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "completed" && (
        <TaskList
          tasks={completedTasks}
          onTaskClick={(task) => router.push(`/app/tasks/${task.id}`)}
          emptyMessage="No completed tasks today"
        />
      )}

      {activeTab === "snoozed" && (
        <TaskList
          tasks={snoozedTasks}
          onTaskClick={(task) => router.push(`/app/tasks/${task.id}`)}
          emptyMessage="No snoozed tasks"
        />
      )}
    </PageContainer>
  );
}

function TabButton({
  children,
  active,
  onClick,
  icon,
  count,
  alert,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  count?: number;
  alert?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors
        ${
          active
            ? alert
              ? "bg-care-red text-white"
              : "bg-primary-600 text-white"
            : "bg-surface-100 text-gray-700 hover:bg-surface-200"
        }
      `}
    >
      {icon}
      {children}
      {count !== undefined && count > 0 && (
        <span
          className={`
            rounded-full px-1.5 py-0.5 text-xs
            ${active ? "bg-white/20" : "bg-surface-200"}
          `}
        >
          {count}
        </span>
      )}
    </button>
  );
}
