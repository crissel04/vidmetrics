'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { decodeReportData } from '@/lib/shareLink'
import { formatNumber, formatDate } from '@/lib/utils'
import type { ChannelInfo, Video, ChannelMetrics } from '@/lib/types'
import { ViewsChart } from '@/components/charts/ViewsChart'
import { EngagementChart } from '@/components/charts/EngagementChart'
import { NicheBenchmark } from '@/components/insights/NicheBenchmark'
import { TopTakeaways } from '@/components/insights/TopTakeaways'
import { ReportSkeleton } from '@/components/report/ReportSkeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ReportData {
  channel: ChannelInfo
  videos: Video[]
  metrics: ChannelMetrics
  generatedAt: string
}

export function ReportPageContent() {
  const searchParams = useSearchParams()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const raw = searchParams.get('data')
    console.log('[Report] Raw data param:', raw ? raw.substring(0, 50) + '...' : 'NULL')

    if (!raw) {
      setError('No report data found in this URL.')
      return
    }

    try {
      const parsed = decodeReportData<ReportData>(raw)
      console.log('[Report] Decoded:', parsed ? 'OK' : 'NULL')

      if (!parsed) throw new Error('Decompression returned null — URL may be truncated or corrupted')
      if (!parsed.channel || !parsed.videos || !parsed.metrics) {
        throw new Error('Report data is missing required fields')
      }

      setReportData(parsed)
    } catch (err) {
      console.error('[Report] Decode error:', err)
      const message = err instanceof Error ? err.message : 'This report link is invalid or corrupted.'
      setError(message)
    }
  }, [searchParams])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Could not load report</p>
        <p className="text-sm text-center max-w-md" style={{ color: 'var(--text-secondary)' }}>
          {error}
        </p>
        <a href="/" className="text-sm underline" style={{ color: 'var(--accent)' }}>
          Go back to VidMetrics
        </a>
      </div>
    )
  }

  if (!reportData) return <ReportSkeleton />

  const { channel, videos, metrics, generatedAt } = reportData

  return (
    <div className="flex flex-col gap-6">
      {/* Report header */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          VidMetrics Report
        </p>
        <h1
          className="text-2xl font-bold mt-2"
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
          Generated {formatDate(generatedAt || new Date().toISOString())}
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

      {/* Video table — read-only */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Videos ({videos.length})
        </h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Likes</TableHead>
                <TableHead className="text-right">Comments</TableHead>
                <TableHead className="text-right">Published</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="max-w-[300px] truncate font-medium">{v.title}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(v.viewCount)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(v.likeCount)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(v.commentCount)}</TableCell>
                  <TableCell className="text-right">{formatDate(v.publishedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs py-4" style={{ color: 'var(--text-muted)' }}>
        Powered by VidMetrics
      </p>
    </div>
  )
}
