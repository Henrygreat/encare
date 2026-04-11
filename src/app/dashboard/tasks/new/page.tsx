"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList, Calendar, Flag, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useAuth, useRequireManager } from "@/lib/hooks/use-auth";
import type {
  TaskInsert,
  TaskPriority,
  Resident,
  User as UserType,
  Json,
} from "@/lib/database.types";

type FormErrors = {
  title?: string;
  due_at?: string;
  general?: string;
};

type TaskTypeOption = {
  value: string;
  label: string;
};

const PRIORITY_OPTIONS: {
  value: TaskPriority;
  label: string;
  color: string;
}[] = [
  {
    value: "low",
    label: "Low",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    value: "medium",
    label: "Medium",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    value: "high",
    label: "High",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    value: "urgent",
    label: "Urgent",
    color: "bg-red-50 text-red-700 border-red-200",
  },
];

const TASK_TYPES: TaskTypeOption[] = [
  { value: "", label: "General task" },
  { value: "medication", label: "Medication" },
  { value: "personal_care", label: "Personal care" },
  { value: "meal", label: "Meal assistance" },
  { value: "mobility", label: "Mobility support" },
  { value: "observation", label: "Observation" },
  { value: "appointment", label: "Appointment" },
  { value: "administrative", label: "Administrative" },
];

function asObject(value: Json | null | undefined): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function getDefaultPriorityFromOrganisation(
  settings: Json | null | undefined,
): TaskPriority {
  const settingsObj = asObject(settings);
  const app =
    settingsObj.app && typeof settingsObj.app === "object"
      ? settingsObj.app
      : {};
  const priority = app.defaultTaskPriority;

  if (
    priority === "low" ||
    priority === "medium" ||
    priority === "high" ||
    priority === "urgent"
  ) {
    return priority;
  }

  return "medium";
}

function normalizeTaskType(value: string): string | null {
  if (!value) return null;

  const aliases: Record<string, string> = {
    admin: "administrative",
    Administrative: "administrative",
    "personal care": "personal_care",
    personalcare: "personal_care",
    "meal assistance": "meal",
    meals: "meal",
    observations: "observation",
    mobility_support: "mobility",
  };

  const normalized = aliases[value] ?? value;

  const allowed = new Set([
    "medication",
    "personal_care",
    "meal",
    "mobility",
    "observation",
    "appointment",
    "administrative",
  ]);

  return allowed.has(normalized) ? normalized : null;
}

