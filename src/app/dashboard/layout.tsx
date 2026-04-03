import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  UserCog,
  FileBarChart,
  Settings,
  Bell,
  LogOut
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Today' },
  { href: '/dashboard/residents', icon: Users, label: 'Residents' },
  { href: '/dashboard/staff', icon: UserCog, label: 'Staff' },
  { href: '/dashboard/reports', icon: FileBarChart, label: 'Reports' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // In production, would check if user has manager role
  // const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  // if (!userData || !['admin', 'manager'].includes(userData.role)) {
  //   redirect('/app')
  // }

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-surface-200">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-surface-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-9 w-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-xl font-bold text-gray-900">EnCare</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} icon={item.icon}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Menu */}
        <div className="p-4 border-t border-surface-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-semibold">MJ</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Manager Demo
              </p>
              <p className="text-xs text-gray-500 truncate">
                manager@carehome.com
              </p>
            </div>
          </div>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-surface-50 rounded-button transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4 md:hidden">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">E</span>
              </div>
            </Link>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-surface-50 rounded-full transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-care-red rounded-full" />
            </button>
            <div className="hidden md:block h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-semibold">MJ</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-surface-200 safe-area-inset-bottom z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full py-2 text-gray-500 hover:text-primary-600 transition-colors"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}

function NavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string
  icon: typeof LayoutDashboard
  children: React.ReactNode
}) {
  // In real app, would use usePathname() to check active state
  const isActive = false

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-button text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary-50 text-primary-700'
          : 'text-gray-600 hover:bg-surface-50 hover:text-gray-900'
      )}
    >
      <Icon className="h-5 w-5" />
      {children}
    </Link>
  )
}
