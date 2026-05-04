import { CardSkeleton, LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

export default function Loading() {
  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-4">
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-700 animate-pulse shrink-0" />
        <LoadingSkeleton lines={2} />
      </div>
      <CardSkeleton />
      <CardSkeleton />
    </main>
  )
}
