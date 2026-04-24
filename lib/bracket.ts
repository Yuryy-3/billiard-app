export type BracketMatch = {
  tournament_id: string
  round: number
  position: number
  player1_id: string | null
  player2_id: string | null
}

export function generateBracketMatches(
  tournamentId: string,
  playerIds: string[]
): BracketMatch[] {
  const n = playerIds.length
  if (![16, 32, 64].includes(n)) {
    throw new Error(`Unsupported player count: ${n}. Must be 16, 32, or 64.`)
  }

  const shuffled = [...playerIds].sort(() => Math.random() - 0.5)
  const matches: BracketMatch[] = []
  const rounds = Math.log2(n)

  const matchesInRound1 = n / 2
  for (let pos = 0; pos < matchesInRound1; pos++) {
    matches.push({
      tournament_id: tournamentId,
      round: 1,
      position: pos,
      player1_id: shuffled[pos * 2],
      player2_id: shuffled[pos * 2 + 1],
    })
  }

  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = n / Math.pow(2, round)
    for (let pos = 0; pos < matchesInRound; pos++) {
      matches.push({
        tournament_id: tournamentId,
        round,
        position: pos,
        player1_id: null,
        player2_id: null,
      })
    }
  }

  return matches
}
