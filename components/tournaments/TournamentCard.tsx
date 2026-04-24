import Link from 'next/link'

interface TournamentCardData {
  id: string
  title: string
  date: string
  address: string
  discipline: string
  participants_limit: number
  entry_fee: number
  status: string
  registrations_count: number
}

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

const STATUS_COLORS: Record<string, string> = {
  open: 'text-green-400',
  ongoing: 'text-yellow-400',
  finished: 'text-gray-500',
  closed: 'text-red-400',
  draft: 'text-gray-400',
}

export function TournamentCard({ tournament }: { tournament: TournamentCardData }) {
  const spots = tournament.participants_limit - tournament.registrations_count
  return (
    <Link href={`/tournaments/${tournament.id}`}>
      <div className="bg-slate-800 rounded-xl p-5 hover:bg-slate-700 transition cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-lg leading-tight flex-1 mr-2">{tournament.title}</h3>
          <span className={`text-sm font-medium shrink-0 ${STATUS_COLORS[tournament.status] ?? 'text-gray-400'}`}>
            {STATUS_LABELS[tournament.status] ?? tournament.status}
          </span>
        </div>
        <div className="text-gray-400 text-sm space-y-1">
          <p>📅 {new Date(tournament.date).toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
          })}</p>
          <p>📍 {tournament.address}</p>
          <p>🎱 {DISCIPLINE_LABELS[tournament.discipline] ?? tournament.discipline}</p>
          <p>👥 Мест свободно: {spots > 0 ? spots : '0'} из {tournament.participants_limit}</p>
          {tournament.entry_fee > 0
            ? <p>💰 Взнос: {tournament.entry_fee} ₽</p>
            : <p className="text-green-400">✅ Бесплатно</p>
          }
        </div>
      </div>
    </Link>
  )
}
