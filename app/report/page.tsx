'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { decodeReportData } from '@/lib/shareLink'
import { formatNumber, formatDate } from '@/lib/utils'
import type { ChannelInfo, Video, ChannelMetrics } from '@/lib/types'
import { ViewsChart } from '@/components/charts/ViewsChart'
import { EngagementChart } from '@/components/charts/EngagementChart'
import { NicheBenchmark } from '@/components/insights/NicheBenchmark'
import { TopTakeaways } from '@/components/insights/TopTakeaways'

interface ReportData {
  channel: ChannelInfo
  videos: Video[]
  metrics: ChannelMetrics
}

function ReportContent() {
  const searchParams = useSearchParams()
  const dataParam = searchParams.get('data')

  if (!dataParam) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          No report data found
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          This link doesn&apos;t contain valid report data. Try generating a new share link.
        </p>
      </div>
    )
  }

  const data = decodeReportData<ReportData>(dataParam)

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          Invalid report data
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Could not decode this report. The link may be corrupted.
        </p>
      </div>
    )
  }

  const { channel, videos, metrics } = data

  return (
    <div className="max-w-[1280px] mx-auto w-full flex flex-col gap-6">
      {/* Report header */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
          VidMetrics Report
        </p>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {channel.title}
        </h1>
        {channel.handle && (
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {channel.handle}
          </p>
        )}
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          Generated {formatDate(new Date().toISOString())}
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Subscribers', value: formatNumber(channel.subscriberCount) },
          { label: 'Avg Views', value: formatNumber(metrics.avgViews) },
          { label: 'Engagement', value: `${metrics.avgEngagementRate.toFixed(2)}%` },
          { label: 'Momentum', value: `${metrics.momentumScore}/100` },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
            <p className="text-xl font-bold tabular-nums mt-1" style={{ fontFamily: 'var(--font-display)' }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      <NicheBenchmark metrics={metrics} />
      <TopTakeaways videos={videos} metrics={metrics} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ViewsChart videos={videos} />
        <EngagementChart videos={videos} avgEngagementRate={metrics.avgEngagementRate} />
      </div>

      {/* Footer */}
      <p className="text-center text-xs py-4" style={{ color: 'var(--text-muted)' }}>
        Powered by VidMetrics
      </p>
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center" style={{ color: 'var(--text-muted)' }}>Loading report...</div>}>
      <ReportContent />
    </Suspense>
  )
}
