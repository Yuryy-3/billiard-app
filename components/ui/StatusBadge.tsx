import { cn } from '@/lib/utils'

type Status = 'open' | 'ongoing' | 'finished' | 'draft' | 'closed'

const STATUS_MAP: Record<Status, { label: string; className: string }> = {
  open:     { label: 'ОТКРЫТ',   className: 'bg-accent-green text-white' },
  ongoing:  { label: 'ИДЁТ',     className: 'bg-accent-orange text-white' },
  finished: { label: 'ЗАВЕРШЁН', className: 'text-text-secondary border border-text-secondary' },
  draft:    { label: 'ЧЕРНОВИК', className: 'text-text-secondary border border-text-secondary' },
  closed:   { label: 'ЗАКРЫТ',   className: 'text-text-secondary border border-text-secondary' },
}

export function StatusBadge({ status }: { status: Status }) {
  const { label, className } = STATUS_MAP[status]
  return (
    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', className)}>
      {label}
    </span>
  )
}
