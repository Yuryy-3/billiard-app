import type { BracketMatch } from './single'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Generates round-robin matches for a single group using Berger circle algorithm.
 * Each pair of players meets exactly once.
 */
function generateGroupRoundRobin(
  tournamentId: string,
  playerIds: string[],
  groupId: number
): BracketMatch[] {
  const players = [...playerIds]
  if (players.length % 2 !== 0) {
    players.push('__bye__')
  }

  const N = players.length
  const rounds = N - 1
  const matchesPerRound = N / 2
  const circle = players.slice(1)

  const matches: BracketMatch[] = []

  for (let round = 0; round < rounds; round++) {
    const roundPlayers = [players[0], ...circle]
    let position = 0

    for (let i = 0; i < matchesPerRound; i++) {
      const p1 = roundPlayers[i]
      const p2 = roundPlayers[N - 1 - i]

      if (p1 === '__bye__' || p2 === '__bye__') {
        continue
      }

      matches.push({
        tournament_id: tournamentId,
        round: round + 1,
        position,
        player1_id: p1,
        player2_id: p2,
        bracket: 'group',
        group_id: groupId,
      })
      position++
    }

    const last = circle.pop()!
    circle.unshift(last)
  }

  return matches
}

/**
 * Generates a Groups + Playoff bracket.
 *
 * - Splits players into groups of `groupSize` (must divide evenly).
 * - Each group plays a round-robin.
 * - Top 2 from each group advance to a single-elimination playoff.
 * - Playoff matches are empty (player IDs are null) — seeded later by finalize-group.
 */
export function generateGroupsPlayoff(
  tournamentId: string,
  playerIds: string[],
  groupSize: number
): BracketMatch[] {
  if (playerIds.length % groupSize !== 0) {
    throw new Error(
      `Player count (${playerIds.length}) must be a multiple of groupSize (${groupSize})`
    )
  }

  const shuffled = shuffle(playerIds)
  const numGroups = playerIds.length / groupSize
  const matches: BracketMatch[] = []

  // Generate group round-robin matches
  for (let g = 0; g < numGroups; g++) {
    const groupPlayers = shuffled.slice(g * groupSize, (g + 1) * groupSize)
    const groupMatches = generateGroupRoundRobin(tournamentId, groupPlayers, g)
    matches.push(...groupMatches)
  }

  // Generate playoff single-elimination bracket
  // Top 2 from each group advance → numGroups * 2 playoff teams
  const numPlayoffTeams = numGroups * 2

  // Round up to next power of 2 (for bye slots if needed)
  let bracketSize = 1
  while (bracketSize < numPlayoffTeams) {
    bracketSize *= 2
  }

  const numRounds = Math.log2(bracketSize)

  for (let round = 1; round <= numRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round)
    for (let pos = 0; pos < matchesInRound; pos++) {
      matches.push({
        tournament_id: tournamentId,
        round,
        position: pos,
        player1_id: null,
        player2_id: null,
        bracket: 'playoff',
        group_id: -1,
      })
    }
  }

  return matches
}
