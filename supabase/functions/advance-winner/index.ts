import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // Получить текущий матч
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('round, position, tournament_id')
      .eq('id', match_id)
      .single()

    if (matchError || !match) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Найти матч следующего раунда
    const nextRound = match.round + 1
    const nextPosition = Math.floor(match.position / 2)
    const isPlayer1Slot = match.position % 2 === 0

    const { data: nextMatch } = await supabase
      .from('matches')
      .select('id')
      .eq('tournament_id', match.tournament_id)
      .eq('round', nextRound)
      .eq('position', nextPosition)
      .single()

    if (nextMatch) {
      // Поставить победителя в следующий матч
      const updateField = isPlayer1Slot ? 'player1_id' : 'player2_id'
      const { error: advanceError } = await supabase
        .from('matches')
        .update({ [updateField]: winner_id })
        .eq('id', nextMatch.id)

      if (advanceError) {
        return new Response(JSON.stringify({ error: `Failed to advance winner: ${advanceError.message}` }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    } else {
      // Нет следующего матча — финал сыгран, турнир завершён
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
