import { Suspense } from 'react'
import { AnalysisPageSkeleton } from '@/components/analysis/AnalysisPageSkeleton'
import { AnalysisDashboard } from './AnalysisDashboard'

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ channelId: string }>
}) {
  const { channelId } = await params

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pt-4 sm:px-6 sm:pt-6">
      <Suspense fallback={<AnalysisPageSkeleton />}>
        <AnalysisDashboard key={channelId} channelId={channelId} />
      </Suspense>
    </div>
  )
}
