import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { TournamentCard } from '@/components/tournaments/TournamentCard'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select(`
      id, title, date, address, discipline,
      participants_limit, entry_fee, status,
      registrations(count)
    `)
    .in('status', ['open', 'ongoing'])
    .order('date', { ascending: true })
    .limit(20)

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
      <div className="flex justify-between items-center mb-6">
        <Image src="/logo.jpg" alt="Виктория" width={120} height={80} className="object-contain" />
        <div className="flex gap-3">
          {user ? (
            <Link href="/profile" className="text-green-400 text-sm hover:text-green-300">
              Профиль
            </Link>
          ) : (
            <Link href="/auth" className="text-green-400 text-sm hover:text-green-300">
              Войти
            </Link>
          )}
        </div>
      </div>

      <nav className="flex gap-4 mb-6 text-sm">
        <Link href="/tournaments" className="text-gray-400 hover:text-white">Все турниры</Link>
        <Link href="/regulations" className="text-gray-400 hover:text-white">Регламенты</Link>
      </nav>

      <h2 className="text-lg font-semibold mb-4">Ближайшие турниры</h2>
      <div className="flex flex-col gap-4">
        {tournamentsWithCount.map(t => (
          <TournamentCard key={t.id} tournament={t} />
        ))}
        {!tournamentsWithCount.length && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-2">Нет предстоящих турниров</p>
            <p className="text-gray-600 text-sm">Следите за обновлениями</p>
          </div>
        )}
      </div>
    </main>
  )
}
