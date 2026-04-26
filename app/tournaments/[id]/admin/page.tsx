import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { MatchList, type AdminMatch } from '@/components/admin/MatchList'
import Link from 'next/link'

export default async function AdminPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: tournamentRaw } = await supabase
    .from('tournaments').select('*').eq('id', params.id).single()

  type TRow = import('@/lib/supabase/types').Database['public']['Tables']['tournaments']['Row']
  const tournament = tournamentRaw as unknown as TRow | null

  if (!tournament || tournament.organizer_id !== user.id) notFound()

  const { data: matchesRaw } = await supabase
    .from('matches')
    .select(`
      id, round, position, player1_id, player2_id, winner_id, started_at,
      player1:profiles!matches_player1_id_fkey(name),
      player2:profiles!matches_player2_id_fkey(name)
    `)
    .eq('tournament_id', params.id)
    .order('round', { ascending: true })
    .order('position', { ascending: true })

  const matches = (matchesRaw ?? []) as unknown as AdminMatch[]
  const hasMatches = matches.length > 0

  async function startDraw() {
    'use server'
    const supabase = await createClient()
    await supabase.functions.invoke('generate-bracket', {
      body: { tournament_id: params.id },
    })
    redirect(`/tournaments/${params.id}/admin`)
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-2">
        <Link href={`/tournaments/${params.id}`} className="text-gray-400 text-sm hover:text-white">
          ← К турниру
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-1">{tournament.title}</h1>
      <p className="text-gray-400 text-sm mb-6">Судейская панель</p>

      {!hasMatches ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-2">Участники зарегистрированы</p>
          <p className="text-gray-500 text-sm mb-8">
            Нажмите кнопку ниже, чтобы провести жеребьёвку и сформировать сетку
          </p>
          <form action={startDraw}>
            <button type="submit"
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-8 py-4 font-bold text-lg transition">
              🎱 Провести жеребьёвку
            </button>
          </form>
        </div>
      ) : (
        <MatchList
          matches={matches}
          timeLimitMin={tournament.time_limit_min}
          shotClockSec={tournament.shot_clock_sec}
          shotClockExtensionSec={tournament.shot_clock_extension_sec}
        />
      )}
    </main>
  )
}
