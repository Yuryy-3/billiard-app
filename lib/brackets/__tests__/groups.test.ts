import { generateGroupsPlayoff } from '../groups'

describe('generateGroupsPlayoff', () => {
  it('generates correct number of group matches for 8 players, groupSize=4', () => {
    const matches = generateGroupsPlayoff('t1', ['p1','p2','p3','p4','p5','p6','p7','p8'], 4)
    // 2 groups * 4*(4-1)/2 = 2 * 6 = 12 group matches
    const groupMatches = matches.filter(m => m.bracket === 'group')
    expect(groupMatches.length).toBe(12)
  })

  it('generates correct number of playoff matches for 8 players, groupSize=4', () => {
    const matches = generateGroupsPlayoff('t1', ['p1','p2','p3','p4','p5','p6','p7','p8'], 4)
    // top-2 from each group = 4 teams → single elim: 3 matches (semi + final)
    const playoffMatches = matches.filter(m => m.bracket === 'playoff')
    expect(playoffMatches.length).toBe(3)
  })

  it('group matches have group_id set correctly', () => {
    const matches = generateGroupsPlayoff('t1', ['p1','p2','p3','p4','p5','p6','p7','p8'], 4)
    const groupMatches = matches.filter(m => m.bracket === 'group')
    const groupIds = [...new Set(groupMatches.map(m => m.group_id))]
    expect(groupIds).toEqual([0, 1])
  })

  it('playoff matches have group_id=-1', () => {
    const matches = generateGroupsPlayoff('t1', ['p1','p2','p3','p4','p5','p6','p7','p8'], 4)
    const playoffMatches = matches.filter(m => m.bracket === 'playoff')
    expect(playoffMatches.every(m => m.group_id === -1)).toBe(true)
  })

  it('throws if players not multiple of groupSize', () => {
    expect(() => generateGroupsPlayoff('t1', ['p1','p2','p3','p4','p5'], 4)).toThrow()
  })

  it('playoff players are null (seeded later by finalize-group)', () => {
    const matches = generateGroupsPlayoff('t1', ['p1','p2','p3','p4','p5','p6','p7','p8'], 4)
    const playoffMatches = matches.filter(m => m.bracket === 'playoff')
    expect(playoffMatches.every(m => m.player1_id === null && m.player2_id === null)).toBe(true)
  })
})
