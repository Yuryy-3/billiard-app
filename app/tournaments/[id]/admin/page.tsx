import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { MatchList, type AdminMatch } from '@/components/admin/MatchList'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  open: 'Открыта',
  closed: 'Закрыта',
  ongoing: 'Идёт',
  finished: 'Завершён',
}

export default async function AdminPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profileData } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = (profileData as { role: string } | null)?.role === 'admin'

  const { data: tournamentRaw } = await supabase
    .from('tournaments').select('*').eq('id', params.id).single()

  type TRow = import('@/lib/supabase/types').Database['public']['Tables']['tournaments']['Row']
  const tournament = tournamentRaw as unknown as TRow | null

  if (!tournament || (tournament.organizer_id !== user.id && !isAdmin)) notFound()

  const { data: registrationsRaw } = await supabase
    .from('registrations').select('user_id').eq('tournament_id', params.id)
  const regCount = (registrationsRaw ?? []).length

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

  async function setStatus(status: string) {
    'use server'
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('tournaments').update({ status }).eq('id', params.id)
    revalidatePath(`/tournaments/${params.id}/admin`)
    revalidatePath(`/tournaments/${params.id}`)
  }

  const canDraw = tournament.status === 'closed' || tournament.status === 'open'

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-2">
        <Link href={`/tournaments/${params.id}`} className="text-gray-400 text-sm hover:text-white">
          ← К турниру
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-1">{tournament.title}</h1>
      <p className="text-gray-400 text-sm mb-6">Судейская панель</p>

      {/* Блок управления статусом */}
      {!hasMatches && (
        <div className="bg-slate-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-gray-400 text-sm">Статус: </span>
              <span className="text-white font-medium">{STATUS_LABELS[tournament.status] ?? tournament.status}</span>
            </div>
            <span className="text-gray-400 text-sm">Участников: {regCount} / {tournament.participants_limit}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tournament.status !== 'open' && (
              <form action={setStatus.bind(null, 'open')}>
                <button type="submit" className="text-xs px-3 py-1.5 rounded-lg bg-green-900 text-green-300 hover:bg-green-800">
                  Открыть регистрацию
                </button>
              </form>
            )}
            {tournament.status !== 'closed' && tournament.status !== 'ongoing' && tournament.status !== 'finished' && (
              <form action={setStatus.bind(null, 'closed')}>
                <button type="submit" className="text-xs px-3 py-1.5 rounded-lg bg-yellow-900 text-yellow-300 hover:bg-yellow-800">
                  Закрыть регистрацию
                </button>
              </form>
            )}
            {tournament.status === 'ongoing' && (
              <form action={setStatus.bind(null, 'finished')}>
                <button type="submit" className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600">
                  Завершить турнир
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {!hasMatches ? (
        <div className="text-center py-10">
          <p className="text-gray-400 mb-2">Участники зарегистрированы</p>
          <p className="text-gray-500 text-sm mb-8">
            {canDraw
              ? 'Нажмите кнопку ниже, чтобы провести жеребьёвку и сформировать сетку'
              : 'Сначала закройте регистрацию, затем проведите жеребьёвку'}
          </p>
          {canDraw && (
            <form action={startDraw}>
              <button type="submit"
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-8 py-4 font-bold text-lg transition">
                🎱 Провести жеребьёвку
              </button>
            </form>
          )}
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
