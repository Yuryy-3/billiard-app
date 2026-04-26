'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { MatchWithPlayers } from './MatchCard'

export function useBracketRealtime(tournamentId: string, initialMatches: MatchWithPlayers[]) {
  const [matches, setMatches] = useState<MatchWithPlayers[]>(initialMatches)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`bracket:${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('matches')
            .select(`
              id, round, position,
              player1_id, player2_id,
              score1, score2, winner_id,
              table_number, started_at, finished_at,
              player1:profiles!matches_player1_id_fkey(name),
              player2:profiles!matches_player2_id_fkey(name)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMatches(prev =>
              prev.map(m => m.id === (data as unknown as MatchWithPlayers).id
                ? (data as unknown as MatchWithPlayers)
                : m
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tournamentId, supabase])

  return matches
}
