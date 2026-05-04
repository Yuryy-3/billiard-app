'use client'
import { useBracketRealtime } from './useBracketRealtime'
import type { MatchWithPlayers } from './MatchCard'
import { SingleEliminationView } from './SingleEliminationView'
import { DoubleEliminationView } from './DoubleEliminationView'
import { RoundRobinView } from './RoundRobinView'
import { GroupsPlayoffView } from './GroupsPlayoffView'

type GridFormat = 'single_elimination' | 'double_elimination' | 'round_robin' | 'groups_playoff'

export function BracketView({
  tournamentId,
  initialMatches,
  gridFormat,
}: {
  tournamentId: string
  initialMatches: MatchWithPlayers[]
  gridFormat: GridFormat
}) {
  const matches = useBracketRealtime(tournamentId, initialMatches)

  switch (gridFormat) {
    case 'single_elimination':
      return <SingleEliminationView matches={matches} />
    case 'double_elimination':
      return <DoubleEliminationView matches={matches} />
    case 'round_robin':
      return <RoundRobinView matches={matches} />
    case 'groups_playoff':
      return <GroupsPlayoffView matches={matches} />
  }
}
