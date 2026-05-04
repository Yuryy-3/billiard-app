'use client'
import { MatchCard, type MatchWithPlayers } from './MatchCard'

export function DoubleEliminationView({ matches }: { matches: MatchWithPlayers[] }) {
  const winners = matches.filter(m => m.bracket === 'winners')
  const losers = matches.filter(m => m.bracket === 'losers')
  const grandFinal = matches.filter(m => m.bracket === 'grand_final')

  const winnerRounds = Array.from(new Set(winners.map(m => m.round))).sort((a, b) => a - b)
  const loserRounds = Array.from(new Set(losers.map(m => m.round))).sort((a, b) => a - b)

  return (
    <div className="overflow-x-auto pb-8">
      {/* Две параллельные колонки: Winners слева, Losers справа */}
      <div className="flex gap-12 min-w-max mb-8">
        {/* Winners bracket */}
        <div>
          <h2 className="text-center text-sm font-bold text-green-400 mb-4 uppercase tracking-wide">Winners</h2>
          <div className="flex gap-8">
            {winnerRounds.map(round => {
              const roundMatches = winners.filter(m => m.round === round).sort((a, b) => a.position - b.position)
              return (
                <div key={round} className="flex flex-col">
                  <h3 className="text-center text-xs text-gray-400 mb-3">Раунд W{round}</h3>
                  <div className="flex flex-col gap-4">
                    {roundMatches.map(m => <MatchCard key={m.id} match={m} />)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Losers bracket */}
        <div>
          <h2 className="text-center text-sm font-bold text-orange-400 mb-4 uppercase tracking-wide">Losers</h2>
          <div className="flex gap-8">
            {loserRounds.map(round => {
              const roundMatches = losers.filter(m => m.round === round).sort((a, b) => a.position - b.position)
              return (
                <div key={round} className="flex flex-col">
                  <h3 className="text-center text-xs text-gray-400 mb-3">Раунд L{round}</h3>
                  <div className="flex flex-col gap-4">
                    {roundMatches.map(m => <MatchCard key={m.id} match={m} />)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Grand Final внизу */}
      {grandFinal.length > 0 && (
        <div className="border-t border-slate-700 pt-6">
          <h2 className="text-center text-sm font-bold text-yellow-400 mb-4 uppercase tracking-wide">Grand Final</h2>
          <div className="flex gap-6 justify-center">
            {grandFinal.sort((a, b) => a.round - b.round).map(m => (
              <div key={m.id}>
                <p className="text-xs text-gray-500 mb-2 text-center">
                  {m.round === 1 ? 'Финал' : 'Bracket Reset'}
                </p>
                <MatchCard match={m} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
