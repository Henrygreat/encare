import { BottomNav } from "@/components/layout/bottom-nav";
import { AuthProvider } from "@/components/providers/auth-provider";
import { SyncProvider } from "@/components/providers/sync-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SyncProvider>
        <div className="min-h-screen bg-surface-50 pb-16">
          {children}
          <BottomNav />
        </div>
      </SyncProvider>
    </AuthProvider>
  );
}
