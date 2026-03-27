'use client'

import { useEffect, useState } from 'react'
import type { ChannelInfo, Video, ChannelMetrics, AIInsights } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { ChannelHeader } from '@/components/channel/ChannelHeader'
import { MetricCard } from '@/components/channel/MetricCard'
import { VideoTable } from '@/components/videos/VideoTable'
import { ViewsChart } from '@/components/charts/ViewsChart'
import { PerformanceDistribution } from '@/components/charts/PerformanceDistribution'
import { DurationVsViews } from '@/components/charts/DurationVsViews'
import { EngagementVsViews } from '@/components/charts/EngagementVsViews'
import { UploadFrequencyChart } from '@/components/charts/UploadFrequencyChart'
import { HeatmapGrid } from '@/components/charts/HeatmapGrid'
import { TitlePatterns } from '@/components/insights/TitlePatterns'
import { MomentumScoreWidget } from '@/components/insights/MomentumScore'
import { AIInsightsPanel } from '@/components/insights/AIInsightsPanel'
import { ContentGapDetector } from '@/components/insights/ContentGapDetector'
import { TopTakeaways } from '@/components/insights/TopTakeaways'
import { NicheBenchmark } from '@/components/insights/NicheBenchmark'
import { ShareButton } from '@/components/report/ShareButton'
import { useChannelTabs } from '@/lib/hooks/useChannelTabs'
import { useChannelCache } from '@/lib/context/ChannelCacheContext'
import { useRecentChannels } from '@/lib/context/RecentChannelsContext'
import { VideoDeepDive } from '@/components/videos/VideoDeepDive'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportToCSV } from '@/lib/utils'
import { toast } from 'sonner'
import { useWatchlist } from '@/lib/context/WatchlistContext'
import { useSettings } from '@/lib/context/SettingsContext'
import { useAuth } from '@/lib/context/AuthContext'
import { saveSnapshot, getPreviousSnapshot, type ChannelSnapshot } from '@/lib/snapshots'
import ChannelHistoryChart from '@/components/insights/ChannelHistoryChart'
import AnalysisDiff from '@/components/insights/AnalysisDiff'

interface ChannelData {
  channel: ChannelInfo
  videos: Video[]
  metrics: ChannelMetrics
}

