import { generateDoubleElimination, routeDoubleEliminationWinner } from '../double'

describe('generateDoubleElimination', () => {
  it('generates correct total matches for 8 players', () => {
    const players = Array.from({ length: 8 }, (_, i) => `p${i}`)
    const matches = generateDoubleElimination('t1', players)
    // WR: 4+2+1=7, LR: 2+2+1+1=6, GF: 1 → total 14
    expect(matches).toHaveLength(14)
  })

  it('generates correct total matches for 16 players', () => {
    const players = Array.from({ length: 16 }, (_, i) => `p${i}`)
    const matches = generateDoubleElimination('t1', players)
    // WR: 8+4+2+1=15, LR: 4+4+2+2+1+1=14, GF:1 → total 30
    expect(matches).toHaveLength(30)
  })

  it('winners bracket round 1 has all players', () => {
    const players = Array.from({ length: 8 }, (_, i) => `p${i}`)
    const matches = generateDoubleElimination('t1', players)
    const wr1 = matches.filter(m => m.bracket === 'winners' && m.round === 1)
    expect(wr1).toHaveLength(4)
    wr1.forEach(m => {
      expect(m.player1_id).not.toBeNull()
      expect(m.player2_id).not.toBeNull()
    })
  })

  it('losers bracket matches start empty', () => {
    const players = Array.from({ length: 8 }, (_, i) => `p${i}`)
    const matches = generateDoubleElimination('t1', players)
    const losers = matches.filter(m => m.bracket === 'losers')
    losers.forEach(m => {
      expect(m.player1_id).toBeNull()
      expect(m.player2_id).toBeNull()
    })
  })

  it('grand final match exists with bracket=grand_final', () => {
    const players = Array.from({ length: 8 }, (_, i) => `p${i}`)
    const matches = generateDoubleElimination('t1', players)
    const gf = matches.filter(m => m.bracket === 'grand_final')
    expect(gf).toHaveLength(1)
  })
})

describe('routeDoubleEliminationWinner', () => {
  it('WR1 winner goes to WR2', () => {
    const dest = routeDoubleEliminationWinner({ bracket: 'winners', round: 1, position: 0, n: 8 }, 'winner')
    expect(dest).toEqual({ bracket: 'winners', round: 2, position: 0, slot: 0 })
  })

  it('WR1 loser goes to LR1', () => {
    const dest = routeDoubleEliminationWinner({ bracket: 'winners', round: 1, position: 1, n: 8 }, 'loser')
    expect(dest).toEqual({ bracket: 'losers', round: 1, position: 0, slot: 1 })
  })

  it('WR Final winner goes to grand_final', () => {
    const dest = routeDoubleEliminationWinner({ bracket: 'winners', round: 3, position: 0, n: 8 }, 'winner')
    expect(dest).toEqual({ bracket: 'grand_final', round: 1, position: 0, slot: 0 })
  })

  it('LR odd round winner goes to next LR even round', () => {
    const dest = routeDoubleEliminationWinner({ bracket: 'losers', round: 1, position: 0, n: 8 }, 'winner')
    expect(dest).toEqual({ bracket: 'losers', round: 2, position: 0, slot: 1 })
  })

  it('LR Final winner goes to grand_final', () => {
    // N=8, k=3, Losers Final = LR round 2*(3-1)=4
    const dest = routeDoubleEliminationWinner({ bracket: 'losers', round: 4, position: 0, n: 8 }, 'winner')
    expect(dest).toEqual({ bracket: 'grand_final', round: 1, position: 0, slot: 1 })
  })
})
