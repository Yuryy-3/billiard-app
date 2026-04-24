/**
 * @jest-environment node
 */
import { generateBracketMatches } from '@/lib/bracket'

describe('generateBracketMatches', () => {
  it('generates 15 matches for 16 players', () => {
    const players = Array.from({ length: 16 }, (_, i) => `user-${i}`)
    const matches = generateBracketMatches('t-1', players)
    expect(matches).toHaveLength(15)
  })

  it('round 1 has 8 matches with players assigned', () => {
    const players = Array.from({ length: 16 }, (_, i) => `user-${i}`)
    const matches = generateBracketMatches('t-1', players)
    const round1 = matches.filter(m => m.round === 1)
    expect(round1).toHaveLength(8)
    round1.forEach(m => {
      expect(m.player1_id).not.toBeNull()
      expect(m.player2_id).not.toBeNull()
    })
  })

  it('rounds 2+ have null player slots', () => {
    const players = Array.from({ length: 16 }, (_, i) => `user-${i}`)
    const matches = generateBracketMatches('t-1', players)
    const laterRounds = matches.filter(m => m.round > 1)
    laterRounds.forEach(m => {
      expect(m.player1_id).toBeNull()
      expect(m.player2_id).toBeNull()
    })
  })

  it('has 4 rounds for 16 players (1/8, 1/4, 1/2, final)', () => {
    const players = Array.from({ length: 16 }, (_, i) => `user-${i}`)
    const matches = generateBracketMatches('t-1', players)
    const rounds = [...new Set(matches.map(m => m.round))].sort()
    expect(rounds).toEqual([1, 2, 3, 4])
  })

  it('generates 31 matches for 32 players', () => {
    const players = Array.from({ length: 32 }, (_, i) => `user-${i}`)
    const matches = generateBracketMatches('t-1', players)
    expect(matches).toHaveLength(31)
  })

  it('throws for unsupported player count', () => {
    const players = Array.from({ length: 8 }, (_, i) => `user-${i}`)
    expect(() => generateBracketMatches('t-1', players)).toThrow('Unsupported player count')
  })

  it('all players from round 1 come from input list', () => {
    const players = Array.from({ length: 16 }, (_, i) => `user-${i}`)
    const matches = generateBracketMatches('t-1', players)
    const round1 = matches.filter(m => m.round === 1)
    const usedPlayers = round1.flatMap(m => [m.player1_id, m.player2_id])
    usedPlayers.forEach(p => expect(players).toContain(p))
    expect(new Set(usedPlayers).size).toBe(16)
  })
})
