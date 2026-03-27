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
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <header
        className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}
      >
        <span style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          <span className="font-normal">Vid</span>
          <span className="font-medium">Metrics</span>
        </span>
        <a
          href="/"
          className="text-sm hover:underline"
          style={{ color: 'var(--accent)' }}
        >
          Analyze a channel →
        </a>
      </header>
      <main className="max-w-[1280px] mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
