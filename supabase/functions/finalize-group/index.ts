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
    let body: { tournament_id?: string; group_id?: number }
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { tournament_id, group_id } = body

    if (!tournament_id) {
      return new Response(JSON.stringify({ error: 'tournament_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (group_id === undefined || group_id === null || group_id < 0) {
      return new Response(JSON.stringify({ error: 'group_id must be a non-negative number' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch all matches for this group
    const { data: groupMatches, error: groupMatchesError } = await supabase
      .from('matches')
      .select('id, player1_id, player2_id, winner_id')
      .eq('tournament_id', tournament_id)
      .eq('bracket', 'group')
      .eq('group_id', group_id)

    if (groupMatchesError) {
      return new Response(JSON.stringify({ error: `Failed to fetch group matches: ${groupMatchesError.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!groupMatches || groupMatches.length === 0) {
      return new Response(JSON.stringify({ error: 'No matches found for this group' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. Ensure all matches are completed
    const incomplete = groupMatches.filter((m) => !m.winner_id)
    if (incomplete.length > 0) {
      return new Response(JSON.stringify({ error: 'Group is not yet complete' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 3. Compute standings (wins per player)
    const winsMap = new Map<string, number>()

    for (const match of groupMatches) {
      if (match.player1_id) {
        winsMap.set(match.player1_id, winsMap.get(match.player1_id) ?? 0)
      }
      if (match.player2_id) {
        winsMap.set(match.player2_id, winsMap.get(match.player2_id) ?? 0)
      }
      if (match.winner_id) {
        winsMap.set(match.winner_id, (winsMap.get(match.winner_id) ?? 0) + 1)
      }
    }

    const standings = Array.from(winsMap.entries())
      .map(([player_id, wins]) => ({ player_id, wins }))
      .sort((a, b) => b.wins - a.wins)

    if (standings.length < 2) {
      return new Response(JSON.stringify({ error: 'Not enough players in group to determine top 2' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const winner = standings[0].player_id
    const runnerUp = standings[1].player_id

    // 4. Count total number of groups in this tournament
    const { data: groupCountData, error: groupCountError } = await supabase
      .from('matches')
      .select('group_id')
      .eq('tournament_id', tournament_id)
      .eq('bracket', 'group')

    if (groupCountError) {
      return new Response(JSON.stringify({ error: `Failed to count groups: ${groupCountError.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const distinctGroupIds = new Set((groupCountData ?? []).map((m) => m.group_id))
    const numGroups = distinctGroupIds.size

    // 5. Seed playoff matches
    // winner → round 1, position=group_id, player1_id
    // runner-up → round 1, position=(numGroups-1-group_id), player2_id

    const winnerPosition = group_id
    const runnerUpPosition = numGroups - 1 - group_id

    // Update winner into playoff match
    const { data: winnerMatch, error: winnerMatchError } = await supabase
      .from('matches')
      .select('id')
      .eq('tournament_id', tournament_id)
      .eq('bracket', 'playoff')
      .eq('round', 1)
      .eq('position', winnerPosition)
      .single()

    if (winnerMatchError || !winnerMatch) {
      return new Response(
        JSON.stringify({ error: `Playoff match for winner not found (position=${winnerPosition})` }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const { error: winnerUpdateError } = await supabase
      .from('matches')
      .update({ player1_id: winner })
      .eq('id', winnerMatch.id)

    if (winnerUpdateError) {
      return new Response(JSON.stringify({ error: `Failed to seed winner: ${winnerUpdateError.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Update runner-up into playoff match
    const { data: runnerUpMatch, error: runnerUpMatchError } = await supabase
      .from('matches')
      .select('id')
      .eq('tournament_id', tournament_id)
      .eq('bracket', 'playoff')
      .eq('round', 1)
      .eq('position', runnerUpPosition)
      .single()

    if (runnerUpMatchError || !runnerUpMatch) {
      return new Response(
        JSON.stringify({ error: `Playoff match for runner-up not found (position=${runnerUpPosition})` }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const { error: runnerUpUpdateError } = await supabase
      .from('matches')
      .update({ player2_id: runnerUp })
      .eq('id', runnerUpMatch.id)

    if (runnerUpUpdateError) {
      return new Response(JSON.stringify({ error: `Failed to seed runner-up: ${runnerUpUpdateError.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 6. Check if all groups are now finished (no remaining group matches without winner)
    const { count: remainingCount, error: remainingError } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .eq('tournament_id', tournament_id)
      .eq('bracket', 'group')
      .is('winner_id', null)

    if (remainingError) {
      return new Response(JSON.stringify({ error: `Failed to check remaining matches: ${remainingError.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // If remainingCount === 0 all groups are done — playoff can begin (no action needed here)

    return new Response(
      JSON.stringify({
        success: true,
        winner,
        runner_up: runnerUp,
        all_groups_done: remainingCount === 0,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
