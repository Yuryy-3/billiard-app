export type BracketMatch = {
  tournament_id: string
  round: number
  position: number
  player1_id: string | null
  player2_id: string | null
  bracket: string
  group_id: number
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateSingleElimination(
  tournamentId: string,
  playerIds: string[]
): BracketMatch[] {
  const n = playerIds.length
  if (n < 2 || (n & (n - 1)) !== 0) {
    throw new Error(`Player count must be a power of 2. Got ${n}`)
  }

  const shuffled = shuffle(playerIds)
  const matches: BracketMatch[] = []
  const rounds = Math.log2(n)

  for (let pos = 0; pos < n / 2; pos++) {
    matches.push({
      tournament_id: tournamentId,
      round: 1,
      position: pos,
      player1_id: shuffled[pos * 2],
      player2_id: shuffled[pos * 2 + 1],
      bracket: 'main',
      group_id: -1,
    })
  }

  for (let round = 2; round <= rounds; round++) {
    const count = n / Math.pow(2, round)
    for (let pos = 0; pos < count; pos++) {
      matches.push({
        tournament_id: tournamentId,
        round,
        position: pos,
        player1_id: null,
        player2_id: null,
        bracket: 'main',
        group_id: -1,
      })
    }
  }

  return matches
}
