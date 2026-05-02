import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Database } from '@/lib/supabase/types'

type ProfileRow = Pick<Database['public']['Tables']['profiles']['Row'], 'role'>

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Используем admin-клиент (service role) чтобы обойти возможные RLS-проблемы
  const adminSupabase = createAdminClient()
  const { data: profile, error: profileError } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profileData = profile as ProfileRow | null

  if (profileData?.role !== 'admin') {
    // Показываем debug вместо редиректа
    return (
      <div style={{ padding: 32, fontFamily: 'monospace', background: '#0f172a', color: '#e2e8f0', minHeight: '100vh' }}>
        <h1 style={{ color: '#f87171', marginBottom: 16 }}>Доступ запрещён — debug info</h1>
        <pre>{JSON.stringify({
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          userId: user.id,
          email: user.email,
          profile: profileData,
          profileError: profileError?.message,
          role: profileData?.role,
        }, null, 2)}</pre>
      </div>
    )
  }

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
