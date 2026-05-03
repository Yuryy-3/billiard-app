export type BracketMatch = {
  tournament_id: string
  round: number
  position: number
  player1_id: string | null
  player2_id: string | null
  bracket: string
  group_id: number
}

export type GridFormat = 'single_elimination' | 'double_elimination' | 'round_robin' | 'groups_playoff'

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Single Elimination ──────────────────────────────────────────────────────

function generateSingleElimination(
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

// ── Double Elimination ──────────────────────────────────────────────────────

function generateDoubleElimination(
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
    matches.push({
      tournament_id: tournamentId,
      round: 1,
      position: pos,
      player1_id: shuffled[pos * 2],
      player2_id: shuffled[pos * 2 + 1],
      bracket: 'winners',
      group_id: -1,
    })
  }
  for (let r = 2; r <= k; r++) {
    const count = n / Math.pow(2, r)
    for (let pos = 0; pos < count; pos++) {
      matches.push({
        tournament_id: tournamentId,
        round: r,
        position: pos,
        player1_id: null,
        player2_id: null,
        bracket: 'winners',
        group_id: -1,
      })
    }
  }

  // Losers bracket: 2*(k-1) rounds
  for (let j = 1; j <= k - 1; j++) {
    const count = n / Math.pow(2, j + 1)
    // Odd round (2j-1)
    for (let pos = 0; pos < count; pos++) {
      matches.push({
        tournament_id: tournamentId,
        round: 2 * j - 1,
        position: pos,
        player1_id: null,
        player2_id: null,
        bracket: 'losers',
        group_id: -1,
      })
    }
    // Even round (2j)
    for (let pos = 0; pos < count; pos++) {
      matches.push({
        tournament_id: tournamentId,
        round: 2 * j,
        position: pos,
        player1_id: null,
        player2_id: null,
        bracket: 'losers',
        group_id: -1,
      })
    }
  }

  // Grand Final
  matches.push({
    tournament_id: tournamentId,
    round: 1,
    position: 0,
    player1_id: null,
    player2_id: null,
    bracket: 'grand_final',
    group_id: -1,
  })

  return matches
}

// ── Round Robin ─────────────────────────────────────────────────────────────

function generateRoundRobin(
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
        bracket: 'main',
        group_id: -1,
      })
      position++
    }

    // Rotate circle one step clockwise
    const last = circle.pop()!
    circle.unshift(last)
  }

  return matches
}

// ── Groups + Playoff ────────────────────────────────────────────────────────

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

function generateGroupsPlayoff(
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

  // Top 2 from each group advance → numGroups * 2 playoff teams
  const numPlayoffTeams = numGroups * 2

  // Round up to next power of 2
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

// ── Double Elimination Routing ───────────────────────────────────────────────

export type RouteResult = { bracket: string; round: number; position: number; slot: 0 | 1 }

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

// ── Entry point ─────────────────────────────────────────────────────────────

export function generateBracket(
  format: GridFormat,
  tournamentId: string,
  playerIds: string[],
  options?: { groupSize?: number }
): BracketMatch[] {
  switch (format) {
    case 'single_elimination':
      return generateSingleElimination(tournamentId, playerIds)
    case 'double_elimination':
      return generateDoubleElimination(tournamentId, playerIds)
    case 'round_robin':
      return generateRoundRobin(tournamentId, playerIds)
    case 'groups_playoff':
      return generateGroupsPlayoff(tournamentId, playerIds, options?.groupSize ?? 4)
    default: {
      const _exhaustive: never = format
      throw new Error(`Unknown grid format: ${_exhaustive}`)
    }
  }
}
