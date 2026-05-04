import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { routeDoubleEliminationWinner } from '../_shared/brackets.ts'

// Returns a Response on DB error, null on success (advanced or no next match).
// `advanced` out-param communicated via returned object; we use a wrapper type.
async function advanceSingleEliminationSlot(
  supabase: ReturnType<typeof createClient>,
  tournamentId: string,
  match: { round: number; position: number },
  winnerId: string,
  bracket: string
): Promise<{ error: Response } | { advanced: boolean }> {
  const nextRound = match.round + 1
  const nextPosition = Math.floor(match.position / 2)
  const slot = match.position % 2
  const updateField = slot === 0 ? 'player1_id' : 'player2_id'

  const { data: nextMatch } = await supabase
    .from('matches')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('round', nextRound)
    .eq('position', nextPosition)
    .eq('bracket', bracket)
    .single()

  if (nextMatch) {
    const { error } = await supabase
      .from('matches')
      .update({ [updateField]: winnerId })
      .eq('id', nextMatch.id)
    if (error) {
      return {
        error: new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
      }
    }
    return { advanced: true }
  } else {
    return { advanced: false } // no next match — caller should finish tournament
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    let body: { match_id?: string; winner_id?: string }
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { match_id, winner_id } = body
    if (!match_id || !winner_id) {
      return new Response(JSON.stringify({ error: 'match_id and winner_id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch current match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, round, position, bracket, group_id, tournament_id, player1_id, player2_id')
      .eq('id', match_id)
      .single()

    if (matchError || !match) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('grid_format, participants_limit, group_size')
      .eq('id', match.tournament_id)
      .single()

    if (tournamentError || !tournament) {
      return new Response(JSON.stringify({ error: 'Tournament not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Update winner_id on current match
    const { error: updateMatchError } = await supabase
      .from('matches')
      .update({ winner_id })
      .eq('id', match_id)

    if (updateMatchError) {
      return new Response(JSON.stringify({ error: `Failed to update match: ${updateMatchError.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { grid_format } = tournament

    // A. single_elimination
    if (grid_format === 'single_elimination') {
      const result = await advanceSingleEliminationSlot(
        supabase,
        match.tournament_id,
        match,
        winner_id,
        'main'
      )
      if ('error' in result) return result.error

      if (!result.advanced) {
        const { error: finishError } = await supabase
          .from('tournaments')
          .update({ status: 'finished' })
          .eq('id', match.tournament_id)

        if (finishError) {
          return new Response(JSON.stringify({ error: `Failed to finish tournament: ${finishError.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }
    }

    // B. double_elimination
    else if (grid_format === 'double_elimination') {
      const n = tournament.participants_limit
      const winnerRoute = routeDoubleEliminationWinner(
        { bracket: match.bracket, round: match.round, position: match.position, n },
        'winner'
      )
      const loserRoute = routeDoubleEliminationWinner(
        { bracket: match.bracket, round: match.round, position: match.position, n },
        'loser'
      )
      const loserId = winner_id === match.player1_id ? match.player2_id : match.player1_id

      if (winnerRoute !== null) {
        const { data: winnerNextMatch } = await supabase
          .from('matches')
          .select('id')
          .eq('tournament_id', match.tournament_id)
          .eq('bracket', winnerRoute.bracket)
          .eq('round', winnerRoute.round)
          .eq('position', winnerRoute.position)
          .single()

        if (winnerNextMatch) {
          const updateField = winnerRoute.slot === 0 ? 'player1_id' : 'player2_id'
          const { error: advanceError } = await supabase
            .from('matches')
            .update({ [updateField]: winner_id })
            .eq('id', winnerNextMatch.id)

          if (advanceError) {
            return new Response(JSON.stringify({ error: `Failed to advance winner: ${advanceError.message}` }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            })
          }
        } else {
          return new Response(JSON.stringify({ error: 'Next winner match not found in DB' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      } else {
        // winnerRoute null means grand_final finished → tournament over
        const { error: finishError } = await supabase
          .from('tournaments')
          .update({ status: 'finished' })
          .eq('id', match.tournament_id)

        if (finishError) {
          return new Response(JSON.stringify({ error: `Failed to finish tournament: ${finishError.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }

      if (loserRoute !== null && loserId) {
        const { data: loserNextMatch } = await supabase
          .from('matches')
          .select('id')
          .eq('tournament_id', match.tournament_id)
          .eq('bracket', loserRoute.bracket)
          .eq('round', loserRoute.round)
          .eq('position', loserRoute.position)
          .single()

        if (loserNextMatch) {
          const updateField = loserRoute.slot === 0 ? 'player1_id' : 'player2_id'
          const { error: loserAdvanceError } = await supabase
            .from('matches')
            .update({ [updateField]: loserId })
            .eq('id', loserNextMatch.id)

          if (loserAdvanceError) {
            return new Response(JSON.stringify({ error: `Failed to advance loser: ${loserAdvanceError.message}` }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            })
          }
        } else {
          return new Response(JSON.stringify({ error: 'Next loser match not found in DB' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }
    }

    // C. round_robin
    else if (grid_format === 'round_robin') {
      const { count, error: countError } = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('tournament_id', match.tournament_id)
        .eq('bracket', 'main')
        .is('winner_id', null)

      if (countError) {
        return new Response(JSON.stringify({ error: `Failed to count matches: ${countError.message}` }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (count === 0) {
        const { error: finishError } = await supabase
          .from('tournaments')
          .update({ status: 'finished' })
          .eq('id', match.tournament_id)

        if (finishError) {
          return new Response(JSON.stringify({ error: `Failed to finish tournament: ${finishError.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }
    }

    // D. groups_playoff, bracket='group'
    else if (grid_format === 'groups_playoff' && match.bracket === 'group') {
      const { count, error: countError } = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('tournament_id', match.tournament_id)
        .eq('bracket', 'group')
        .eq('group_id', match.group_id)
        .is('winner_id', null)

      if (countError) {
        return new Response(JSON.stringify({ error: `Failed to count group matches: ${countError.message}` }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (count === 0) {
        const { error: invokeError } = await supabase.functions.invoke('finalize-group', {
          body: { tournament_id: match.tournament_id, group_id: match.group_id },
        })

        if (invokeError) {
          return new Response(JSON.stringify({ error: `Failed to invoke finalize-group: ${invokeError.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }
    }

    // E. groups_playoff, bracket='playoff'
    else if (grid_format === 'groups_playoff' && match.bracket === 'playoff') {
      const result = await advanceSingleEliminationSlot(
        supabase,
        match.tournament_id,
        match,
        winner_id,
        'playoff'
      )
      if ('error' in result) return result.error

      if (!result.advanced) {
        const { error: finishError } = await supabase
          .from('tournaments')
          .update({ status: 'finished' })
          .eq('id', match.tournament_id)

        if (finishError) {
          return new Response(JSON.stringify({ error: `Failed to finish tournament: ${finishError.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
