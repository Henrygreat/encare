"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  FileX,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import { useDashboard } from "@/lib/hooks/use-dashboard";

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-4">
        <div className="text-center text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const dashboardData = data || {
    overdueTasks: [],
    missingLogs: [],
    incidents: [],
    baselineChanges: [],
    staffActivity: [],
    todayStats: {
      totalLogs: 0,
      tasksCompleted: 0,
      tasksPending: 0,
      residentsLogged: 0,
      totalResidents: 0,
      totalIncidents: 0,
    },
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Today&apos;s Overview
          </h1>
          <p className="text-gray-500">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary">Download Report</Button>
          <Button variant="primary">Broadcast Message</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Logs Today"
          value={dashboardData.todayStats.totalLogs}
          icon={<Activity className="h-5 w-5 text-primary-500" />}
        />
        <StatCard
          label="Tasks Completed"
          value={`${dashboardData.todayStats.tasksCompleted}/${dashboardData.todayStats.tasksCompleted + dashboardData.todayStats.tasksPending}`}
          icon={<CheckCircle className="h-5 w-5 text-care-green" />}
        />
        <StatCard
          label="Residents Logged"
          value={`${dashboardData.todayStats.residentsLogged}/${dashboardData.todayStats.totalResidents}`}
          icon={<Users className="h-5 w-5 text-primary-500" />}
        />
        <StatCard
          label="Incidents"
          value={dashboardData.incidents.length}
          icon={<AlertTriangle className="h-5 w-5 text-care-amber" />}
          variant={dashboardData.incidents.length > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          padding="md"
          className={
            dashboardData.overdueTasks.length > 0 ? "border-care-red" : ""
          }
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-care-red">
              <Clock className="h-5 w-5" />
              Overdue Tasks ({dashboardData.overdueTasks.length})
            </CardTitle>
            <Link
              href="/dashboard/tasks"
              className="text-sm font-medium text-primary-600"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {dashboardData.overdueTasks.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.overdueTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-button bg-red-50 p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-500">
                        {task.resident} &middot; Assigned to {task.assignedTo}
                      </p>
                    </div>
                    <div className="text-right">
                      <Chip variant="danger" size="sm">
                        {formatRelativeTime(task.dueAt)}
                      </Chip>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<CheckCircle />} message="No overdue tasks" />
            )}
          </CardContent>
        </Card>

        <Card
          padding="md"
          className={
            dashboardData.missingLogs.length > 0 ? "border-care-amber" : ""
          }
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-care-amber">
              <FileX className="h-5 w-5" />
              Missing Logs ({dashboardData.missingLogs.length})
            </CardTitle>
            <Link
              href="/dashboard/compliance"
              className="text-sm font-medium text-primary-600"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {dashboardData.missingLogs.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.missingLogs.map((item) => (
                  <div
                    key={item.residentId}
                    className="flex items-center justify-between rounded-button bg-amber-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={item.residentName} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.residentName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.room ? `Room ${item.room}` : "No room"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {item.missingTypes.slice(0, 3).map((type) => (
                        <Chip key={type} variant="warning" size="sm">
                          {type}
                        </Chip>
                      ))}
                      {item.missingTypes.length > 3 && (
                        <Chip variant="warning" size="sm">
                          +{item.missingTypes.length - 3}
                        </Chip>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<CheckCircle />} message="All logs complete" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-care-red" />
              Today&apos;s Incidents
            </CardTitle>
            <Link
              href="/dashboard/incidents"
              className="text-sm font-medium text-primary-600"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {dashboardData.incidents.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.incidents.map((incident) => (
                  <Link
                    key={incident.id}
                    href={`/dashboard/incidents/${incident.id}`}
                    className="flex items-center justify-between rounded-button bg-surface-50 p-3 transition-colors hover:bg-surface-100"
                  >
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {incident.type}
                        </span>
                        <Chip
                          variant={
                            incident.severity === "high"
                              ? "danger"
                              : incident.severity === "medium"
                                ? "warning"
                                : "default"
                          }
                          size="sm"
                        >
                          {incident.severity}
                        </Chip>
                      </div>
                      <p className="text-sm text-gray-500">
                        {incident.resident} &middot;{" "}
                        {formatRelativeTime(incident.reportedAt)}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<CheckCircle />}
                message="No incidents today"
                variant="success"
              />
            )}
          </CardContent>
        </Card>

        <Card padding="md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-500" />
              Baseline Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.baselineChanges.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.baselineChanges.map((item) => (
                  <Link
                    key={item.residentId}
                    href={`/dashboard/residents/${item.residentId}`}
                    className="flex items-center justify-between rounded-button bg-surface-50 p-3 transition-colors hover:bg-surface-100"
                  >
                    <div className="flex items-center gap-3">
                      {item.trend === "up" ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                          <TrendingUp className="h-4 w-4 text-care-green" />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                          <TrendingDown className="h-4 w-4 text-care-red" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.residentName}
                        </p>
                        <p className="text-sm text-gray-500">{item.change}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Activity />}
                message="No significant changes"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-500" />
            Staff Activity
          </CardTitle>
          <Link
            href="/dashboard/staff"
            className="text-sm font-medium text-primary-600"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 text-left text-sm text-gray-500">
                  <th className="pb-3 font-medium">Staff Member</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 text-center font-medium">Logs</th>
                  <th className="pb-3 text-center font-medium">Tasks</th>
                  <th className="pb-3 text-center font-medium">Overdue</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {dashboardData.staffActivity.map((staff) => (
                  <tr key={staff.userId} className="hover:bg-surface-50">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={staff.name} size="sm" />
                        <span className="font-medium text-gray-900">
                          {staff.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600">{staff.role}</td>
                    <td className="py-3 text-center font-medium">
                      {staff.logsToday}
                    </td>
                    <td className="py-3 text-center font-medium text-care-green">
                      {staff.tasksCompleted}
                    </td>
                    <td className="py-3 text-center">
                      {staff.tasksOverdue > 0 ? (
                        <span className="font-medium text-care-red">
                          {staff.tasksOverdue}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="py-3">
                      <Chip variant="success" size="sm">
                        On Shift
                      </Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  variant = "default",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: "default" | "warning" | "danger";
}) {
  return (
    <Card
      padding="md"
      className={
        variant === "warning"
          ? "border-care-amber bg-amber-50"
          : variant === "danger"
            ? "border-care-red bg-red-50"
            : ""
      }
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
          {icon}
        </div>
      </div>
    </Card>
  );
}

function EmptyState({
  icon,
  message,
  variant = "default",
}: {
  icon: React.ReactNode;
  message: string;
  variant?: "default" | "success";
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
      <div
        className={`mb-2 flex h-12 w-12 items-center justify-center rounded-full ${
          variant === "success"
            ? "bg-green-50 text-care-green"
            : "bg-surface-100"
        }`}
      >
        {icon}
      </div>
      <p className={variant === "success" ? "text-care-green" : ""}>
        {message}
      </p>
    </div>
  );
}
