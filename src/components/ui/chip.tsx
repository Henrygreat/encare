'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const chipVariants = cva(
  'inline-flex items-center gap-1 font-medium rounded-full',
  {
    variants: {
      variant: {
        default: 'bg-surface-100 text-gray-700',
        primary: 'bg-primary-100 text-primary-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-red-100 text-red-700',
        info: 'bg-blue-100 text-blue-700',
        purple: 'bg-purple-100 text-purple-700',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {
  icon?: React.ReactNode
}

export function Chip({ className, variant, size, icon, children, ...props }: ChipProps) {
  return (
    <span className={cn(chipVariants({ variant, size, className }))} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
}

// Specific status chips for common use cases
export function StatusChip({ status }: { status: 'overdue' | 'due' | 'completed' | 'incident' | 'alert' }) {
  const config = {
    overdue: { variant: 'danger' as const, label: 'Overdue' },
    due: { variant: 'warning' as const, label: 'Due' },
    completed: { variant: 'success' as const, label: 'Done' },
    incident: { variant: 'danger' as const, label: 'Incident' },
    alert: { variant: 'warning' as const, label: 'Alert' },
  }
  const { variant, label } = config[status]
  return <Chip variant={variant} size="sm">{label}</Chip>
}
