import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { BottomNav } from '@/components/ui/BottomNav'
import { cn } from '@/lib/utils'
import './globals.css'

const inter = Inter({ subsets: ['cyrillic', 'latin'] })

export const metadata: Metadata = {
  title: 'Виктория — Бильярдный клуб',
  description: 'Турниры по русскому бильярду в клубе Виктория',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Виктория' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={cn(inter.className, 'bg-bg-base text-text-primary pb-20')}>
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
