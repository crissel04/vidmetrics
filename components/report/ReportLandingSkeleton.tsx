import { Skeleton } from '@/components/ui/skeleton'

/** Skeleton for the reports landing page (card grid). */
export function ReportLandingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 px-6 pt-2">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
