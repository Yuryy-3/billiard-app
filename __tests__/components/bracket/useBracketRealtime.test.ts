import { renderHook } from '@testing-library/react'
import { useBracketRealtime } from '@/components/bracket/useBracketRealtime'
import type { MatchWithPlayers } from '@/components/bracket/MatchCard'

const mockRemoveChannel = jest.fn()
const mockSubscribe = jest.fn()

const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: mockSubscribe.mockReturnThis(),
}

const mockCreateClient = {
  channel: jest.fn(() => mockChannel),
  removeChannel: mockRemoveChannel,
  from: jest.fn(),
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockCreateClient,
}))

function makeMatch(id: string): MatchWithPlayers {
  return {
    id,
    round: 1,
    position: 1,
    player1_id: 'p1',
    player2_id: 'p2',
    score1: 0,
    score2: 0,
    winner_id: null,
    table_number: null,
    started_at: null,
    finished_at: null,
    player1: { name: 'Алиса' },
    player2: { name: 'Боб' },
  }
}

describe('useBracketRealtime', () => {
  beforeEach(() => jest.clearAllMocks())

  it('возвращает initialMatches при монтировании', () => {
    const initial = [makeMatch('m-1'), makeMatch('m-2')]
    const { result } = renderHook(() => useBracketRealtime('t-1', initial))
    expect(result.current).toEqual(initial)
    expect(result.current).toHaveLength(2)
  })

  it('подписывается на канал с ID турнира', () => {
    renderHook(() => useBracketRealtime('t-42', [makeMatch('m-1')]))
    expect(mockCreateClient.channel).toHaveBeenCalledWith('bracket:t-42')
  })

  it('вызывает subscribe на канале', () => {
    renderHook(() => useBracketRealtime('t-1', [makeMatch('m-1')]))
    expect(mockSubscribe).toHaveBeenCalled()
  })

  it('удаляет канал при размонтировании', () => {
    const { unmount } = renderHook(() =>
      useBracketRealtime('t-1', [makeMatch('m-1')])
    )
    unmount()
    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel)
  })

  it('регистрирует listener на UPDATE событие таблицы matches', () => {
    renderHook(() => useBracketRealtime('t-1', [makeMatch('m-1')]))
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'UPDATE',
        table: 'matches',
        filter: 'tournament_id=eq.t-1',
      }),
      expect.any(Function)
    )
  })
})
