import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  UserCog,
  FileBarChart,
  Settings,
  Bell,
  LogOut,
  ClipboardList,
  ScrollText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import ThemeClient from "@/components/theme-client";
import type { Json, UserRole } from "@/lib/database.types";
import type { ReactNode, CSSProperties } from "react";

type NavItem = {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  roles?: UserRole[];
};

const navItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Today" },
  { href: "/dashboard/residents", icon: Users, label: "Residents" },
  { href: "/dashboard/staff", icon: UserCog, label: "Staff" },
  {
    href: "/dashboard/tasks",
    icon: ClipboardList,
    label: "Tasks",
    roles: ["admin", "manager"],
  },
  {
    href: "/dashboard/policies",
    icon: ScrollText,
    label: "Policies",
    roles: ["admin", "manager"],
  },
  { href: "/dashboard/reports", icon: FileBarChart, label: "Reports" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

function getInitials(name: string | null | undefined) {
  if (!name) return "EC";
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function asObject(value: Json | null | undefined): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function normaliseHexColor(value: unknown, fallback = "#0284c7") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();

  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;

  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    return (
      "#" +
      trimmed[1] +
      trimmed[1] +
      trimmed[2] +
      trimmed[2] +
      trimmed[3] +
      trimmed[3]
    );
  }

  return fallback;
}

function hexToRgba(hex: string, alpha: number) {
  const safeHex = normaliseHexColor(hex).replace("#", "");
  const r = Number.parseInt(safeHex.slice(0, 2), 16);
  const g = Number.parseInt(safeHex.slice(2, 4), 16);
  const b = Number.parseInt(safeHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email, organisation_id, role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: organisation } = profile?.organisation_id
    ? await supabase
        .from("organisations")
        .select("name, settings")
        .eq("id", profile.organisation_id)
        .maybeSingle()
    : { data: null };

  const role = profile?.role as UserRole | undefined;
  const visibleNavItems = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  );

  const organisationSettings = asObject(organisation?.settings);
  const brandingSettings = asObject(organisationSettings.branding);

  const workspaceLabel =
    typeof brandingSettings.workspaceLabel === "string"
      ? brandingSettings.workspaceLabel
      : undefined;

  const accentColor = normaliseHexColor(brandingSettings.accentColor);

  const brandSoftBg = hexToRgba(accentColor, 0.12);
  const brandSoftBorder = hexToRgba(accentColor, 0.2);

  const displayName = profile?.full_name || "EnCare Manager";
  const displayEmail = profile?.email || user.email || "No email available";
  const organisationName =
    workspaceLabel || organisation?.name || "EnCare Workspace";
  const initials = getInitials(displayName);

  return (
    <ThemeClient>
      <div
        className="flex min-h-screen bg-surface-50"
        style={
          {
            ["--brand-color" as string]: accentColor,
          } as CSSProperties
        }
      >
        <aside className="hidden border-r border-surface-200 bg-white md:flex md:w-64 md:flex-col">
          <div className="flex h-16 items-center border-b border-surface-200 px-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: accentColor }}
              >
                <span className="text-lg font-bold text-white">E</span>
              </div>
              <div>
                <span className="block text-xl font-bold text-gray-900">
                  EnCare
                </span>
                <span className="block text-xs text-slate-500">
                  {organisationName}
                </span>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                accentColor={accentColor}
                brandSoftBg={brandSoftBg}
                brandSoftBorder={brandSoftBorder}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-surface-200 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: brandSoftBg }}
              >
                <span className="font-semibold" style={{ color: accentColor }}>
                  {initials}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {displayName}
                </p>
                <p className="truncate text-xs text-gray-500">{displayEmail}</p>
              </div>
            </div>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-button px-3 py-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
                style={
                  {
                    backgroundColor: "transparent",
                  } as CSSProperties
                }
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-surface-200 bg-white px-6">
            <div className="flex items-center gap-4 md:hidden">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: accentColor }}
                >
                  <span className="font-bold text-white">E</span>
                </div>
              </Link>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              <button className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-surface-50 hover:text-gray-700">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-care-red" />
              </button>
              <div
                className="hidden h-10 w-10 items-center justify-center rounded-full md:flex"
                style={{ backgroundColor: brandSoftBg }}
              >
                <span className="font-semibold" style={{ color: accentColor }}>
                  {initials}
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface-200 bg-white safe-area-inset-bottom md:hidden">
          <div className="flex h-16 items-center justify-around">
            {visibleNavItems.slice(0, 5).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-full flex-1 flex-col items-center justify-center py-2 text-gray-500 transition-colors hover:text-gray-900"
              >
                <item.icon className="h-5 w-5" />
                <span className="mt-1 text-xs">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </ThemeClient>
  );
}

function NavLink({
  href,
  icon: Icon,
  children,
  accentColor,
  brandSoftBg,
  brandSoftBorder,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  children: ReactNode;
  accentColor: string;
  brandSoftBg: string;
  brandSoftBorder: string;
}) {
  const isActive = false;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-button border px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "text-gray-900"
          : "border-transparent text-gray-600 hover:text-gray-900",
      )}
      style={
        {
          backgroundColor: isActive ? brandSoftBg : "transparent",
          borderColor: isActive ? brandSoftBorder : "transparent",
          color: isActive ? accentColor : undefined,
        } as CSSProperties
      }
    >
      <Icon className="h-5 w-5" />
      {children}
    </Link>
  );
}
