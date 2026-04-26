'use client'
import { useState } from 'react'
import { Timer } from '@/components/ui/Timer'

export function ShotClock({ baseSec, extensionSec }: { baseSec: number; extensionSec: number }) {
  const [seconds, setSeconds] = useState(baseSec)
  const [extended, setExtended] = useState(false)

  function extend() {
    if (!extended) {
      setSeconds(s => s + extensionSec)
      setExtended(true)
    }
  }

  function reset() {
    setSeconds(baseSec)
    setExtended(false)
  }

  return (
    <div className="bg-slate-900 rounded-xl p-4 text-center border border-slate-700">
      <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Шот-клок</div>
      <Timer seconds={seconds} />
      <div className="flex gap-2 mt-3 justify-center">
        <button onClick={extend} disabled={extended}
          className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg px-3 py-2 text-sm disabled:opacity-40 transition">
          +{extensionSec} сек
        </button>
        <button onClick={reset}
          className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-3 py-2 text-sm transition">
          Сброс
        </button>
      </div>
    </div>
  )
}
