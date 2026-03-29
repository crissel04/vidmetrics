import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Overrides default `bg-muted` (same as page bg in light) so blocks read on `--bg-app`. */
const skOnCanvas = '!bg-[var(--skeleton-on-canvas)]'

/** Matches `ChannelHeader` layout (avatar, title, handle, stat pills, actions). */
export function ChannelHeaderSkeleton() {
  return (
    <div
      className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      role="status"
      aria-label="Loading channel header"
    >
      <div className="flex min-w-0 items-center gap-4">
        <Skeleton className={cn('h-16 w-16 shrink-0 rounded-full', skOnCanvas)} />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className={cn('h-8 w-64 max-w-full rounded-md', skOnCanvas)} />
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <Skeleton className={cn('h-4 w-40 max-w-full rounded-md', skOnCanvas)} />
            <Skeleton className={cn('h-6 w-6 shrink-0 rounded-md', skOnCanvas)} />
          </div>
          <div className="flex flex-wrap gap-4 pt-1">
            <Skeleton className={cn('h-4 w-28 rounded-md', skOnCanvas)} />
            <Skeleton className={cn('h-4 w-24 rounded-md', skOnCanvas)} />
            <Skeleton className={cn('h-4 w-28 rounded-md', skOnCanvas)} />
          </div>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Skeleton className={cn('h-8 w-[5.5rem] rounded-md', skOnCanvas)} />
        <Skeleton className={cn('h-8 w-28 rounded-md', skOnCanvas)} />
        <Skeleton className={cn('h-8 w-24 rounded-md', skOnCanvas)} />
      </div>
    </div>
  )
}
