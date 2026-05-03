import type { BracketMatch } from './single'

/**
 * Generates a round-robin schedule using the Berger circle algorithm.
 * Each pair of players meets exactly once.
 * Throws if fewer than 3 players are provided.
 */
export function generateRoundRobin(
  tournamentId: string,
  playerIds: string[]
): BracketMatch[] {
  if (playerIds.length < 3) {
    throw new Error(`Round robin requires at least 3 players. Got ${playerIds.length}`)
  }

  // Work on a copy; add a bye player if N is odd
  const players = [...playerIds]
  if (players.length % 2 !== 0) {
    players.push('__bye__')
  }

  const N = players.length
  const rounds = N - 1
  const matchesPerRound = N / 2

  // Berger circle: fix players[0], rotate the rest
  const circle = players.slice(1) // N-1 elements that will rotate

  const matches: BracketMatch[] = []

  for (let round = 0; round < rounds; round++) {
    // Build the current round pairing
    // players[0] is fixed; circle[0..N-2] rotates each round
    const roundPlayers = [players[0], ...circle]

    let position = 0
    for (let i = 0; i < matchesPerRound; i++) {
      const p1 = roundPlayers[i]
      const p2 = roundPlayers[N - 1 - i]

      // Skip bye matches
      if (p1 === '__bye__' || p2 === '__bye__') {
        continue
      }

      matches.push({
        tournament_id: tournamentId,
        round: round + 1,
        position,
        player1_id: p1,
        player2_id: p2,
        bracket: 'main',
        group_id: -1,
      })
      position++
    }

    // Rotate circle one step clockwise:
    // last element moves to front, rest shift right
    const last = circle.pop()!
    circle.unshift(last)
  }

  return matches
}
