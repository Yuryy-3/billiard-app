import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-full px-5 py-2.5 font-semibold text-sm transition-opacity disabled:opacity-50',
        variant === 'primary' && 'bg-accent-orange text-white',
        variant === 'ghost'   && 'text-text-secondary underline',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
