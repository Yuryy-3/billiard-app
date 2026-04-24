'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Step = 'phone' | 'otp'

export function OtpForm() {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  async function sendOtp() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) {
      setError(error.message)
    } else {
      setStep('otp')
    }
    setLoading(false)
  }

  async function verifyOtp() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    })
    if (error) {
      setError(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <h1 className="text-2xl font-bold text-center text-white">Войти</h1>

      {step === 'phone' ? (
        <>
          <input
            type="tel"
            placeholder="+7 (999) 123-45-67"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="border border-slate-600 bg-slate-800 text-white rounded-lg px-4 py-3 text-lg"
          />
          <button
            onClick={sendOtp}
            disabled={loading || phone.length < 10}
            className="bg-green-600 text-white rounded-lg px-4 py-3 font-semibold disabled:opacity-50"
          >
            {loading ? 'Отправляем...' : 'Получить код'}
          </button>
        </>
      ) : (
        <>
          <p className="text-gray-400 text-center">Код отправлен на {phone}</p>
          <input
            type="text"
            placeholder="Код из SMS"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            maxLength={6}
            className="border border-slate-600 bg-slate-800 text-white rounded-lg px-4 py-3 text-lg text-center tracking-widest"
          />
          <button
            onClick={verifyOtp}
            disabled={loading || otp.length < 6}
            className="bg-green-600 text-white rounded-lg px-4 py-3 font-semibold disabled:opacity-50"
          >
            {loading ? 'Проверяем...' : 'Войти'}
          </button>
          <button
            onClick={() => { setStep('phone'); setOtp(''); setError(null) }}
            className="text-gray-400 underline text-sm"
          >
            Изменить номер
          </button>
        </>
      )}

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
    </div>
  )
}
