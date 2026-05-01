import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="flex min-h-screen bg-slate-900 text-white">
      <aside className="w-48 bg-slate-950 border-r border-slate-800 flex flex-col py-4 shrink-0">
        <div className="px-4 pb-4 border-b border-slate-800 mb-3">
          <div className="text-xs text-slate-500 uppercase tracking-widest">Admin</div>
          <div className="text-sm text-slate-400 mt-1">Виктория</div>
        </div>
        <nav className="flex flex-col gap-1 px-2 flex-1">
          <Link href="/admin" className="px-3 py-2 rounded-lg text-sm hover:bg-slate-800 transition-colors">
            📊 Обзор
          </Link>
          <Link href="/admin/users" className="px-3 py-2 rounded-lg text-sm hover:bg-slate-800 transition-colors">
            👥 Пользователи
          </Link>
          <Link href="/admin/tournaments" className="px-3 py-2 rounded-lg text-sm hover:bg-slate-800 transition-colors">
            🏆 Турниры
          </Link>
        </nav>
        <div className="px-2 mt-auto pt-4 border-t border-slate-800">
          <Link href="/" className="px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-800 transition-colors block">
            ← На сайт
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-8 max-w-5xl">
        {children}
      </main>
    </div>
  )
}
