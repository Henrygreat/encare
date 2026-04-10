import { BottomNav } from "@/components/layout/bottom-nav";
import { AuthProvider } from "@/components/providers/auth-provider";
import { SyncProvider } from "@/components/providers/sync-provider";
import { InactivityProvider } from "@/components/providers/inactivity-provider";
import ThemeClient from "@/components/theme-client";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SyncProvider>
        <InactivityProvider>
          <ThemeClient>
            <div className="min-h-screen bg-surface-50 pb-16">
              {children}
              <BottomNav />
            </div>
          </ThemeClient>
        </InactivityProvider>
      </SyncProvider>
    </AuthProvider>
  );
}
