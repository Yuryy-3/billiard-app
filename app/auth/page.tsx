import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { SmartAuthForm } from '@/components/auth/SmartAuthForm'
import { AlreadyLoggedIn } from '@/components/auth/AlreadyLoggedIn'

export default async function AuthPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4 gap-8">
      <Image
        src="/logo.png"
        alt="Бильярдный клуб Виктория"
        width={280}
        height={180}
        className="object-contain"
        priority
      />
      {user ? <AlreadyLoggedIn email={user.email ?? ''} /> : <SmartAuthForm />}
    </main>
  )
}