export function AnalysisDashboard({ channelId }: { channelId: string }) {
  const channelCache = useChannelCache()
  const [data, setData] = useState<ChannelData | null>(() => channelCache.get(channelId) ?? null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(!channelCache.has(channelId))
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null)
  const [aiLoading, setAiLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [deepDiveOpen, setDeepDiveOpen] = useState(false)
  const [previousSnapshot, setPreviousSnapshot] = useState<ChannelSnapshot | null>(null)
  const { addTab } = useChannelTabs()
  const { addRecent } = useRecentChannels()
  const { updateLastAnalyzed } = useWatchlist()
  const { settings } = useSettings()
  const { user } = useAuth()

  useEffect(() => {
    // If cached, use it immediately — no fetch needed
    if (channelCache.has(channelId)) {
      const cached = channelCache.get(channelId)!
      setData(cached)
      setLoading(false)
      setError('')

      // Still update recent channels and tabs
      addRecent({
        channelId: cached.channel.id,
        title: cached.channel.title,
        handle: cached.channel.handle,
        thumbnailUrl: cached.channel.thumbnailUrl,
        subscriberCount: cached.channel.subscriberCount,
        analyzedAt: new Date().toISOString(),
      })
      addTab({
        channelId: cached.channel.id,
        title: cached.channel.title,
        handle: cached.channel.handle,
        thumbnailUrl: cached.channel.thumbnailUrl,
      })
      updateLastAnalyzed(
        cached.channel.id,
        cached.metrics.momentumScore,
        cached.metrics.momentumLabel
      )
      if (user) {
        getPreviousSnapshot(user.id, channelId).then(setPreviousSnapshot)
        saveSnapshot(user.id, cached.channel, cached.metrics)
      }
      return
    }

    // Not cached — fetch from API
    setLoading(true)
    setError('')

    async function fetchData() {
      try {
        const res = await fetch(
          `/api/channel?url=${encodeURIComponent(`https://www.youtube.com/channel/${channelId}`)}&maxVideos=${settings.videosToFetch}`
        )
        const json = await res.json()

        if (!res.ok) {
          setError(json.error || 'Failed to load channel data')
          setLoading(false)
          return
        }

        // Store in cache
        channelCache.set(channelId, json)
        setData(json)
        setLoading(false)

        // Save to recent channels
        addRecent({
          channelId: json.channel.id,
          title: json.channel.title,
          handle: json.channel.handle,
          thumbnailUrl: json.channel.thumbnailUrl,
          subscriberCount: json.channel.subscriberCount,
          analyzedAt: new Date().toISOString(),
        })

        // Add to tab bar
        addTab({
          channelId: json.channel.id,
          title: json.channel.title,
          handle: json.channel.handle,
          thumbnailUrl: json.channel.thumbnailUrl,
        })

        // Update watchlist entry if present
        updateLastAnalyzed(
          json.channel.id,
          json.metrics.momentumScore,
          json.metrics.momentumLabel
        )

        // Save snapshot and fetch previous for signed-in users
        if (user) {
          const prev = await getPreviousSnapshot(user.id, channelId)
          setPreviousSnapshot(prev)
          await saveSnapshot(user.id, json.channel, json.metrics)
        }
      } catch {
        setError('Network error — please try again')
        setLoading(false)
      }
    }
    fetchData()
  }, [channelId, addTab, channelCache, addRecent, updateLastAnalyzed, settings.videosToFetch, user])

  const videos = data?.videos ?? []
  const metrics = data?.metrics ?? null

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

  if (loading || !data || !metrics) {
    return <DashboardLoadingSkeleton />
  }

  const { channel } = data

  return (
    <div className="flex flex-col gap-6 fade-in">
      {user && previousSnapshot && data && (
        <AnalysisDiff
          current={{ channel: data.channel, metrics: data.metrics }}
          previous={previousSnapshot}
        />
      )}

      <ChannelHeader
        channel={channel}
        shareButton={<ShareButton channelId={channel.id} />}
      />

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
          tooltip="Likes plus comments divided by views, expressed as a percentage. Higher means a more active audience. Industry average is 3\u20134%."
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
          tooltip="Total views across all videos published or still accumulating views in the last 30 days."
        />
      </div>

      {/* Channel History — shows trends across analyses (signed-in only) */}
      <ChannelHistoryChart channelId={channelId} />

      {/* Momentum Score — channel-level, unfiltered */}
      <MomentumScoreWidget
        metrics={metrics}
        uploadDayCounts={computeUploadDayCounts(videos)}
      />

      {/* Niche Benchmark — channel-level, unfiltered */}
      <NicheBenchmark metrics={metrics} />

      {/* Row 1 — scatter + distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ViewsChart videos={videos} metrics={metrics} />
        <PerformanceDistribution videos={videos} />
      </div>

      {/* Row 2 — duration + engagement scatters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DurationVsViews videos={videos} />
        <EngagementVsViews videos={videos} />
      </div>

      {/* Row 3 — upload frequency */}
      <UploadFrequencyChart videos={videos} />

      {/* Row 4 — title patterns */}
      <TitlePatterns videos={videos} metrics={metrics} />

      {/* Top Takeaways */}
      <TopTakeaways videos={videos} metrics={metrics} />

      {/* Heatmap */}
      <HeatmapGrid videos={videos} bestDay={metrics.bestDayOfWeek} bestTime={metrics.bestTimeOfDay} />

      {/* AI Insights — uses all videos for prompt quality */}
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
      <VideoTable
        videos={videos}
        onRowClick={(video) => {
          setSelectedVideo(video)
          setDeepDiveOpen(true)
        }}
      />

      {/* Video Deep Dive */}
      <VideoDeepDive
        video={selectedVideo}
        metrics={metrics}
        open={deepDiveOpen}
        onOpenChange={setDeepDiveOpen}
      />

      {/* Export CSV floating button */}
      <div className="fixed bottom-6 right-6 z-20">
        <Button
          onClick={() => {
            exportToCSV(videos, channel.title)
            toast('CSV export started')
          }}
          className="gap-2"
          style={{ background: 'var(--accent)', color: '#ffffff' }}
        >
          <Download size={16} />
          Export CSV
        </Button>
      </div>
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
      {/* Channel Header */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>

      {/* Momentum Score */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-24" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Niche Benchmark */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-3">
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-[200px] w-full" />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>

      {/* Heatmap */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <Skeleton className="h-4 w-48 mb-4" />
        <Skeleton className="h-[180px] w-full" />
      </div>

      {/* AI Insights */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Video Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <Skeleton className="h-8 w-48" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-[var(--border-subtle)]">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
