import { createAdminClient } from '@/lib/supabase/admin-client'
import { setUserRole, toggleBlock } from './actions'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const q = params.q?.toLowerCase() ?? ''
  const supabase = createAdminClient()

  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 })

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, role, is_blocked, created_at')
    .order('created_at', { ascending: false })

  const rows = (profiles ?? []).map(p => {
    const au = authUsers.find(u => u.id === p.id)
    return { ...p, email: au?.email ?? '' }
  }).filter(p =>
    !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
  )

  const ROLE_LABELS: Record<string, string> = {
    participant: 'участник',
    organizer: 'организатор',
    admin: 'admin',
  }

  const ROLE_COLORS: Record<string, string> = {
    participant: 'bg-blue-900 text-blue-300',
    organizer: 'bg-green-900 text-green-300',
    admin: 'bg-purple-900 text-purple-300',
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Пользователи</h1>
        <form>
          <input
            name="q"
            defaultValue={q}
            placeholder="Поиск по имени / email..."
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 w-64"
          />
        </form>
      </div>

      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-700">
            <tr className="text-slate-400 text-xs uppercase tracking-wide">
              <th className="text-left p-4">Имя</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Роль</th>
              <th className="text-left p-4">Дата</th>
              <th className="text-left p-4">Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(user => (
              <tr key={user.id} className="border-b border-slate-700 last:border-0">
                <td className="p-4 text-slate-200">{user.name}</td>
                <td className="p-4 text-slate-400">{user.email}</td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded-md ${ROLE_COLORS[user.role] ?? ''}`}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </td>
                <td className="p-4 text-slate-500">
                  {new Date(user.created_at).toLocaleDateString('ru-RU')}
                </td>
                <td className="p-4">
                  <div className="flex gap-2 flex-wrap">
                    <form action={setUserRole.bind(null, user.id, 'participant')}>
                      <button type="submit" className={`text-xs px-2 py-1 rounded ${user.role === 'participant' ? 'bg-blue-800 text-blue-200' : 'bg-slate-700 text-slate-400'}`}>
                        участник
                      </button>
                    </form>
                    <form action={setUserRole.bind(null, user.id, 'organizer')}>
                      <button type="submit" className={`text-xs px-2 py-1 rounded ${user.role === 'organizer' ? 'bg-green-800 text-green-200' : 'bg-slate-700 text-slate-400'}`}>
                        организатор
                      </button>
                    </form>
                    <form action={setUserRole.bind(null, user.id, 'admin')}>
                      <button type="submit" className={`text-xs px-2 py-1 rounded ${user.role === 'admin' ? 'bg-purple-800 text-purple-200' : 'bg-slate-700 text-slate-400'}`}>
                        admin
                      </button>
                    </form>
                    <form action={toggleBlock.bind(null, user.id, !user.is_blocked)}>
                      <button type="submit" className={`text-xs px-2 py-1 rounded ${user.is_blocked ? 'bg-slate-700 text-slate-300' : 'bg-red-900 text-red-300'}`}>
                        {user.is_blocked ? 'Разблок' : 'Блок'}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
