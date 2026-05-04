import { createAdminClient } from '@/lib/supabase/admin-client'
import { setTournamentStatus, deleteTournament } from './actions'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  open: 'Открыт',
  closed: 'Закрыт',
  ongoing: 'Идёт',
  finished: 'Завершён',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-700 text-slate-300',
  open: 'bg-green-900 text-green-300',
  closed: 'bg-yellow-900 text-yellow-300',
  ongoing: 'bg-blue-900 text-blue-300',
  finished: 'bg-slate-700 text-slate-400',
}

const TOURNAMENT_TYPE_LABELS: Record<string, string> = {
  open: 'Открытый',
  championship: 'Чемпионат',
  cup: 'Кубок',
  rating: 'Рейтинговый',
  team: 'Командный',
}

const GRID_FORMAT_LABELS: Record<string, string> = {
  single_elimination: 'Олимпийская',
  double_elimination: 'Двойное выбывание',
  round_robin: 'Круговая',
  groups_playoff: 'Группы+плей-офф',
}

type TournamentRow = {
  id: string
  title: string
  date: string
  status: string
  tournament_type: string
  grid_format: string
  profiles: { name: string } | null
  registrations: { count: number }[]
}

export default async function AdminTournamentsPage() {
  const supabase = createAdminClient()

  const { data: tournamentsRaw } = await supabase
    .from('tournaments')
    .select(`
      id, title, date, status, tournament_type, grid_format,
      profiles!tournaments_organizer_id_fkey(name),
      registrations(count)
    `)
    .order('date', { ascending: false })

  const tournaments = (tournamentsRaw ?? []) as unknown as TournamentRow[]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Турниры</h1>
        <a
          href="/tournaments/new"
          className="bg-accent-green text-white text-sm px-4 py-2 rounded-lg font-semibold hover:opacity-90"
        >
          + Создать турнир
        </a>
      </div>

      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-700">
            <tr className="text-slate-400 text-xs uppercase tracking-wide">
              <th className="text-left p-4">Название</th>
              <th className="text-left p-4">Организатор</th>
              <th className="text-left p-4">Статус</th>
              <th className="text-left p-4">Участники</th>
              <th className="text-left p-4">Действия</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map(t => {
              const regCount = t.registrations[0]?.count ?? 0
              return (
                <tr key={t.id} className="border-b border-slate-700 last:border-0">
                  <td className="p-4 text-slate-200">
                    <div className="flex flex-col gap-1">
                      <span>{t.title}</span>
                      <div className="flex gap-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-blue-900/50 text-blue-300">
                          {TOURNAMENT_TYPE_LABELS[t.tournament_type] ?? t.tournament_type}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-green-900/50 text-green-300">
                          {GRID_FORMAT_LABELS[t.grid_format] ?? t.grid_format}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-400">{t.profiles?.name ?? '—'}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-md ${STATUS_COLORS[t.status] ?? ''}`}>
                      {STATUS_LABELS[t.status] ?? t.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{regCount}</td>
                  <td className="p-4">
                    <div className="flex gap-2 items-center flex-wrap">
                      {(['open', 'closed', 'ongoing', 'finished'] as const).filter(s => s !== t.status).map(s => (
                        <form key={s} action={setTournamentStatus.bind(null, t.id, s)}>
                          <button type="submit" className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded hover:bg-slate-600">
                            → {STATUS_LABELS[s]}
                          </button>
                        </form>
                      ))}
                      <form action={deleteTournament.bind(null, t.id)}>
                        <button type="submit" className="bg-red-900 text-red-300 text-xs px-2 py-1 rounded">
                          Удалить
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              )
            })}
            {!tournaments.length && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">Нет турниров</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
