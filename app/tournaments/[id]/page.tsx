import { createClient } from '@/lib/supabase/server'
import { RegistrationButton } from '@/components/tournaments/RegistrationButton'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const DISCIPLINE_LABELS: Record<string, string> = {
  svoyak: 'Свояк',
  pyramid: 'Пирамида',
  combined: 'Комбинированная',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  open: 'Регистрация открыта',
  closed: 'Регистрация закрыта',
  ongoing: 'Идёт сейчас',
  finished: 'Завершён',
}

type TournamentFull = {
  id: string
  organizer_id: string
  title: string
  date: string
  address: string
  discipline: string
  participants_limit: number
  time_limit_min: number
  shot_clock_sec: number
  shot_clock_extension_sec: number
  entry_fee: number
  payment_type: string
  prize_description: string | null
  status: string
  profiles: { name: string } | null
}

export default async function TournamentPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tournamentRaw } = await supabase
    .from('tournaments')
    .select('*, profiles(name)')
    .eq('id', params.id)
    .single()

  if (!tournamentRaw) notFound()
  const tournament = tournamentRaw as unknown as TournamentFull

  const { data: registrationsRaw } = await supabase
    .from('registrations')
    .select('user_id')
    .eq('tournament_id', params.id)

  const registrations = registrationsRaw as { user_id: string }[] | null
  const isRegistered = registrations?.some(r => r.user_id === user?.id) ?? false
  const isOrganizer = user?.id === tournament.organizer_id

  const organizerName = tournament.profiles?.name ?? 'Организатор'

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-2">
        <Link href="/" className="text-gray-400 text-sm hover:text-white">← Назад</Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{tournament.title}</h1>
        <p className="text-gray-400 text-sm">
          Организатор: {organizerName}
          {' · '}
          <span className="text-green-400">{STATUS_LABELS[tournament.status] ?? tournament.status}</span>
        </p>
      </div>

      <div className="bg-slate-800 rounded-xl p-5 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400 mb-1">Дата</div>
            <div>{new Date(tournament.date).toLocaleDateString('ru-RU', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Адрес</div>
            <div>{tournament.address}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Дисциплина</div>
            <div>{DISCIPLINE_LABELS[tournament.discipline] ?? tournament.discipline}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Участники</div>
            <div>{registrations?.length ?? 0} / {tournament.participants_limit}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Формат</div>
            <div>Олимпийская система</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Лимит матча</div>
            <div>{tournament.time_limit_min} мин</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Взнос</div>
            <div>{tournament.entry_fee > 0 ? `${tournament.entry_fee} ₽` : 'Бесплатно'}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Шот-клок</div>
            <div>{tournament.shot_clock_sec} сек (+{tournament.shot_clock_extension_sec})</div>
          </div>
        </div>

        {tournament.prize_description && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="text-gray-400 text-sm mb-1">Призы</div>
            <div className="text-sm">{tournament.prize_description}</div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {tournament.status === 'open' && (
          <RegistrationButton
            tournamentId={tournament.id}
            userId={user?.id ?? null}
            isRegistered={isRegistered}
            paymentType={tournament.payment_type}
            entryFee={tournament.entry_fee}
          />
        )}

        {['ongoing', 'finished'].includes(tournament.status) && (
          <Link
            href={`/tournaments/${tournament.id}/bracket`}
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-3 font-semibold text-center transition"
          >
            Смотреть сетку
          </Link>
        )}

        {isOrganizer && (
          <Link
            href={`/tournaments/${tournament.id}/admin`}
            className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-4 py-3 font-semibold text-center transition"
          >
            Судейская панель
          </Link>
        )}
      </div>
    </main>
  )
}
