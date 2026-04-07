"use client";

import {
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  User,
} from "lucide-react";
import { cn, formatTime, formatRelativeTime } from "@/lib/utils";
import type { Task, TaskPriority, TaskStatus } from "@/lib/database.types";
import { Chip } from "./chip";
import { Button } from "./button";

interface TaskCardProps {
  task: Task & {
    resident_name?: string;
    assigned_to_name?: string;
  };
  onComplete?: () => void;
  onSnooze?: () => void;
  onEscalate?: () => void;
  onClick?: () => void;
  showResident?: boolean;
}

const priorityConfig: Record<
  TaskPriority,
  { color: "default" | "info" | "warning" | "danger"; label: string }
> = {
  low: { color: "default", label: "Low" },
  medium: { color: "info", label: "Medium" },
  high: { color: "warning", label: "High" },
  urgent: { color: "danger", label: "Urgent" },
};

const statusConfig: Record<
  TaskStatus,
  {
    color: "default" | "success" | "warning" | "danger" | "info" | "purple";
    label: string;
  }
> = {
  pending: { color: "default", label: "Pending" },
  in_progress: { color: "info", label: "In Progress" },
  completed: { color: "success", label: "Completed" },
  snoozed: { color: "warning", label: "Snoozed" },
  escalated: { color: "danger", label: "Escalated" },
  cancelled: { color: "default", label: "Cancelled" },
};

export function TaskCard({
  task,
  onComplete,
  onSnooze,
  onEscalate,
  onClick,
  showResident = true,
}: TaskCardProps) {
  const safePriority: TaskPriority =
    task.priority && priorityConfig[task.priority] ? task.priority : "medium";

  const safeStatus: TaskStatus =
    task.status && statusConfig[task.status] ? task.status : "pending";

  const isOverdue =
    !!task.due_at &&
    new Date(task.due_at) < new Date() &&
    safeStatus === "pending";

  const priorityInfo = priorityConfig[safePriority];
  const statusInfo = statusConfig[safeStatus];

  return (
    <div
      className={cn(
        "rounded-card border bg-white p-4 transition-all",
        isOverdue ? "border-care-red bg-red-50/50" : "border-surface-200",
        onClick && "cursor-pointer hover:shadow-card active:scale-[0.99]",
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            {isOverdue && (
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-care-red" />
            )}
            <h4 className="truncate font-medium text-gray-900">{task.title}</h4>
          </div>

          {task.description && (
            <p className="mb-2 line-clamp-2 text-sm text-gray-600">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {showResident && task.resident_name && (
              <Chip variant="primary" size="sm">
                <User className="h-3 w-3" />
                {task.resident_name}
              </Chip>
            )}

            <Chip variant={priorityInfo.color} size="sm">
              {priorityInfo.label}
            </Chip>

            {safeStatus !== "pending" && (
              <Chip variant={statusInfo.color} size="sm">
                {statusInfo.label}
              </Chip>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div
            className={cn(
              "flex items-center gap-1 text-sm",
              isOverdue ? "font-medium text-care-red" : "text-gray-500",
            )}
          >
            <Clock className="h-4 w-4" />
            <span>
              {task.due_at
                ? isOverdue
                  ? formatRelativeTime(task.due_at)
                  : formatTime(task.due_at)
                : "No due time"}
            </span>
          </div>

          {onClick && <ChevronRight className="h-5 w-5 text-gray-400" />}
        </div>
      </div>

      {(onComplete || onSnooze || onEscalate) && safeStatus === "pending" && (
        <div className="mt-3 flex gap-2 border-t border-surface-100 pt-3">
          {onComplete && (
            <Button
              variant="success"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              className="flex-1"
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Complete
            </Button>
          )}

          {onSnooze && (
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSnooze();
              }}
            >
              Snooze
            </Button>
          )}

          {isOverdue && onEscalate && (
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEscalate();
              }}
            >
              Escalate
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface TaskListProps {
  tasks: Array<Task & { resident_name?: string; assigned_to_name?: string }>;
  onTaskClick?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onSnooze?: (task: Task) => void;
  onEscalate?: (task: Task) => void;
  showResident?: boolean;
  emptyMessage?: string;
}

export function TaskList({
  tasks,
  onTaskClick,
  onComplete,
  onSnooze,
  onEscalate,
  showResident = true,
  emptyMessage = "No tasks",
}: TaskListProps) {
  if (tasks.length === 0) {
    return <div className="py-8 text-center text-gray-500">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onClick={onTaskClick ? () => onTaskClick(task) : undefined}
          onComplete={onComplete ? () => onComplete(task) : undefined}
          onSnooze={onSnooze ? () => onSnooze(task) : undefined}
          onEscalate={onEscalate ? () => onEscalate(task) : undefined}
          showResident={showResident}
        />
      ))}
    </div>
  );
}
