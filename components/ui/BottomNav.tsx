'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/',        label: 'Турниры',   icon: '🏆' },
  { href: '/matches', label: 'Мои матчи', icon: '⚔️' },
  { href: '/profile', label: 'Профиль',   icon: '👤' },
  { href: '/archive', label: 'Архив',     icon: '📋' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-card border-t border-bg-base pb-safe">
      <div className="flex">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 py-3 relative"
            >
              <span className="text-xl">{icon}</span>
              <span className={cn(
                'text-xs',
                active ? 'text-accent-orange font-semibold' : 'text-text-secondary'
              )}>
                {label}
              </span>
              {active && (
                <span className="absolute top-0 w-8 h-0.5 bg-accent-orange rounded-b" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
