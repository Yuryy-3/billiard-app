import { generateRoundRobin } from '../roundrobin'

describe('generateRoundRobin', () => {
  it('generates N*(N-1)/2 matches for even N', () => {
    const matches = generateRoundRobin('t1', ['p1', 'p2', 'p3', 'p4'])
    expect(matches.length).toBe(6) // 4*3/2
  })

  it('generates N*(N-1)/2 matches for odd N', () => {
    const matches = generateRoundRobin('t1', ['p1', 'p2', 'p3'])
    expect(matches.length).toBe(3) // 3*2/2
  })

  it('all matches have bracket=main and group_id=-1', () => {
    const matches = generateRoundRobin('t1', ['p1', 'p2', 'p3', 'p4'])
    expect(matches.every(m => m.bracket === 'main')).toBe(true)
    expect(matches.every(m => m.group_id === -1)).toBe(true)
  })

  it('each pair of players meets exactly once', () => {
    const players = ['p1', 'p2', 'p3', 'p4']
    const matches = generateRoundRobin('t1', players)
    const pairs = new Set<string>()
    for (const m of matches) {
      const key = [m.player1_id, m.player2_id].sort().join('|')
      pairs.add(key)
    }
    expect(pairs.size).toBe(6)
  })

  it('throws if fewer than 3 players', () => {
    expect(() => generateRoundRobin('t1', ['p1', 'p2'])).toThrow()
  })
})
