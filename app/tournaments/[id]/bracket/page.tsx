import { createClient } from '@/lib/supabase/server'
import { BracketView } from '@/components/bracket/BracketView'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { MatchWithPlayers } from '@/components/bracket/MatchCard'

type TournamentBrief = {
  title: string
  status: 'draft' | 'open' | 'closed' | 'ongoing' | 'finished'
  grid_format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'groups_playoff'
}

export default async function BracketPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: tournamentRaw } = await supabase
    .from('tournaments')
    .select('title, status, grid_format')
    .eq('id', params.id)
    .single()

  const tournament = tournamentRaw as unknown as TournamentBrief | null

  if (!tournament || !['ongoing', 'finished'].includes(tournament.status)) {
    notFound()
  }

  const { data: matchesRaw } = await supabase
    .from('matches')
    .select(`
      id, round, position,
      player1_id, player2_id,
      score1, score2, winner_id,
      table_number, started_at, finished_at,
      bracket, group_id,
      player1:profiles!matches_player1_id_fkey(name),
      player2:profiles!matches_player2_id_fkey(name)
    `)
    .eq('tournament_id', params.id)
    .order('round', { ascending: true })
    .order('position', { ascending: true })

  const matches = (matchesRaw ?? []) as unknown as MatchWithPlayers[]

  return (
    <main className="px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href={`/tournaments/${params.id}`} className="text-gray-400 text-sm hover:text-white">
              ← К турниру
            </Link>
            <h1 className="text-2xl font-bold mt-1">{tournament.title}</h1>
          </div>
          {tournament.status === 'ongoing' && (
            <span className="bg-yellow-600/20 text-yellow-400 text-sm px-3 py-1 rounded-full">
              Live
            </span>
          )}
          {tournament.status === 'finished' && (
            <span className="bg-green-600/20 text-green-400 text-sm px-3 py-1 rounded-full">
              Завершён
            </span>
          )}
        </div>
        <BracketView tournamentId={params.id} initialMatches={matches} gridFormat={tournament.grid_format} />
      </div>
    </main>
  )
}
