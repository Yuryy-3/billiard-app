'use client'
import { MatchCard, type MatchWithPlayers } from './MatchCard'

const LABELS_FROM_END: Record<number, string> = {
  1: 'Финал',
  2: 'Полуфинал',
  3: '1/4 финала',
  4: '1/8 финала',
  5: '1/16 финала',
}

const CARD_H = 76
const COL_W  = 192
const CONN_W = 44
const MIN_GAP = 20

function Connector({ lCount, rCount, h }: { lCount: number; rCount: number; h: number }) {
  const mid = CONN_W / 2
  return (
    <svg width={CONN_W} height={h} className="flex-shrink-0">
      {Array.from({ length: rCount }, (_, j) => {
        const y1 = (2 * (2 * j) + 1) * h / (2 * lCount)
        const y2 = (2 * (2 * j + 1) + 1) * h / (2 * lCount)
        const ym = (y1 + y2) / 2
        return (
          <g key={j}>
            <line x1={0}   y1={y1} x2={mid}    y2={y1} stroke="#475569" strokeWidth={1.5} />
            <line x1={0}   y1={y2} x2={mid}    y2={y2} stroke="#475569" strokeWidth={1.5} />
            <line x1={mid} y1={y1} x2={mid}    y2={y2} stroke="#475569" strokeWidth={1.5} />
            <line x1={mid} y1={ym} x2={CONN_W} y2={ym} stroke="#475569" strokeWidth={1.5} />
          </g>
        )
      })}
    </svg>
  )
}

export function SingleEliminationView({ matches }: { matches: MatchWithPlayers[] }) {
  const main   = matches.filter(m => m.bracket === 'main')
  const rounds = [...new Set(main.map(m => m.round))].sort((a, b) => a - b)
  const total  = rounds.length

  if (!total) {
    return <p className="text-gray-400 text-center py-8">Сетка пока не сформирована</p>
  }

  const r1n    = main.filter(m => m.round === rounds[0]).length
  const totalH = r1n * (CARD_H + MIN_GAP)

  const lastRound   = rounds[total - 1]
  const finalMatch  = main.find(m => m.round === lastRound && m.position === 0)
  const champion    = finalMatch?.winner_id
    ? (finalMatch.winner_id === finalMatch.player1_id ? finalMatch.player1 : finalMatch.player2)
    : null

  return (
    <div className="overflow-x-auto pb-4">
      {/* Round labels */}
      <div className="flex mb-3">
        {rounds.map((round, ri) => (
          <div key={round} className="flex flex-shrink-0">
            <div style={{ width: COL_W }} className="text-center text-sm font-semibold text-gray-400">
              {LABELS_FROM_END[total - ri] ?? `Раунд ${round}`}
            </div>
            {ri < total - 1 && <div style={{ width: CONN_W }} />}
          </div>
        ))}
      </div>

      {/* Bracket columns with connectors */}
      <div className="flex">
        {rounds.map((round, ri) => {
          const roundM  = main.filter(m => m.round === round).sort((a, b) => a.position - b.position)
          const nextRound = rounds[ri + 1]
          const nextN   = nextRound ? main.filter(m => m.round === nextRound).length : 0

          return (
            <div key={round} className="flex flex-shrink-0">
              <div className="relative flex-shrink-0" style={{ width: COL_W, height: totalH }}>
                {roundM.map((match, pi) => {
                  const cy  = (2 * pi + 1) * totalH / (2 * roundM.length)
                  const top = Math.round(cy - CARD_H / 2)
                  return (
                    <div key={match.id} className="absolute left-0 right-0" style={{ top }}>
                      <MatchCard match={match} />
                    </div>
                  )
                })}
              </div>
              {nextN > 0 && <Connector lCount={roundM.length} rCount={nextN} h={totalH} />}
            </div>
          )
        })}
      </div>
    </div>

    {champion && (
      <div className="mt-6 inline-flex items-center gap-3 bg-yellow-900/30 border border-yellow-600/50 rounded-xl px-5 py-3">
        <span className="text-2xl">🏆</span>
        <div>
          <p className="text-xs text-yellow-500 uppercase tracking-wide font-semibold">Победитель турнира</p>
          <p className="text-lg font-bold text-yellow-300">{champion.name}</p>
        </div>
      </div>
    )}
  </div>
  )
}
