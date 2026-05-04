import { CardSkeleton } from '@/components/ui/LoadingSkeleton'

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="card animate-pulse space-y-2">
            <div className="h-8 bg-slate-700 rounded w-16" />
            <div className="h-4 bg-slate-700 rounded w-24" />
          </div>
        ))}
      </div>
      <CardSkeleton />
    </div>
  )
}
