'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

type Discipline = 'svoyak' | 'pyramid' | 'combined'
type PaymentType = 'free' | 'cash' | 'online'

interface FormState {
  title: string
  date: string
  address: string
  tables_count: number
  discipline: Discipline
  participants_limit: 16 | 32 | 64
  wins_to_advance: 2 | 3
  time_limit_min: 45 | 60 | 90
  shot_clock_sec: number
  shot_clock_extension_sec: number
  entry_fee: number
  payment_type: PaymentType
  prize_description: string
}

export function TournamentForm({ userId }: { userId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<FormState>({
    title: '',
    date: '',
    address: '',
    tables_count: 4,
    discipline: 'pyramid',
    participants_limit: 16,
    wins_to_advance: 2,
    time_limit_min: 60,
    shot_clock_sec: 40,
    shot_clock_extension_sec: 20,
    entry_fee: 0,
    payment_type: 'free',
    prize_description: '',
  })

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('tournaments')
      .insert({
        title: form.title,
        date: new Date(form.date).toISOString(),
        address: form.address,
        tables_count: form.tables_count,
        discipline: form.discipline,
        participants_limit: form.participants_limit,
        wins_to_advance: form.wins_to_advance,
        time_limit_min: form.time_limit_min,
        shot_clock_sec: form.shot_clock_sec,
        shot_clock_extension_sec: form.shot_clock_extension_sec,
        entry_fee: form.entry_fee,
        payment_type: form.payment_type,
        prize_description: form.prize_description || null,
        organizer_id: userId,
        status: 'open' as const,
      })
      .select('id')
      .single()

    if (error) {
      setError(error.message)
    } else if (data) {
      router.push(`/tournaments/${data.id}`)
    }
    setLoading(false)
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={submit}>
      {/* Название */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Название турнира *</label>
        <input
          value={form.title}
          onChange={e => set('title', e.target.value)}
          required
          placeholder="Открытый кубок клуба"
          className="w-full border border-slate-600 bg-slate-800 text-white rounded-lg px-4 py-3"
        />
      </div>

      {/* Дата и столы */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Дата и время *</label>
          <input
            type="datetime-local"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            required
            className="w-full border border-slate-600 bg-slate-800 text-white rounded-lg px-4 py-3"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Столов</label>
          <input
            type="number"
            value={form.tables_count}
            min={1}
            max={20}
            onChange={e => set('tables_count', Number(e.target.value))}
            className="w-full border border-slate-600 bg-slate-800 text-white rounded-lg px-4 py-3"
          />
        </div>
      </div>

      {/* Адрес */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Адрес клуба *</label>
        <input
          value={form.address}
          onChange={e => set('address', e.target.value)}
          required
          placeholder="ул. Ленина, 1, бильярдный клуб «Чёрный шар»"
          className="w-full border border-slate-600 bg-slate-800 text-white rounded-lg px-4 py-3"
        />
      </div>

      {/* Дисциплина и участники */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Дисциплина</label>
          <select
            value={form.discipline}
            onChange={e => set('discipline', e.target.value as Discipline)}
            className="w-full border border-slate-600 bg-slate-800 text-white rounded-lg px-4 py-3"
          >
            <option value="pyramid">Пирамида</option>
            <option value="svoyak">Свояк</option>
            <option value="combined">Комбинированная</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Участников</label>
          <select
            value={form.participants_limit}
            onChange={e => set('participants_limit', Number(e.target.value) as 16 | 32 | 64)}
            className="w-full border border-slate-600 bg-slate-800 text-white rounded-lg px-4 py-3"
          >
            <option value={16}>16</option>
            <option value={32}>32</option>
            <option value={64}>64</option>
          </select>
        </div>
      </div>

      {/* Формат матча */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Побед в матче</label>
          <select
            value={form.wins_to_advance}
            onChange={e => set('wins_to_advance', Number(e.target.value) as 2 | 3)}
            className="w-full border border-slate-600 bg-slate-800 text-white rounded-lg px-4 py-3"
          >
            <option value={2}>До 2</option>
            <option value={3}>До 3</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Лимит матча</label>
          <select
            value={form.time_limit_min}
            onChange={e => set('time_limit_min', Number(e.target.value) as 45 | 60 | 90)}
            className="w-full border border-slate-600 bg-slate-800 text-white rounded-lg px-4 py-3"
          >
            <option value={45}>45 мин</option>
            <option value={60}>60 мин</option>
            <option value={90}>90 мин</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Шот-клок</label>
          <select
            value={form.shot_clock_sec}
            onChange={e => set('shot_clock_sec', Number(e.target.value))}
            className="w-full border border-slate-600 bg-slate-800 text-white rounded-lg px-4 py-3"
          >
            <option value={30}>30 сек</option>
            <option value={40}>40 сек</option>
            <option value={60}>60 сек</option>
          </select>
        </div>
      </div>

      {/* Взнос */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Взнос (₽)</label>
          <input
            type="number"
            value={form.entry_fee}
            min={0}
            onChange={e => set('entry_fee', Number(e.target.value))}
            className="w-full border border-slate-600 bg-slate-800 text-white rounded-lg px-4 py-3"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Способ оплаты</label>
          <select
            value={form.payment_type}
            onChange={e => set('payment_type', e.target.value as PaymentType)}
            className="w-full border border-slate-600 bg-slate-800 text-white rounded-lg px-4 py-3"
          >
            <option value="free">Бесплатно</option>
            <option value="cash">Наличными</option>
            <option value="online">Онлайн</option>
          </select>
        </div>
      </div>

      {/* Призы */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Призы (описание)</label>
        <textarea
          value={form.prize_description}
          onChange={e => set('prize_description', e.target.value)}
          placeholder="1 место — кубок + 5000 ₽, 2 место — медаль..."
          rows={3}
          className="w-full border border-slate-600 bg-slate-800 text-white rounded-lg px-4 py-3 resize-none"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Создаём...' : 'Создать турнир'}
      </Button>
    </form>
  )
}
