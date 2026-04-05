import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/layout/bottom-nav'
import { AuthProvider } from '@/components/providers/auth-provider'
import { SyncProvider } from '@/components/providers/sync-provider'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <AuthProvider>
      <SyncProvider>
        <div className="min-h-screen bg-surface-50 pb-16">
          {children}
          <BottomNav />
        </div>
      </SyncProvider>
    </AuthProvider>
  )
}
