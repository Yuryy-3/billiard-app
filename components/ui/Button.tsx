import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-green-600 hover:bg-green-700 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  }
  return (
    <button
      className={cn(
        'rounded-lg px-4 py-3 font-semibold transition disabled:opacity-50 cursor-pointer',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
