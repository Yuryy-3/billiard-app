import { CardSkeleton } from '@/components/ui/LoadingSkeleton'

export default function Loading() {
  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-4">
      <div className="h-7 bg-slate-700 rounded w-40 animate-pulse" />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </main>
  )
}
