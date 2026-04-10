"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CloudOff,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOfflineStore } from "@/lib/stores/offline-store";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/layout/auth-shell";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="Welcome back"
          description="Sign in to open your live EnCare workspace."
        >
          <div className="flex items-center justify-center py-10 text-sm text-slate-500">
            Loading login...
          </div>
        </AuthShell>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isOnline } = useOfflineStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState("");

  const logoutReason = searchParams.get("reason");

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session check failed:", error);
        }

        if (session?.user && isMounted) {
          router.replace("/app");
          return;
        }
      } catch (err) {
        console.error("Login page session check error:", err);
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const supabase = createClient();

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.replace("/app");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <AuthShell
        title="Welcome back"
        description="Sign in to open your live EnCare workspace."
      >
        <div className="flex items-center justify-center py-10 text-sm text-slate-500">
          Checking session...
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to open your live EnCare workspace."
      footer={
        <div className="space-y-3 text-center text-sm text-slate-600">
          <p>
            Need an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary-700 hover:text-primary-800"
            >
              Request onboarding
            </Link>
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 font-medium text-primary-700 hover:text-primary-800"
          >
            Preview the live product
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      }
    >
      {logoutReason === "inactivity" && (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <Clock className="h-4 w-4" />
          You were logged out due to inactivity.
        </div>
      )}

      {!isOnline && (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <CloudOff className="h-4 w-4" />
          You&apos;re offline. Login needs an internet connection.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={!isOnline || isLoading}
          icon={<Mail className="h-4 w-4" />}
        />

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            disabled={!isOnline || isLoading}
            icon={<LockKeyhole className="h-4 w-4" />}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="font-medium text-primary-700 hover:text-primary-800"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          size="tap"
          isLoading={isLoading}
          disabled={!isOnline || isLoading}
        >
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
