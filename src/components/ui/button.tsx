'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985]',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white shadow-[0_12px_30px_rgba(2,132,199,0.24)] hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-[0_16px_36px_rgba(2,132,199,0.28)]',
        secondary: 'border border-white/70 bg-white/90 text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur hover:-translate-y-0.5 hover:bg-white',
        ghost: 'text-slate-600 hover:bg-white/80 hover:text-slate-900',
        danger: 'bg-care-red text-white shadow-[0_10px_28px_rgba(239,68,68,0.24)] hover:-translate-y-0.5 hover:bg-red-600',
        success: 'bg-care-green text-white shadow-[0_10px_28px_rgba(16,185,129,0.24)] hover:-translate-y-0.5 hover:bg-emerald-600',
        outline: 'border border-primary-200 bg-primary-50/80 text-primary-700 hover:border-primary-300 hover:bg-primary-100/80',
      },
      size: {
        sm: 'h-9 px-3 text-sm rounded-button',
        md: 'h-11 px-4 text-base rounded-button',
        lg: 'h-14 px-6 text-lg rounded-button',
        tap: 'min-h-tap px-6 text-tap rounded-button',
        icon: 'h-10 w-10 rounded-full',
        'icon-lg': 'h-14 w-14 rounded-full',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
