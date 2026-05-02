'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Step = 'email' | 'password' | 'otp'

export function SmartAuthForm() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  async function handleEmailNext() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/auth/check-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Ошибка сервера')
      setLoading(false)
      return
    }
    if (data.method === 'password') {
      setStep('password')
      setLoading(false)
    } else {
      await sendOtp()
    }
  }

  async function sendOtp() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
    } else {
      setStep('otp')
    }
    setLoading(false)
  }

  async function handlePasswordLogin() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleOtpVerify() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    if (error) {
      setError(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  function resetToEmail() {
    setStep('email')
    setPassword('')
    setOtp('')
    setError(null)
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <h1 className="text-2xl font-bold text-center text-white">Войти</h1>

      {step === 'email' && (
        <>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && email.includes('@') && !loading && handleEmailNext()}
            className="border border-slate-600 bg-slate-800 text-white rounded-lg px-4 py-3 text-lg"
          />
          <button
            onClick={handleEmailNext}
            disabled={loading || !email.includes('@')}
            className="bg-green-600 text-white rounded-lg px-4 py-3 font-semibold disabled:opacity-50"
          >
            {loading ? 'Проверяем...' : 'Далее →'}
          </button>
        </>
      )}

      {step === 'password' && (
        <>
          <p className="text-gray-400 text-sm text-center">{email}</p>
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && password.length > 0 && !loading && handlePasswordLogin()}
            autoFocus
            className="border border-slate-600 bg-slate-800 text-white rounded-lg px-4 py-3 text-lg"
          />
          <button
            onClick={handlePasswordLogin}
            disabled={loading || password.length === 0}
            className="bg-green-600 text-white rounded-lg px-4 py-3 font-semibold disabled:opacity-50"
          >
            {loading ? 'Входим...' : 'Войти'}
          </button>
          <button
            onClick={sendOtp}
            disabled={loading}
            className="text-gray-400 underline text-sm text-center"
          >
            Войти через код →
          </button>
          <button onClick={resetToEmail} className="text-gray-500 underline text-sm text-center">
            ← Изменить email
          </button>
        </>
      )}

      {step === 'otp' && (
        <>
          <p className="text-gray-400 text-center">Код отправлен на {email}</p>
          <input
            type="text"
            placeholder="Код из письма"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && otp.length >= 6 && !loading && handleOtpVerify()}
            maxLength={8}
            autoFocus
            className="border border-slate-600 bg-slate-800 text-white rounded-lg px-4 py-3 text-3xl text-center tracking-widest"
          />
          <button
            onClick={handleOtpVerify}
            disabled={loading || otp.length < 6}
            className="bg-green-600 text-white rounded-lg px-4 py-3 font-semibold disabled:opacity-50"
          >
            {loading ? 'Проверяем...' : 'Подтвердить'}
          </button>
          <button onClick={resetToEmail} className="text-gray-500 underline text-sm text-center">
            ← Изменить email
          </button>
        </>
      )}

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
    </div>
  )
}
