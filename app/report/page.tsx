import { Suspense } from 'react'
import { ReportPageContent } from '@/components/report/ReportPageContent'
import { ReportLandingSkeleton } from '@/components/report/ReportLandingSkeleton'

export default function ReportPage() {
  return (
    <Suspense fallback={<ReportLandingSkeleton />}>
      <ReportPageContent />
    </Suspense>
  )
}
