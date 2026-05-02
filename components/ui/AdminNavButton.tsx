import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export async function AdminNavButton() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return null

  return (
    <Link
      href="/admin"
      className="fixed bottom-20 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg transition-colors"
    >
      ⚙️ Админ
    </Link>
  )
}
