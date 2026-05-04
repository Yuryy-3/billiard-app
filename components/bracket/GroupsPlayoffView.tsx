'use client'
import { useState } from 'react'
import { MatchCard, type MatchWithPlayers } from './MatchCard'
import { SingleEliminationView } from './SingleEliminationView'

type Standing = { name: string; points: number; wins: number; losses: number }

function computeGroupStandings(matches: MatchWithPlayers[]): Standing[] {
  const map = new Map<string, Standing>()

  for (const m of matches) {
    const p1name = m.player1?.name ?? m.player1_id ?? '?'
    const p2name = m.player2?.name ?? m.player2_id ?? '?'

    if (m.player1_id && !map.has(m.player1_id)) {
      map.set(m.player1_id, { name: p1name, points: 0, wins: 0, losses: 0 })
    }
    if (m.player2_id && !map.has(m.player2_id)) {
      map.set(m.player2_id, { name: p2name, points: 0, wins: 0, losses: 0 })
    }

    if (m.winner_id) {
      const loserId = m.winner_id === m.player1_id ? m.player2_id : m.player1_id
      const winner = map.get(m.winner_id)
      const loser = loserId ? map.get(loserId) : null
      if (winner) { winner.points += 2; winner.wins += 1 }
      if (loser) { loser.losses += 1 }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.points - a.points || b.wins - a.wins)
}

export function GroupsPlayoffView({ matches }: { matches: MatchWithPlayers[] }) {
  const groupMatches = matches.filter(m => m.bracket === 'group')
  const playoffMatches = matches.filter(m => m.bracket === 'playoff')

  // Список уникальных групп
  const groupIds = Array.from(new Set(groupMatches.map(m => m.group_id))).sort((a, b) => a - b)
  const tabs = [...groupIds.map(g => `group-${g}`), 'playoff']
  const [activeTab, setActiveTab] = useState(tabs[0] ?? 'playoff')

  // Названия вкладок: Группа A, Группа B... + Плей-офф
  function tabLabel(tab: string): string {
    if (tab === 'playoff') return 'Плей-офф'
    const g = parseInt(tab.replace('group-', ''))
    return `Группа ${String.fromCharCode(65 + g)}`
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Вкладки */}
      <div className="flex gap-2 border-b border-slate-700 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-4 py-2 text-sm whitespace-nowrap border-b-2 transition-colors',
              activeTab === tab
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white',
            ].join(' ')}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </div>

      {/* Содержимое вкладки */}
      {activeTab === 'playoff' ? (
        <SingleEliminationView
          matches={playoffMatches.map(m => ({ ...m, bracket: 'main' }))}
        />
      ) : (
        (() => {
          const g = parseInt(activeTab.replace('group-', ''))
          const gm = groupMatches.filter(m => m.group_id === g)
          const standings = computeGroupStandings(gm)
          return (
            <div className="flex flex-col gap-6">
              {/* Мини-таблица группы */}
              <table className="w-full text-sm border-collapse max-w-md">
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
                      <td className="py-2 pr-4 text-white">{s.name}</td>
                      <td className="py-2 px-3 text-center text-green-400 font-bold">{s.points}</td>
                      <td className="py-2 px-3 text-center text-gray-300">{s.wins}</td>
                      <td className="py-2 px-3 text-center text-gray-500">{s.losses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Матчи группы */}
              <div className="overflow-x-auto">
                <div className="flex gap-6 min-w-max">
                  {gm.sort((a, b) => a.position - b.position).map(m => <MatchCard key={m.id} match={m} />)}
                </div>
              </div>
            </div>
          )
        })()
      )}
    </div>
  )
}
