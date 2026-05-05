const ROUND_LABELS: Record<number, string> = {
  1: '1/8 финала',
  2: '1/4 финала',
  3: 'Полуфинал',
  4: 'Финал',
}

export type MatchWithPlayers = {
  id: string
  round: number
  position: number
  player1_id: string | null
  player2_id: string | null
  score1: number
  score2: number
  winner_id: string | null
  table_number: number | null
  started_at: string | null
  finished_at: string | null
  bracket: string
  group_id: number
  player1: { name: string } | null
  player2: { name: string } | null
}

export { ROUND_LABELS }

export function MatchCard({ match }: { match: MatchWithPlayers }) {
  const p1Won = match.winner_id !== null && match.winner_id === match.player1_id
  const p2Won = match.winner_id !== null && match.winner_id === match.player2_id
  const ongoing = match.started_at !== null && match.finished_at === null

  return (
    <div className={[
      'border rounded-lg w-48 text-sm overflow-hidden',
      ongoing ? 'border-yellow-500' : 'border-slate-600',
    ].join(' ')}>
      <div className={['px-3 py-2 flex justify-between items-center',
        p1Won ? 'bg-green-900/50' : 'bg-slate-800'].join(' ')}>
        <span className={['truncate flex-1', p1Won ? 'font-bold text-green-400' : 'text-gray-300'].join(' ')}>
          {match.player1?.name ?? 'TBD'}
        </span>
        <span className="font-mono text-lg ml-2 shrink-0">{match.started_at ? match.score1 : '—'}</span>
      </div>
      <div className="h-px bg-slate-600" />
      <div className={['px-3 py-2 flex justify-between items-center',
        p2Won ? 'bg-green-900/50' : 'bg-slate-800'].join(' ')}>
        <span className={['truncate flex-1', p2Won ? 'font-bold text-green-400' : 'text-gray-300'].join(' ')}>
          {match.player2?.name ?? 'TBD'}
        </span>
        <span className="font-mono text-lg ml-2 shrink-0">{match.started_at ? match.score2 : '—'}</span>
      </div>
      {match.table_number !== null && (
        <div className="bg-slate-900 px-3 py-1 text-xs text-gray-500 text-center">
          Стол {match.table_number}
        </div>
      )}
    </div>
  )
}
