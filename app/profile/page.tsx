import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Database } from '@/lib/supabase/types'
import { TelegramConnect } from '@/components/profile/TelegramConnect'

type Profile = Database['public']['Tables']['profiles']['Row']

type RegistrationWithTournament = {
  tournament_id: string
  tournaments: { title: string; date: string; status: string } | null
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  const { data: registrationsData } = await supabase
    .from('registrations')
    .select('tournament_id, tournaments(title, date, status)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const registrations = registrationsData as RegistrationWithTournament[] | null

  const { data: wins } = await supabase
    .from('matches')
    .select('id')
    .eq('winner_id', user.id)

  const { data: allMyMatches } = await supabase
    .from('matches')
    .select('id')
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
    .not('winner_id', 'is', null)

  const winCount = wins?.length ?? 0
  const totalMatches = allMyMatches?.length ?? 0
  const lossCount = totalMatches - winCount
  const winRate = totalMatches > 0 ? Math.round((winCount / totalMatches) * 100) : 0

  const STATUS_LABELS: Record<string, string> = {
    draft: 'Черновик',
    open: 'Открыт',
    closed: 'Закрыт',
    ongoing: 'Идёт',
    finished: 'Завершён',
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{profile?.name ?? 'Профиль'}</h1>
        <div className="flex gap-3 items-center">
          {profile?.role === 'admin' && (
            <Link href="/admin" className="text-purple-400 text-sm hover:text-purple-300">
              Админ-панель
            </Link>
          )}
          <Link href="/" className="text-gray-400 text-sm hover:text-white">← Главная</Link>
        </div>
      </div>

      <p className="text-gray-400 mb-8">{profile?.phone}</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{winCount}</div>
          <div className="text-sm text-gray-400 mt-1">Побед</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{lossCount}</div>
          <div className="text-sm text-gray-400 mt-1">Поражений</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{winRate}%</div>
          <div className="text-sm text-gray-400 mt-1">% побед</div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Уведомления</h2>
        <TelegramConnect telegramChatId={profile?.telegram_chat_id ?? null} />
      </div>

      <h2 className="text-lg font-semibold mb-4">История турниров</h2>
      <div className="flex flex-col gap-3">
        {registrations?.map(r => {
          const t = r.tournaments
          if (!t) return null
          return (
            <div key={r.tournament_id} className="bg-slate-800 rounded-xl p-4">
              <div className="font-medium">{t.title}</div>
              <div className="text-sm text-gray-400 mt-1">
                {new Date(t.date).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                {' · '}
                {STATUS_LABELS[t.status] ?? t.status}
              </div>
            </div>
          )
        })}
        {!registrations?.length && (
          <p className="text-gray-500 py-4">Вы ещё не участвовали в турнирах</p>
        )}
      </div>
    </main>
  )
}
