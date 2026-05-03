export type { BracketMatch } from './single'
export { generateSingleElimination } from './single'
export { generateDoubleElimination } from './double'
export { generateRoundRobin } from './roundrobin'
export { generateGroupsPlayoff } from './groups'

export type GridFormat = 'single_elimination' | 'double_elimination' | 'round_robin' | 'groups_playoff'

import { generateSingleElimination } from './single'
import { generateDoubleElimination } from './double'
import { generateRoundRobin } from './roundrobin'
import { generateGroupsPlayoff } from './groups'
import type { BracketMatch } from './single'

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
    default:
      throw new Error(`Unknown format: ${format}`)
  }
}
