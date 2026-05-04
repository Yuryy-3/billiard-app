import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateBracket, type GridFormat } from '../_shared/brackets.ts'

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
    let body: { tournament_id?: string }
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { tournament_id } = body
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

    // Fetch tournament to get grid_format and group_size
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('grid_format, group_size')
      .eq('id', tournament_id)
      .single()

    if (tournamentError || !tournament) {
      return new Response(
        JSON.stringify({ error: tournamentError?.message ?? 'Tournament not found' }),
        {
          status: tournamentError?.code === 'PGRST116' ? 404 : 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Fetch registered players
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

    const gridFormat: GridFormat = (tournament.grid_format ?? 'single_elimination') as GridFormat
    const matches = generateBracket(gridFormat, tournament_id, playerIds, {
      groupSize: tournament.group_size ?? 4,
    })

    const { error: insertError } = await supabase.from('matches').insert(matches)
    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { error: statusError } = await supabase
      .from('tournaments')
      .update({ status: 'ongoing' })
      .eq('id', tournament_id)

    if (statusError) {
      return new Response(
        JSON.stringify({ error: `Failed to update tournament status: ${statusError.message}` }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

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
