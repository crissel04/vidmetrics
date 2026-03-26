import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { AnalysisDashboard } from './AnalysisDashboard'

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ channelId: string }>
}) {
  const { channelId } = await params

  return (
    <div className="max-w-[1280px] mx-auto w-full">
      <Suspense fallback={<DashboardSkeleton />}>
        <AnalysisDashboard channelId={channelId} />
      </Suspense>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Channel header skeleton */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>

      {/* Metrics row skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-3">
        <Skeleton className="h-4 w-24" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}
