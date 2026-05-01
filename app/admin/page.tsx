import { createAdminClient } from '@/lib/supabase/admin-client'

export default async function AdminDashboard() {
  const supabase = createAdminClient()

  const [
    { count: usersCount },
    { count: tournamentsCount },
    { count: registrationsCount },
    { data: recentRegs },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('tournaments').select('*', { count: 'exact', head: true }),
    supabase.from('registrations').select('*', { count: 'exact', head: true }),
    supabase
      .from('registrations')
      .select('created_at, profiles(name), tournaments(title)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Обзор</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-green-400">{usersCount ?? 0}</div>
          <div className="text-sm text-slate-400 mt-1">Пользователей</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-blue-400">{tournamentsCount ?? 0}</div>
          <div className="text-sm text-slate-400 mt-1">Турниров</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-yellow-400">{registrationsCount ?? 0}</div>
          <div className="text-sm text-slate-400 mt-1">Регистраций</div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Последние регистрации</h2>
        <div className="flex flex-col gap-3">
          {(recentRegs ?? []).map((r, i) => {
            const profile = r.profiles as { name: string } | null
            const tournament = r.tournaments as { title: string } | null
            return (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-slate-200">{profile?.name ?? '—'}</span>
                <span className="text-slate-500">{tournament?.title ?? '—'} · {new Date(r.created_at).toLocaleDateString('ru-RU')}</span>
              </div>
            )
          })}
          {!recentRegs?.length && <p className="text-slate-500 text-sm">Нет регистраций</p>}
        </div>
      </div>
    </div>
  )
}
