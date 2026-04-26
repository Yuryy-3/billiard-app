'use client'
import { useState } from 'react'
import { MatchResultForm } from './MatchResultForm'
import { ShotClock } from './ShotClock'

export type AdminMatch = {
  id: string
  round: number
  position: number
  player1_id: string | null
  player2_id: string | null
  winner_id: string | null
  started_at: string | null
  player1: { name: string } | null
  player2: { name: string } | null
}

const ROUND_LABELS: Record<number, string> = {
  1: '1/8 финала', 2: '1/4 финала', 3: 'Полуфинал', 4: 'Финал',
}

interface Props {
  matches: AdminMatch[]
  timeLimitMin: number
  shotClockSec: number
  shotClockExtensionSec: number
}

export function MatchList({ matches, timeLimitMin, shotClockSec, shotClockExtensionSec }: Props) {
  const [completedIds, setCompletedIds] = useState<string[]>([])

  const activeMatches = matches.filter(m =>
    m.player1_id !== null && m.player2_id !== null &&
    m.winner_id === null && !completedIds.includes(m.id)
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <h2 className="text-lg font-semibold">Активные матчи ({activeMatches.length})</h2>
        <ShotClock baseSec={shotClockSec} extensionSec={shotClockExtensionSec} />
      </div>
      {activeMatches.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Нет активных матчей</p>
          <p className="text-gray-600 text-sm mt-1">Все матчи раунда завершены</p>
        </div>
      )}
      {activeMatches.map(match => (
        <div key={match.id}>
          <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
            {ROUND_LABELS[match.round] ?? `Раунд ${match.round}`} · Пара {match.position + 1}
          </div>
          <MatchResultForm
            matchId={match.id}
            player1Id={match.player1_id!}
            player2Id={match.player2_id!}
            player1Name={match.player1?.name ?? 'Игрок 1'}
            player2Name={match.player2?.name ?? 'Игрок 2'}
            timeLimitMin={timeLimitMin}
            onComplete={() => setCompletedIds(prev => [...prev, match.id])}
          />
        </div>
      ))}
    </div>
  )
}
