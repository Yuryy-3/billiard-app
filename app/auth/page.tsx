import Image from 'next/image'
import { OtpForm } from '@/components/auth/OtpForm'

export default function AuthPage() {
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
      <OtpForm />
    </main>
  )
}
