import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type BracketMatch = {
  tournament_id: string
  round: number
  position: number
  player1_id: string | null
  player2_id: string | null
}

function generateBracketMatches(tournamentId: string, playerIds: string[]): BracketMatch[] {
  const n = playerIds.length
  if (![16, 32, 64].includes(n)) {
    throw new Error(`Need exactly 16, 32 or 64 players. Got ${n}`)
  }

  const shuffled = [...playerIds].sort(() => Math.random() - 0.5)
  const matches: BracketMatch[] = []
  const rounds = Math.log2(n)

  const matchesInRound1 = n / 2
  for (let pos = 0; pos < matchesInRound1; pos++) {
    matches.push({
      tournament_id: tournamentId,
      round: 1,
      position: pos,
      player1_id: shuffled[pos * 2],
      player2_id: shuffled[pos * 2 + 1],
    })
  }

  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = n / Math.pow(2, round)
    for (let pos = 0; pos < matchesInRound; pos++) {
      matches.push({
        tournament_id: tournamentId,
        round,
        position: pos,
        player1_id: null,
        player2_id: null,
      })
    }
  }

  return matches
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
    const { tournament_id } = await req.json()
    if (!tournament_id) {
      return new Response(JSON.stringify({ error: 'tournament_id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('user_id')
      .eq('tournament_id', tournament_id)

    if (regError) {
      return new Response(JSON.stringify({ error: regError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const playerIds = (registrations ?? []).map((r: { user_id: string }) => r.user_id)

    const matches = generateBracketMatches(tournament_id, playerIds)

    const { error: insertError } = await supabase.from('matches').insert(matches)
    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await supabase
      .from('tournaments')
      .update({ status: 'ongoing' })
      .eq('id', tournament_id)

    return new Response(
      JSON.stringify({ success: true, matches_count: matches.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
