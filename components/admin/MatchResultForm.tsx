'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import { Button } from '@/components/ui/Button'
import { Timer } from '@/components/ui/Timer'

type MatchUpdate = Database['public']['Tables']['matches']['Update']

interface Props {
  matchId: string
  player1Id: string
  player2Id: string
  player1Name: string
  player2Name: string
  timeLimitMin: number
  onComplete: () => void
}

export function MatchResultForm({ matchId, player1Id, player2Id, player1Name, player2Name, timeLimitMin, onComplete }: Props) {
  const [score1, setScore1] = useState(0)
  const [score2, setScore2] = useState(0)
  const [tableNumber, setTableNumber] = useState(1)
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function startMatch() {
    setLoading(true)
    const update: MatchUpdate = { table_number: tableNumber, started_at: new Date().toISOString() }
    const { error } = await supabase.from('matches').update(update as never).eq('id', matchId)
    if (!error) setStarted(true)
    else setError(error.message)
    setLoading(false)
  }

  async function submitResult(winnerId: string) {
    setLoading(true)
    setError(null)
    const result: MatchUpdate = { score1, score2, winner_id: winnerId, finished_at: new Date().toISOString() }
    const { error: updateError } = await supabase.from('matches').update(result as never).eq('id', matchId)

    if (updateError) { setError(updateError.message); setLoading(false); return }

    const { error: advanceError } = await supabase.functions.invoke('advance-winner', {
      body: { match_id: matchId, winner_id: winnerId },
    })
    if (advanceError) { setError(advanceError.message); setLoading(false); return }

    onComplete()
    setLoading(false)
  }

  if (!started) {
    return (
      <div className="bg-slate-800 rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">Стол №</span>
          <select
            value={tableNumber}
            onChange={e => setTableNumber(Number(e.target.value))}
            className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1"
          >
            {Array.from({ length: 32 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-300">
          <span className="font-semibold">{player1Name}</span>
          <span className="text-gray-500 mx-2">vs</span>
          <span className="font-semibold">{player2Name}</span>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <Button onClick={startMatch} disabled={loading} className="w-full">
          {loading ? 'Запускаем...' : 'Начать матч'}
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">Стол {tableNumber}</span>
        <Timer seconds={timeLimitMin * 60} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[
          { name: player1Name, score: score1, setScore: setScore1 },
          { name: player2Name, score: score2, setScore: setScore2 },
        ].map(({ name, score, setScore }) => (
          <div key={name} className="text-center">
            <div className="font-semibold mb-3 truncate">{name}</div>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setScore(s => Math.max(0, s - 1))}
                className="bg-slate-700 hover:bg-slate-600 w-9 h-9 rounded-full text-xl font-bold transition">−</button>
              <span className="text-4xl font-bold w-10 text-center">{score}</span>
              <button onClick={() => setScore(s => s + 1)}
                className="bg-slate-700 hover:bg-slate-600 w-9 h-9 rounded-full text-xl font-bold transition">+</button>
            </div>
          </div>
        ))}
      </div>
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => submitResult(player1Id)} disabled={loading} className="w-full text-sm">
          {loading ? '...' : `Победил ${player1Name}`}
        </Button>
        <Button onClick={() => submitResult(player2Id)} disabled={loading} className="w-full text-sm">
          {loading ? '...' : `Победил ${player2Name}`}
        </Button>
      </div>
    </div>
  )
}
