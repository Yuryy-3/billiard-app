import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { routeDoubleEliminationWinner } from '../_shared/brackets.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

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
    .maybeSingle()

  if (nextMatch) {
    const { error } = await supabase
      .from('matches')
      .update({ [updateField]: winnerId })
      .eq('id', nextMatch.id)
    if (error) {
      return { error: json({ error: error.message }, 500) }
    }
    return { advanced: true }
  } else {
    return { advanced: false }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    let body: { match_id?: string; winner_id?: string }
    try {
      body = await req.json()
    } catch {
      return json({ error: 'Invalid JSON body' }, 400)
    }

    const { match_id, winner_id } = body
    if (!match_id || !winner_id) {
      return json({ error: 'match_id and winner_id required' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, round, position, bracket, group_id, tournament_id, player1_id, player2_id')
      .eq('id', match_id)
      .single()

    if (matchError || !match) {
      return json({ error: 'Match not found' }, 404)
    }

    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('grid_format, participants_limit, group_size')
      .eq('id', match.tournament_id)
      .single()

    if (tournamentError || !tournament) {
      return json({ error: 'Tournament not found' }, 404)
    }

    const { error: updateMatchError } = await supabase
      .from('matches')
      .update({ winner_id })
      .eq('id', match_id)

    if (updateMatchError) {
      return json({ error: `Failed to update match: ${updateMatchError.message}` }, 500)
    }

    const { grid_format } = tournament

    // A. single_elimination
    if (grid_format === 'single_elimination') {
      const result = await advanceSingleEliminationSlot(
        supabase, match.tournament_id, match, winner_id, 'main'
      )
      if ('error' in result) return result.error

      if (!result.advanced) {
        const { error: finishError } = await supabase
          .from('tournaments').update({ status: 'finished' }).eq('id', match.tournament_id)
        if (finishError) return json({ error: `Failed to finish tournament: ${finishError.message}` }, 500)
      }
    }

    // B. double_elimination
    else if (grid_format === 'double_elimination') {
      const n = tournament.participants_limit
      const winnerRoute = routeDoubleEliminationWinner(
        { bracket: match.bracket, round: match.round, position: match.position, n }, 'winner'
      )
      const loserRoute = routeDoubleEliminationWinner(
        { bracket: match.bracket, round: match.round, position: match.position, n }, 'loser'
      )
      const loserId = winner_id === match.player1_id ? match.player2_id : match.player1_id

      if (winnerRoute !== null) {
        const { data: winnerNextMatch } = await supabase
          .from('matches').select('id')
          .eq('tournament_id', match.tournament_id)
          .eq('bracket', winnerRoute.bracket)
          .eq('round', winnerRoute.round)
          .eq('position', winnerRoute.position)
          .maybeSingle()

        if (winnerNextMatch) {
          const updateField = winnerRoute.slot === 0 ? 'player1_id' : 'player2_id'
          const { error: advanceError } = await supabase
            .from('matches').update({ [updateField]: winner_id }).eq('id', winnerNextMatch.id)
          if (advanceError) return json({ error: `Failed to advance winner: ${advanceError.message}` }, 500)
        } else {
          return json({ error: 'Next winner match not found in DB' }, 500)
        }
      } else {
        const { error: finishError } = await supabase
          .from('tournaments').update({ status: 'finished' }).eq('id', match.tournament_id)
        if (finishError) return json({ error: `Failed to finish tournament: ${finishError.message}` }, 500)
      }

      if (loserRoute !== null && loserId) {
        const { data: loserNextMatch } = await supabase
          .from('matches').select('id')
          .eq('tournament_id', match.tournament_id)
          .eq('bracket', loserRoute.bracket)
          .eq('round', loserRoute.round)
          .eq('position', loserRoute.position)
          .maybeSingle()

        if (loserNextMatch) {
          const updateField = loserRoute.slot === 0 ? 'player1_id' : 'player2_id'
          const { error: loserAdvanceError } = await supabase
            .from('matches').update({ [updateField]: loserId }).eq('id', loserNextMatch.id)
          if (loserAdvanceError) return json({ error: `Failed to advance loser: ${loserAdvanceError.message}` }, 500)
        } else {
          return json({ error: 'Next loser match not found in DB' }, 500)
        }
      }
    }

    // C. round_robin
    else if (grid_format === 'round_robin') {
      const { count, error: countError } = await supabase
        .from('matches').select('id', { count: 'exact', head: true })
        .eq('tournament_id', match.tournament_id)
        .eq('bracket', 'main')
        .is('winner_id', null)

      if (countError) return json({ error: `Failed to count matches: ${countError.message}` }, 500)

      if (count === 0) {
        const { error: finishError } = await supabase
          .from('tournaments').update({ status: 'finished' }).eq('id', match.tournament_id)
        if (finishError) return json({ error: `Failed to finish tournament: ${finishError.message}` }, 500)
      }
    }

    // D. groups_playoff — group stage
    else if (grid_format === 'groups_playoff' && match.bracket === 'group') {
      const { count, error: countError } = await supabase
        .from('matches').select('id', { count: 'exact', head: true })
        .eq('tournament_id', match.tournament_id)
        .eq('bracket', 'group')
        .eq('group_id', match.group_id)
        .is('winner_id', null)

      if (countError) return json({ error: `Failed to count group matches: ${countError.message}` }, 500)

      if (count === 0) {
        const { error: invokeError } = await supabase.functions.invoke('finalize-group', {
          body: { tournament_id: match.tournament_id, group_id: match.group_id },
        })
        if (invokeError) return json({ error: `Failed to invoke finalize-group: ${invokeError.message}` }, 500)
      }
    }

    // E. groups_playoff — playoff stage
    else if (grid_format === 'groups_playoff' && match.bracket === 'playoff') {
      const result = await advanceSingleEliminationSlot(
        supabase, match.tournament_id, match, winner_id, 'playoff'
      )
      if ('error' in result) return result.error

      if (!result.advanced) {
        const { error: finishError } = await supabase
          .from('tournaments').update({ status: 'finished' }).eq('id', match.tournament_id)
        if (finishError) return json({ error: `Failed to finish tournament: ${finishError.message}` }, 500)
      }
    }

    return json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return json({ error: message }, 500)
  }
})
