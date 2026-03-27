import { Skeleton } from '@/components/ui/skeleton'

export function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <Skeleton className="h-[300px] w-full" />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    </div>
  )
}