export default function NewTaskPage() {
  const router = useRouter();
  const { organisation, user, isLoading: authLoading } = useAuth();
  const { isManager, isLoading: managerLoading } = useRequireManager();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");

  const [residents, setResidents] = useState<Resident[]>([]);
  const [staff, setStaff] = useState<UserType[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [residentId, setResidentId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("09:00");
  const [hasAppliedOrgDefaultPriority, setHasAppliedOrgDefaultPriority] =
    useState(false);

  useEffect(() => {
    async function loadData() {
      if (!organisation?.id) return;

      setLoadingData(true);
      try {
        const supabase = createClient();

        const [residentsResult, staffResult] = await Promise.all([
          supabase
            .from("residents")
            .select("id, first_name, last_name, preferred_name, room_number")
            .eq("organisation_id", organisation.id)
            .eq("status", "active")
            .order("first_name"),
          supabase
            .from("users")
            .select("id, full_name, role")
            .eq("organisation_id", organisation.id)
            .eq("is_active", true)
            .order("full_name"),
        ]);

        if (residentsResult.data) {
          setResidents(residentsResult.data as Resident[]);
        }
        if (staffResult.data) {
          setStaff(staffResult.data as UserType[]);
        }
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
      } finally {
        setLoadingData(false);
      }
    }

    if (!authLoading && organisation?.id) {
      void loadData();
    }
  }, [authLoading, organisation?.id]);

  useEffect(() => {
    if (!dueDate) {
      const today = new Date().toISOString().split("T")[0];
      setDueDate(today);
    }
  }, [dueDate]);

  useEffect(() => {
    if (!organisation?.settings || hasAppliedOrgDefaultPriority) return;

    const orgDefaultPriority = getDefaultPriorityFromOrganisation(
      organisation.settings,
    );

    setPriority(orgDefaultPriority);
    setHasAppliedOrgDefaultPriority(true);
  }, [organisation?.settings, hasAppliedOrgDefaultPriority]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = "Task title is required";
    } else if (title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (!dueDate) {
      newErrors.due_at = "Due date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!organisation?.id || !user?.id) {
      setErrors({ general: "Session expired. Please refresh the page." });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage("");

    try {
      const supabase = createClient();
      const dueAt = new Date(`${dueDate}T${dueTime}:00`).toISOString();
      const normalizedTaskType = normalizeTaskType(taskType);

      const taskData: TaskInsert = {
        organisation_id: organisation.id,
        created_by: user.id,
        title: title.trim(),
        description: description.trim() || null,
        task_type: normalizedTaskType,
        priority,
        status: "pending",
        resident_id: residentId || null,
        assigned_to: assignedTo || null,
        due_at: dueAt,
        metadata: {},
      };

      const { error } = await supabase.from("tasks").insert(taskData);

      if (error) throw error;

      setSuccessMessage("Task created successfully.");

      setTimeout(() => {
        router.push("/dashboard/tasks");
      }, 1500);
    } catch (err) {
      console.error("Failed to create task:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Unable to create task. Please try again.";

      setErrors({
        general: message.includes("tasks_task_type_check")
          ? "This task type is not accepted by the database yet. Please choose another type or update the task_type constraint."
          : message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || managerLoading) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <p className="text-slate-500">
          You do not have permission to create tasks.
        </p>
        <Link href="/dashboard/tasks">
          <Button variant="secondary" className="mt-4">
            Back to Tasks
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create new task</h1>
          <p className="text-sm text-slate-600">
            Assign a task to your team or a specific resident.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {errors.general && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary-600" />
              Task details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Task title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              placeholder="What needs to be done?"
              disabled={isSubmitting}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details or instructions..."
                rows={3}
                disabled={isSubmitting}
                className="flex w-full rounded-[14px] border border-slate-200/80 bg-white/92 px-4 py-3 text-base text-slate-900 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-surface-50 disabled:opacity-50 transition-all duration-200"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Task type
              </label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                disabled={isSubmitting}
                className="flex h-12 w-full rounded-[14px] border border-slate-200/80 bg-white/92 px-4 text-base text-slate-900 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-surface-50 disabled:opacity-50 transition-all duration-200"
              >
                {TASK_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary-600" />
              Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  disabled={isSubmitting}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${option.color} ${
                    priority === option.value
                      ? "ring-2 ring-primary-400 ring-offset-2"
                      : "hover:ring-1 hover:ring-slate-300"
                  } ${isSubmitting ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Resident (optional)
              </label>
              <select
                value={residentId}
                onChange={(e) => setResidentId(e.target.value)}
                disabled={isSubmitting || loadingData}
                className="flex h-12 w-full rounded-[14px] border border-slate-200/80 bg-white/92 px-4 text-base text-slate-900 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-surface-50 disabled:opacity-50 transition-all duration-200"
              >
                <option value="">No specific resident</option>
                {residents.map((resident) => (
                  <option key={resident.id} value={resident.id}>
                    {resident.preferred_name || resident.first_name}{" "}
                    {resident.last_name}
                    {resident.room_number
                      ? ` (Room ${resident.room_number})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Assign to (optional)
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                disabled={isSubmitting || loadingData}
                className="flex h-12 w-full rounded-[14px] border border-slate-200/80 bg-white/92 px-4 text-base text-slate-900 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-surface-50 disabled:opacity-50 transition-all duration-200"
              >
                <option value="">Unassigned</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              Due date & time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Due date *"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                error={errors.due_at}
                disabled={isSubmitting}
              />
              <Input
                label="Due time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/tasks">
            <Button type="button" variant="secondary" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? "Creating task..." : "Create task"}
          </Button>
        </div>
      </form>
    </div>
  );
}
