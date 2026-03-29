'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FileText, Trash2, ExternalLink, ArrowRight, LayoutGrid, List } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'
import AuthModal from '@/components/auth/AuthModal'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/utils'
import { useReportsHistory, type ReportEntry } from '@/lib/context/ReportsHistoryContext'
import { useSettings } from '@/lib/context/SettingsContext'
import type { ChannelInfo, Video, ChannelMetrics } from '@/lib/types'
import { ChannelAnalysisView } from '@/components/analysis/ChannelAnalysisView'
import { AnalysisPageBodySkeleton } from '@/components/analysis/AnalysisPageSkeleton'
import { ChannelHeaderSkeleton } from '@/components/channel/ChannelHeaderSkeleton'
import { ShareButton } from '@/components/report/ShareButton'

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
  const { user } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center fade-in">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-app)' }}
        >
          <FileText size={24} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div className="space-y-1.5">
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            No reports yet
          </h2>
          <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
            Analyze a channel and click Share to create a shareable report link. It will appear here.
          </p>
        </div>
        <Link href="/">
          <Button
            className="mt-2 h-10 cursor-pointer gap-1.5 px-4 text-sm font-medium border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.2)] transition-shadow duration-300 ease-out hover:shadow-[inset_0_2px_14px_rgba(255,255,255,0.18),inset_0_-3px_16px_rgba(0,0,0,0.22)]"
            style={{ background: 'var(--accent)', color: '#ffffff' }}
          >
            Analyze a channel
            <ArrowRight size={14} className="shrink-0" aria-hidden />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 pt-2 sm:px-6 fade-in">
      {!user && (
        <>
          <div
            className="flex items-center justify-between p-3 rounded-lg border"
            style={{ background: 'var(--accent-subtle)', borderColor: 'var(--accent)' }}
          >
            <p className="text-sm" style={{ color: 'var(--accent-text)' }}>
              Sign in to sync your reports across devices
            </p>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5"
              style={{ borderColor: 'var(--accent)' }}
              onClick={() => setAuthOpen(true)}
            >
              Sign in
            </Button>
          </div>
          <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
        </>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-semibold text-2xl"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Reports
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {reports.length} shared report{reports.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div
          className="flex items-center rounded-lg border p-0.5"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            onClick={() => setViewMode('card')}
            className="rounded-md p-1.5 transition-colors"
            style={{
              background: viewMode === 'card' ? 'var(--bg-app)' : 'transparent',
              color: viewMode === 'card' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="rounded-md p-1.5 transition-colors"
            style={{
              background: viewMode === 'list' ? 'var(--bg-app)' : 'transparent',
              color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      <div className={viewMode === 'card' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
        {reports.map((report) => (
          <ReportCard key={report.channelId} report={report} onRemove={removeReport} viewMode={viewMode} />
        ))}
      </div>
    </div>
  )
}

function ReportCard({
  report,
  onRemove,
  viewMode = 'card',
}: {
  report: ReportEntry
  onRemove: (channelId: string) => void
  viewMode?: 'card' | 'list'
}) {
  const timeAgo = formatDistanceToNow(new Date(report.sharedAt), { addSuffix: true })

  if (viewMode === 'list') {
    return (
      <Link
        href={`/report?channelId=${report.channelId}`}
        className="block rounded-xl border bg-[var(--bg-card)] p-4 transition-colors duration-150 hover:bg-[var(--bg-app)]"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-4">
          <Avatar className="h-9 w-9 shrink-0">
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
          <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
            Shared {timeAgo}
          </span>
          <span
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.2)]"
            style={{ background: 'var(--accent)', color: '#ffffff' }}
          >
            View report
            <ArrowRight size={12} className="shrink-0" aria-hidden />
          </span>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(report.channelId) }}
            className="p-1 rounded transition-colors duration-150 shrink-0"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red-text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </Link>
    )
  }

  const gridLine = 'color-mix(in srgb, var(--border-strong) 32%, transparent)'

  return (
    <Link
      href={`/report?channelId=${report.channelId}`}
      className="relative block overflow-hidden rounded-xl border bg-[var(--bg-card)] transition-colors duration-150 hover:bg-[var(--bg-app)]"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Grid lines */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(to right, ${gridLine} 1px, transparent 1px),
            linear-gradient(to bottom, ${gridLine} 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black)',
          maskImage: 'linear-gradient(to bottom, transparent, black)',
        }}
      />
      <div className="relative z-[1] flex flex-col p-4 space-y-3">
        {/* Top row: avatar + name + delete */}
        <div className="flex items-start gap-3">
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
              {report.handle}
            </p>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(report.channelId) }}
            className="shrink-0 p-1 rounded transition-colors duration-150"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red-text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Subscriber count */}
        <p
          className="text-lg font-bold tabular-nums"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          {formatNumber(report.subscriberCount)}
          <span className="ml-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>subscribers</span>
        </p>

        {/* Shared time */}
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Shared {timeAgo}
        </p>

        {/* View report button */}
        <div className="pt-1">
          <span
            className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.2)] transition-shadow duration-300 ease-out hover:shadow-[inset_0_2px_14px_rgba(255,255,255,0.18),inset_0_-3px_16px_rgba(0,0,0,0.22)]"
            style={{ background: 'var(--accent)', color: '#ffffff' }}
          >
            View report
            <ArrowRight size={14} className="shrink-0" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ─── Report fetcher: loads and renders a single report ─── */

function ReportFetcher({ channelId }: { channelId: string }) {
  const { settings } = useSettings()
  const [data, setData] = useState<ChannelData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(
      `/api/channel?url=${encodeURIComponent(`https://www.youtube.com/channel/${channelId}`)}&maxVideos=${settings.videosToFetch}`
    )
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
  }, [channelId, settings.videosToFetch])

  if (loading) {
    return (
      <div className="flex flex-col gap-8" aria-busy="true">
        <ChannelHeaderSkeleton />
        <AnalysisPageBodySkeleton />
      </div>
    )
  }

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
    <ChannelAnalysisView
      channel={channel}
      videos={videos}
      metrics={metrics}
      shareButton={<ShareButton channelId={channel.id} />}
    />
  )
}
