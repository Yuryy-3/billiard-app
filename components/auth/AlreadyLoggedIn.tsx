'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  email: string
}

export function AlreadyLoggedIn({ email }: Props) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm text-center">
      <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl">
        👤
      </div>
      <p className="text-gray-400">Вы уже вошли</p>
      <p className="text-white font-medium">{email}</p>
      <button
        onClick={() => router.push('/')}
        className="w-full bg-green-600 text-white rounded-lg px-4 py-3 font-semibold"
      >
        На главную →
      </button>
      <button
        onClick={handleSignOut}
        className="text-gray-400 underline text-sm"
      >
        Выйти из аккаунта
      </button>
    </div>
  )
}
