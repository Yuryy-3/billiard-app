'use client'
import { useBracketRealtime } from './useBracketRealtime'
import { MatchCard, ROUND_LABELS, type MatchWithPlayers } from './MatchCard'

export function BracketView({
  tournamentId,
  initialMatches,
}: {
  tournamentId: string
  initialMatches: MatchWithPlayers[]
}) {
  const matches = useBracketRealtime(tournamentId, initialMatches)
  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b)

  return (
    <div className="overflow-x-auto pb-8">
      <div className="flex gap-8 min-w-max">
        {rounds.map(round => {
          const roundMatches = matches
            .filter(m => m.round === round)
            .sort((a, b) => a.position - b.position)
          return (
            <div key={round} className="flex flex-col">
              <h3 className="text-center text-sm font-semibold text-gray-400 mb-4">
                {ROUND_LABELS[round] ?? `Раунд ${round}`}
              </h3>
              <div className="flex flex-col gap-4">
                {roundMatches.map(match => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
