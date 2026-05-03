import type { BracketMatch } from './single'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export type RouteResult = {
  bracket: string
  round: number
  position: number
  slot: 0 | 1  // 0 = player1, 1 = player2
}

export function routeDoubleEliminationWinner(
  match: { bracket: string; round: number; position: number; n: number },
  outcome: 'winner' | 'loser'
): RouteResult | null {
  const { bracket, round, position, n } = match
  const k = Math.log2(n)

  if (bracket === 'winners') {
    if (outcome === 'winner') {
      if (round < k) {
        return { bracket: 'winners', round: round + 1, position: Math.floor(position / 2), slot: (position % 2) as 0 | 1 }
      } else {
        // Winners Final winner → GF player1
        return { bracket: 'grand_final', round: 1, position: 0, slot: 0 }
      }
    } else {
      // loser
      if (round === 1) {
        // WR1 losers pair up in LR1
        return { bracket: 'losers', round: 1, position: Math.floor(position / 2), slot: (position % 2) as 0 | 1 }
      } else {
        // WR(r>=2) losers enter LR even round 2*(r-1), cross-seeded
        const lrRound = 2 * (round - 1)
        const matchesInRound = n / Math.pow(2, round)
        const lrPos = matchesInRound - 1 - position
        return { bracket: 'losers', round: lrRound, position: lrPos, slot: 0 }
      }
    }
  }

  if (bracket === 'losers') {
    if (outcome === 'loser') return null  // eliminated

    const losersFinalRound = 2 * (k - 1)

    if (round % 2 === 1) {
      // Odd LR round: winner goes to next even round, same position, slot=player2
      return { bracket: 'losers', round: round + 1, position, slot: 1 }
    } else {
      // Even LR round
      if (round < losersFinalRound) {
        return { bracket: 'losers', round: round + 1, position: Math.floor(position / 2), slot: (position % 2) as 0 | 1 }
      } else {
        // Losers Final winner → GF player2
        return { bracket: 'grand_final', round: 1, position: 0, slot: 1 }
      }
    }
  }

  return null
}

export function generateDoubleElimination(
  tournamentId: string,
  playerIds: string[]
): BracketMatch[] {
  const n = playerIds.length
  if (n < 4 || (n & (n - 1)) !== 0) {
    throw new Error(`Player count must be a power of 2, min 4. Got ${n}`)
  }

  const k = Math.log2(n)
  const shuffled = shuffle(playerIds)
  const matches: BracketMatch[] = []

  // Winners bracket
  for (let pos = 0; pos < n / 2; pos++) {
    matches.push({ tournament_id: tournamentId, round: 1, position: pos,
      player1_id: shuffled[pos * 2], player2_id: shuffled[pos * 2 + 1], bracket: 'winners', group_id: -1 })
  }
  for (let r = 2; r <= k; r++) {
    const count = n / Math.pow(2, r)
    for (let pos = 0; pos < count; pos++) {
      matches.push({ tournament_id: tournamentId, round: r, position: pos,
        player1_id: null, player2_id: null, bracket: 'winners', group_id: -1 })
    }
  }

  // Losers bracket: 2*(k-1) rounds
  for (let j = 1; j <= k - 1; j++) {
    const count = n / Math.pow(2, j + 1)
    // Odd round (2j-1)
    for (let pos = 0; pos < count; pos++) {
      matches.push({ tournament_id: tournamentId, round: 2 * j - 1, position: pos,
        player1_id: null, player2_id: null, bracket: 'losers', group_id: -1 })
    }
    // Even round (2j)
    for (let pos = 0; pos < count; pos++) {
      matches.push({ tournament_id: tournamentId, round: 2 * j, position: pos,
        player1_id: null, player2_id: null, bracket: 'losers', group_id: -1 })
    }
  }

  // Grand Final
  matches.push({ tournament_id: tournamentId, round: 1, position: 0,
    player1_id: null, player2_id: null, bracket: 'grand_final', group_id: -1 })

  return matches
}
