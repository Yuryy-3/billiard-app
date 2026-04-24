import { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-gray-400">{label}</label>}
      <input
        className={cn(
          'border border-slate-600 bg-slate-800 text-white rounded-lg px-4 py-3',
          'focus:outline-none focus:border-green-500',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}
