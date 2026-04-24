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
    const { match_id, winner_id } = await req.json()
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
      const updateField = isPlayer1Slot ? 'player1_id' : 'player2_id'
      await supabase
        .from('matches')
        .update({ [updateField]: winner_id })
        .eq('id', nextMatch.id)
    } else {
      await supabase
        .from('tournaments')
        .update({ status: 'finished' })
        .eq('id', match.tournament_id)
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
