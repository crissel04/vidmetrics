'use client'

import { useEffect, useState } from 'react'
import type { ChannelInfo, Video, ChannelMetrics, AIInsights } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { ChannelHeader } from '@/components/channel/ChannelHeader'
import { MetricCard } from '@/components/channel/MetricCard'
import { VideoTable } from '@/components/videos/VideoTable'
import { ViewsChart } from '@/components/charts/ViewsChart'
import { EngagementChart } from '@/components/charts/EngagementChart'
import { HeatmapGrid } from '@/components/charts/HeatmapGrid'
import { MomentumScoreWidget } from '@/components/insights/MomentumScore'
import { AIInsightsPanel } from '@/components/insights/AIInsightsPanel'
import { ContentGapDetector } from '@/components/insights/ContentGapDetector'

interface ChannelData {
  channel: ChannelInfo
  videos: Video[]
  metrics: ChannelMetrics
}

export function AnalysisDashboard({ channelId }: { channelId: string }) {
  const [data, setData] = useState<ChannelData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null)
  const [aiLoading, setAiLoading] = useState(true)

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
      <ChannelHeader channel={channel} />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Avg Views / Video"
          value={metrics.avgViews}
          trend={metrics.viewsGrowthPct}
          trendLabel="vs prior"
        />
        <MetricCard
          label="Avg Engagement Rate"
          value={Math.round(metrics.avgEngagementRate * 100)}
          format="percent"
        />
        <MetricCard
          label="Upload Frequency"
          value={0}
          format="string"
          stringValue={metrics.uploadFrequency}
        />
        <MetricCard
          label="Views Last 30d"
          value={metrics.totalViewsLast30d}
          trend={metrics.viewsGrowthPct}
        />
      </div>

      {/* Momentum Score */}
      <MomentumScoreWidget
        metrics={metrics}
        uploadDayCounts={computeUploadDayCounts(videos)}
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ViewsChart videos={videos} />
        <EngagementChart videos={videos} avgEngagementRate={metrics.avgEngagementRate} />
      </div>

      {/* Heatmap */}
      <HeatmapGrid videos={videos} bestDay={metrics.bestDayOfWeek} bestTime={metrics.bestTimeOfDay} />

      {/* AI Insights */}
      <AIInsightsPanel
        channel={channel}
        videos={videos}
        metrics={metrics}
        onInsightsLoaded={(insights) => {
          setAiInsights(insights)
          setAiLoading(false)
        }}
      />

      {/* Content Gap Detector */}
      <ContentGapDetector insights={aiInsights} loading={aiLoading} />

      {/* Video Table */}
      <VideoTable videos={videos} />
    </div>
  )
}

function computeUploadDayCounts(videos: Video[]): Record<number, number> {
  const counts: Record<number, number> = {}
  for (const v of videos) {
    const day = (new Date(v.publishedAt).getUTCDay() + 6) % 7 // 0=Mon
    counts[day] = (counts[day] ?? 0) + 1
  }
  return counts
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
