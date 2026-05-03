import { generateSingleElimination } from '../single'

describe('generateSingleElimination', () => {
  it('generates correct match count for 8 players', () => {
    const players = Array.from({ length: 8 }, (_, i) => `p${i}`)
    const matches = generateSingleElimination('t1', players)
    expect(matches).toHaveLength(7) // 4+2+1
  })

  it('generates correct match count for 16 players', () => {
    const players = Array.from({ length: 16 }, (_, i) => `p${i}`)
    const matches = generateSingleElimination('t1', players)
    expect(matches).toHaveLength(15)
  })

  it('round 1 has all players assigned', () => {
    const players = Array.from({ length: 8 }, (_, i) => `p${i}`)
    const matches = generateSingleElimination('t1', players)
    const r1 = matches.filter(m => m.round === 1)
    expect(r1).toHaveLength(4)
    r1.forEach(m => {
      expect(m.player1_id).not.toBeNull()
      expect(m.player2_id).not.toBeNull()
    })
  })

  it('later rounds have null players', () => {
    const players = Array.from({ length: 8 }, (_, i) => `p${i}`)
    const matches = generateSingleElimination('t1', players)
    const later = matches.filter(m => m.round > 1)
    later.forEach(m => {
      expect(m.player1_id).toBeNull()
      expect(m.player2_id).toBeNull()
    })
  })

  it('all matches have bracket=main', () => {
    const players = Array.from({ length: 8 }, (_, i) => `p${i}`)
    const matches = generateSingleElimination('t1', players)
    matches.forEach(m => expect(m.bracket).toBe('main'))
  })

  it('throws for non-power-of-2 player count', () => {
    expect(() => generateSingleElimination('t1', ['a', 'b', 'c'])).toThrow()
  })
})
