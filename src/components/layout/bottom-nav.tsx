'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, ClipboardList, MessageSquare, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/app', icon: Home, label: 'Shift' },
  { href: '/app/residents', icon: Users, label: 'Residents' },
  { href: '/app/tasks', icon: ClipboardList, label: 'Tasks' },
  { href: '/app/handover', icon: MessageSquare, label: 'Handover' },
  { href: '/app/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-200 safe-area-inset-bottom z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href ||
            (href !== '/app' && pathname.startsWith(href))

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors',
                isActive
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className={cn('h-6 w-6', isActive && 'stroke-[2.5px]')} />
              <span className={cn(
                'text-xs mt-1',
                isActive && 'font-medium'
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
