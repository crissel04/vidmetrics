'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FileText, Trash2, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatNumber, formatDate } from '@/lib/utils'
import { useReportsHistory, type ReportEntry } from '@/lib/context/ReportsHistoryContext'
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
  const channelId = searchParams.get('channelId')

  if (!channelId) {
    return <ReportLandingPage />
  }

  return <ReportFetcher channelId={channelId} />
}

/* ─── Landing page: shows reports history ─── */

function ReportLandingPage() {
  const { reports, removeReport } = useReportsHistory()

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center fade-in">
        <FileText size={48} style={{ color: 'var(--text-muted)' }} />
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          No reports yet
        </h2>
        <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
          Analyze a channel and click Share to create a shareable report link. It will appear here.
        </p>
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}
          >
            Analyze a channel
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Your reports
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Click any report to view it. Share the link to send it to anyone.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => (
          <ReportCard key={report.channelId} report={report} onRemove={removeReport} />
        ))}
      </div>
    </div>
  )
}

function ReportCard({
  report,
  onRemove,
}: {
  report: ReportEntry
  onRemove: (channelId: string) => void
}) {
  const timeAgo = formatDistanceToNow(new Date(report.sharedAt), { addSuffix: true })

  return (
    <Link
      href={`/report?channelId=${report.channelId}`}
      className="block rounded-xl border bg-[var(--bg-card)] p-4 transition-colors duration-150 hover:bg-[var(--bg-app)]"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={report.thumbnailUrl} alt={report.channelTitle} />
          <AvatarFallback
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', fontSize: '11px' }}
          >
            {report.channelTitle.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {report.channelTitle}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {report.handle} · {formatNumber(report.subscriberCount)} subs
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Shared {timeAgo}
        </p>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded"
            style={{ color: 'var(--accent-text)' }}
          >
            View report
            <ExternalLink size={11} />
          </span>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemove(report.channelId)
            }}
            className="p-1 rounded transition-colors duration-150"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red-text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </Link>
  )
}

/* ─── Report fetcher: loads and renders a single report ─── */

function ReportFetcher({ channelId }: { channelId: string }) {
  const [data, setData] = useState<ChannelData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
  }, [channelId])

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
