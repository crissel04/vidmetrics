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

/** Content width only — sidebar + top bar come from root layout (no duplicate in-page header). */
export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-6">
      {children}
    </div>
  )
}
