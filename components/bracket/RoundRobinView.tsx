'use client'
import { MatchCard, type MatchWithPlayers } from './MatchCard'

type Standing = {
  name: string
  points: number
  wins: number
  losses: number
}

function computeStandings(matches: MatchWithPlayers[]): Standing[] {
  const map = new Map<string, Standing>()

  for (const m of matches) {
    // Инициализация игроков если ещё нет
    const p1name = m.player1?.name ?? m.player1_id ?? '?'
    const p2name = m.player2?.name ?? m.player2_id ?? '?'

    if (m.player1_id && !map.has(m.player1_id)) {
      map.set(m.player1_id, { name: p1name, points: 0, wins: 0, losses: 0 })
    }
    if (m.player2_id && !map.has(m.player2_id)) {
      map.set(m.player2_id, { name: p2name, points: 0, wins: 0, losses: 0 })
    }

    // Начисление очков (победа=2, поражение=0)
    if (m.winner_id) {
      const loserId = m.winner_id === m.player1_id ? m.player2_id : m.player1_id
      const winner = m.winner_id ? map.get(m.winner_id) : null
      const loser = loserId ? map.get(loserId) : null
      if (winner) { winner.points += 2; winner.wins += 1 }
      if (loser) { loser.losses += 1 }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.points - a.points || b.wins - a.wins)
}

export function RoundRobinView({ matches }: { matches: MatchWithPlayers[] }) {
  const mainMatches = matches.filter(m => m.bracket === 'main')
  const standings = computeStandings(mainMatches)
  const rounds = Array.from(new Set(mainMatches.map(m => m.round))).sort((a, b) => a - b)

  return (
    <div className="flex flex-col gap-8">
      {/* Таблица очков */}
      <div>
        <h2 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wide">Таблица</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-gray-400 border-b border-slate-700">
                <th className="text-left py-2 pr-4">#</th>
                <th className="text-left py-2 pr-4">Игрок</th>
                <th className="text-center py-2 px-3">О</th>
                <th className="text-center py-2 px-3">В</th>
                <th className="text-center py-2 px-3">П</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => (
                <tr key={s.name} className="border-b border-slate-800">
                  <td className="py-2 pr-4 text-gray-500">{i + 1}</td>
                  <td className="py-2 pr-4 text-white font-medium">{s.name}</td>
                  <td className="py-2 px-3 text-center text-green-400 font-bold">{s.points}</td>
                  <td className="py-2 px-3 text-center text-gray-300">{s.wins}</td>
                  <td className="py-2 px-3 text-center text-gray-500">{s.losses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Матчи по турам */}
      <div>
        <h2 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wide">Расписание</h2>
        <div className="overflow-x-auto">
          <div className="flex gap-8 min-w-max">
            {rounds.map(round => {
              const roundMatches = mainMatches.filter(m => m.round === round).sort((a, b) => a.position - b.position)
              return (
                <div key={round} className="flex flex-col">
                  <h3 className="text-center text-xs text-gray-400 mb-3">Тур {round}</h3>
                  <div className="flex flex-col gap-3">
                    {roundMatches.map(m => <MatchCard key={m.id} match={m} />)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
