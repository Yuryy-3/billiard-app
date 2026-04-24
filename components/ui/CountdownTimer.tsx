'use client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function CountdownTimer({
  totalSeconds,
  className,
}: {
  totalSeconds: number
  className?: string
}) {
  const [remaining, setRemaining] = useState(totalSeconds)

  useEffect(() => {
    if (remaining <= 0) return
    const id = setInterval(() => setRemaining(s => s - 1), 1000)
    return () => clearInterval(id)
  }, [remaining])

  return (
    <span
      className={cn(
        'font-mono font-bold tabular-nums',
        remaining < 60 ? 'text-accent-red' : 'text-text-primary',
        className
      )}
    >
      {formatTime(remaining)}
    </span>
  )
}
