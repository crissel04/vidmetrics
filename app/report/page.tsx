import { Suspense } from 'react'
import { ReportPageContent } from '@/components/report/ReportPageContent'
import { ReportSkeleton } from '@/components/report/ReportSkeleton'

export default function ReportPage() {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <ReportPageContent />
    </Suspense>
  )
}
