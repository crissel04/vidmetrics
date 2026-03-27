import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VidMetrics Report',
  description: 'YouTube channel performance report — powered by VidMetrics',
  openGraph: {
    title: 'VidMetrics — Channel Report',
    description: 'YouTube channel performance report with metrics, charts, and AI insights.',
    type: 'website',
  },
}

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
