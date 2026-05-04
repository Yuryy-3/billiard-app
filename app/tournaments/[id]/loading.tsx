import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

export default function Loading() {
  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-4">
      <div className="h-8 bg-slate-700 rounded w-56 animate-pulse" />
      <div className="card space-y-3">
        <LoadingSkeleton lines={5} />
      </div>
      <div className="h-12 bg-slate-700 rounded animate-pulse" />
    </main>
  )
}
