'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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

interface ChannelData {
  channel: ChannelInfo
  videos: Video[]
  metrics: ChannelMetrics
}

export function ReportPageContent() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<ChannelData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      setError('No channel specified in this report link.')
      setLoading(false)
      return
    }

    fetch(`/api/channel?url=${encodeURIComponent(`https://www.youtube.com/channel/${channelId}`)}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error ?? `Failed to load channel (${res.status})`)
        }
        return res.json()
      })
      .then((json) => {
        if (!json.channel || !json.videos || !json.metrics) {
          throw new Error('Incomplete data received from server')
        }
        setData({
          channel: json.channel,
          videos: json.videos,
          metrics: json.metrics,
        })
      })
      .catch((err) => {
        console.error('[Report] Fetch error:', err)
        setError(err.message ?? 'Could not load this report.')
      })
      .finally(() => setLoading(false))
  }, [searchParams])

  if (loading) return <ReportSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 p-8 text-center">
        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
          Could not load report
        </p>
        <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
          {error}
        </p>
        <a href="/" className="text-sm hover:underline" style={{ color: 'var(--accent)' }}>
          Go back to VidMetrics
        </a>
      </div>
    )
  }

  if (!data) return null

  const { channel, videos, metrics } = data

  return (
    <div className="flex flex-col gap-6 fade-in">
      {/* Report header */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <div className="flex items-center gap-2">
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            VidMetrics Report
          </p>
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
          >
            Live data
          </span>
        </div>
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
