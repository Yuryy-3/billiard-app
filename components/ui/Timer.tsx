'use client'
import { useEffect, useState } from 'react'

export function Timer({ seconds, onExpire }: { seconds: number; onExpire?: () => void }) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    setRemaining(seconds)
  }, [seconds])

  useEffect(() => {
    if (remaining <= 0) {
      onExpire?.()
      return
    }
    const id = setInterval(() => setRemaining(r => r - 1), 1000)
    return () => clearInterval(id)
  }, [remaining, onExpire])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const isLow = remaining <= 300

  return (
    <span className={`font-mono text-2xl font-bold ${isLow ? 'text-red-400' : 'text-white'}`}>
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  )
}
