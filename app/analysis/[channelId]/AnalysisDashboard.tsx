'use client'

import { useEffect, useState } from 'react'
import type { ChannelInfo, Video, ChannelMetrics } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

interface ChannelData {
  channel: ChannelInfo
  videos: Video[]
  metrics: ChannelMetrics
}

export function AnalysisDashboard({ channelId }: { channelId: string }) {
  const [data, setData] = useState<ChannelData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          `/api/channel?url=${encodeURIComponent(`https://www.youtube.com/channel/${channelId}`)}`
        )
        const json = await res.json()

        if (!res.ok) {
          setError(json.error || 'Failed to load channel data')
          setLoading(false)
          return
        }

        setData(json)
        setLoading(false)
      } catch {
        setError('Network error — please try again')
        setLoading(false)
      }
    }
    fetchData()
  }, [channelId])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p style={{ color: 'var(--red-text)' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--accent)', color: '#ffffff' }}
        >
          Try again
        </button>
      </div>
    )
  }

  if (loading || !data) {
    return <DashboardLoadingSkeleton />
  }

  const { channel, videos, metrics } = data

  return (
    <div className="flex flex-col gap-6 fade-in">
      {/* Channel Header — built in Step 13 */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <div className="flex items-center gap-4">
          {channel.thumbnailUrl && (
            <img
              src={channel.thumbnailUrl}
              alt={channel.title}
              className="h-16 w-16 rounded-full object-cover"
            />
          )}
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {channel.title}
            </h1>
            {channel.handle && (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {channel.handle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row placeholder — built in Step 13 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricPlaceholder label="Avg Views / Video" value={metrics.avgViews} />
        <MetricPlaceholder label="Avg Engagement Rate" value={`${metrics.avgEngagementRate}%`} />
        <MetricPlaceholder label="Upload Frequency" value={metrics.uploadFrequency} />
        <MetricPlaceholder label="Views Last 30d" value={metrics.totalViewsLast30d} />
      </div>

      {/* Charts placeholder — built in Step 15 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Views chart — built in Step 15
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Engagement chart — built in Step 15
          </p>
        </div>
      </div>

      {/* Video table placeholder — built in Step 14 */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
          {videos.length} videos loaded
        </p>
        <div className="space-y-2">
          {videos.slice(0, 5).map((v) => (
            <div key={v.id} className="flex items-center gap-3 py-2 border-b border-[var(--border-subtle)]">
              <span className="text-sm truncate flex-1">{v.title}</span>
              <span className="text-sm tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                {v.viewCount.toLocaleString()} views
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MetricPlaceholder({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <p
        className="text-2xl font-bold mt-1 tabular-nums"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  )
}

function DashboardLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
