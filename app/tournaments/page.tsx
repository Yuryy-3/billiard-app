import { createClient } from '@/lib/supabase/server'
import { TournamentCard } from '@/components/tournaments/TournamentCard'
import Link from 'next/link'

export default async function TournamentsPage() {
  const supabase = await createClient()

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select(`
      id, title, date, address, discipline,
      participants_limit, entry_fee, status,
      registrations(count)
    `)
    .neq('status', 'draft')
    .order('date', { ascending: true })

  type TournamentRow = {
    id: string
    title: string
    date: string
    address: string
    discipline: string
    participants_limit: number
    entry_fee: number
    status: string
    registrations: unknown
  }

  const tournamentsWithCount = (tournaments as TournamentRow[] ?? []).map(t => ({
    id: t.id,
    title: t.title,
    date: t.date,
    address: t.address,
    discipline: t.discipline,
    participants_limit: t.participants_limit,
    entry_fee: t.entry_fee,
    status: t.status,
    registrations_count: (t.registrations as { count: number }[])[0]?.count ?? 0,
  }))

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Все турниры</h1>
        <Link href="/" className="text-gray-400 text-sm hover:text-white">← Главная</Link>
      </div>

      <div className="flex flex-col gap-4">
        {tournamentsWithCount.map(t => (
          <TournamentCard key={t.id} tournament={t} />
        ))}
        {!tournamentsWithCount.length && (
          <p className="text-gray-500 text-center py-12">Нет турниров</p>
        )}
      </div>
    </main>
  )
}
