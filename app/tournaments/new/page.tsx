import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TournamentForm } from '@/components/tournaments/TournamentForm'
import Link from 'next/link'

export default async function NewTournamentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  if (profile?.role !== 'organizer' && profile?.role !== 'admin') {
    redirect('/')
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-gray-400 text-sm hover:text-white">← Главная</Link>
        <h1 className="text-2xl font-bold mt-2">Новый турнир</h1>
      </div>
      <TournamentForm userId={user.id} />
    </main>
  )
}
