import { AnalysisPageBodySkeleton } from '@/components/analysis/AnalysisPageSkeleton'
import { ChannelHeaderSkeleton } from '@/components/channel/ChannelHeaderSkeleton'

/** Matches analysis dashboard loading (Suspense / initial paint). */
export function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true">
      <ChannelHeaderSkeleton />
      <AnalysisPageBodySkeleton />
    </div>
  )
}
