'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex h-12 w-full rounded-[14px] border border-slate-200/80 bg-white/92 px-4 text-base text-slate-900 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur placeholder:text-slate-400',
              'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500',
              'disabled:cursor-not-allowed disabled:bg-surface-50 disabled:opacity-50',
              'transition-all duration-200',
              icon && 'pl-10',
              error && 'border-care-red focus:ring-care-red',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-care-red">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
