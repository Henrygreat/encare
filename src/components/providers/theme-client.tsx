"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import type { Json } from "@/lib/database.types";

function asObject(value: Json | null | undefined): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

export default function ThemeClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, organisation } = useAuth();

  // =========================
  // APPLY THEME (light/dark/system)
  // =========================
  useEffect(() => {
    if (!user) return;

    const prefs = asObject(user.preferences);
    const appearance = asObject(prefs.appearance);

    const theme = appearance.theme || "system";

    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.add("light");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      root.classList.add(prefersDark ? "dark" : "light");
    }
  }, [user?.preferences]);

  // =========================
  // APPLY BRAND COLOR
  // =========================
  useEffect(() => {
    if (!organisation) return;

    const settings = asObject(organisation.settings);
    const branding = asObject(settings.branding);

    const accentColor = branding.accentColor || "#0284c7";

    document.documentElement.style.setProperty("--brand-color", accentColor);
  }, [organisation?.settings]);

  return <>{children}</>;
}
