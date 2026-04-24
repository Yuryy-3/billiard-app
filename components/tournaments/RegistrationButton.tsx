'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface Props {
  tournamentId: string
  userId: string | null
  isRegistered: boolean
  paymentType: string
  entryFee: number
}

export function RegistrationButton({ tournamentId, userId, isRegistered, paymentType, entryFee }: Props) {
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(isRegistered)
  const supabase = createClient()
  const router = useRouter()

  if (!userId) {
    return (
      <Button onClick={() => router.push('/auth')} className="w-full">
        Войти для записи
      </Button>
    )
  }

  if (registered) {
    return (
      <Button variant="secondary" className="w-full" disabled>
        Вы записаны ✓
      </Button>
    )
  }

  async function register() {
    setLoading(true)
    const paymentStatus = paymentType === 'online' ? 'pending' : 'cash'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('registrations').insert({
      tournament_id: tournamentId,
      user_id: userId!,
      payment_status: paymentStatus,
    })
    if (!error) {
      setRegistered(true)
      router.refresh()
    }
    setLoading(false)
  }

  const label = entryFee > 0
    ? `Записаться · ${entryFee} ₽`
    : 'Записаться бесплатно'

  return (
    <Button onClick={register} disabled={loading} className="w-full">
      {loading ? 'Записываем...' : label}
    </Button>
  )
}
