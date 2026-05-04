export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-slate-700 rounded w-full" />
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="card animate-pulse space-y-3">
      <div className="h-5 bg-slate-700 rounded w-3/4" />
      <div className="h-4 bg-slate-700 rounded w-1/2" />
      <div className="h-4 bg-slate-700 rounded w-2/3" />
    </div>
  )
}
