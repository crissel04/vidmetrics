'use client'

import { useMemo, useState, type ReactNode } from 'react'
import type { ChannelInfo, Video, ChannelMetrics, AIInsights } from '@/lib/types'
import { ChannelHeader } from '@/components/channel/ChannelHeader'
import { MetricCard } from '@/components/channel/MetricCard'
import { VideoTable } from '@/components/videos/VideoTable'
import { ViewsChart } from '@/components/charts/ViewsChart'
import { PerformanceDistribution } from '@/components/charts/PerformanceDistribution'
import { DurationVsViews } from '@/components/charts/DurationVsViews'
import { EngagementVsViews } from '@/components/charts/EngagementVsViews'
import { UploadFrequencyChart } from '@/components/charts/UploadFrequencyChart'
import { HeatmapGrid } from '@/components/charts/HeatmapGrid'
import { ContentInsights } from '@/components/insights/ContentInsights'
import { MomentumScoreWidget } from '@/components/insights/MomentumScore'
import { AIInsightsPanel } from '@/components/insights/AIInsightsPanel'
import { ContentGapDetector } from '@/components/insights/ContentGapDetector'
import { NicheBenchmark } from '@/components/insights/NicheBenchmark'
import { AnalysisSection } from '@/components/analysis/AnalysisSection'
import { VideoDeepDive } from '@/components/videos/VideoDeepDive'
import { Download, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { exportToCSV } from '@/lib/utils'
import { toast } from 'sonner'

function filterVideosByPublishedWindow(videos: Video[], window: 'all' | '30d' | '90d'): Video[] {
  if (window === 'all') return videos
  const now = Date.now()
  const days = window === '30d' ? 30 : 90
  const cutoff = now - days * 24 * 60 * 60 * 1000
  return videos.filter(v => new Date(v.publishedAt).getTime() >= cutoff)
}

export interface ChannelAnalysisViewProps {
  channel: ChannelInfo
  videos: Video[]
  metrics: ChannelMetrics
  shareButton?: ReactNode
  /** When false, hides CSV export in the video library header (e.g. optional embeds). */
  showVideoLibraryExport?: boolean
}

export function ChannelAnalysisView({
  channel,
  videos,
  metrics,
  shareButton,
  showVideoLibraryExport = true,
}: ChannelAnalysisViewProps) {
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null)
  const [aiLoading, setAiLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [deepDiveOpen, setDeepDiveOpen] = useState(false)
  const [videoPerfTab, setVideoPerfTab] = useState('table')
  const [videoTimeFilter, setVideoTimeFilter] = useState<'all' | '30d' | '90d'>('all')
  const [videoSearch, setVideoSearch] = useState('')

  const videosTabAll = useMemo(
    () => filterVideosByPublishedWindow(videos, videoTimeFilter),
    [videos, videoTimeFilter]
  )
  const videosTabTop = useMemo(
    () =>
      filterVideosByPublishedWindow(
        [...videos]
          .filter(v => v.performanceTier === 'hot' || v.performanceTier === 'rising')
          .sort((a, b) => b.viewCount - a.viewCount),
        videoTimeFilter
      ),
    [videos, videoTimeFilter]
  )
  const videosTabWeak = useMemo(
    () =>
      filterVideosByPublishedWindow(
        [...videos]
          .filter(v => v.performanceTier === 'underperforming')
          .sort((a, b) => a.viewCount - b.viewCount),
        videoTimeFilter
      ),
    [videos, videoTimeFilter]
  )

  return (
    <div className="flex flex-col gap-8 fade-in">
      <ChannelHeader channel={channel} shareButton={shareButton} />

      <div className="flex flex-col gap-12">
        <AnalysisSection title="Overview">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        </AnalysisSection>

        <AnalysisSection title="Momentum & benchmarks">
          <MomentumScoreWidget
            metrics={metrics}
            uploadDayCounts={computeUploadDayCounts(videos)}
          />
          <NicheBenchmark metrics={metrics} />
        </AnalysisSection>

        <AnalysisSection title="Performance">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ViewsChart videos={videos} metrics={metrics} />
            <PerformanceDistribution videos={videos} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DurationVsViews videos={videos} />
            <EngagementVsViews videos={videos} />
          </div>
          <UploadFrequencyChart videos={videos} />
        </AnalysisSection>

        <AnalysisSection title="Content insights">
          <ContentInsights videos={videos} metrics={metrics} />
        </AnalysisSection>

        <AnalysisSection title="Posting schedule">
          <HeatmapGrid videos={videos} bestDay={metrics.bestDayOfWeek} bestTime={metrics.bestTimeOfDay} />
        </AnalysisSection>

        <AnalysisSection title="AI insights">
          <AIInsightsPanel
            channel={channel}
            videos={videos}
            metrics={metrics}
            onInsightsLoaded={insights => {
              setAiInsights(insights)
              setAiLoading(false)
            }}
          />
          <ContentGapDetector insights={aiInsights} loading={aiLoading} />
        </AnalysisSection>

        <AnalysisSection title="Video library">
          <Card
            id="videos"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
            className="shadow-none"
          >
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle
                    className="text-base font-semibold"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                  >
                    Videos
                  </CardTitle>
                  <CardDescription style={{ color: 'var(--text-muted)' }}>
                    {videos.length} most recent videos
                  </CardDescription>
                </div>
                {showVideoLibraryExport && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    style={{ borderColor: 'var(--border)' }}
                    onClick={() => {
                      exportToCSV(videos, channel.title)
                      toast('CSV export started')
                    }}
                  >
                    <Download size={14} />
                    Export CSV
                  </Button>
                )}
              </div>
            </CardHeader>

            <Tabs value={videoPerfTab} onValueChange={setVideoPerfTab} className="w-full">
              <div
                className="flex flex-wrap items-center gap-3 border-b px-4 py-3"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex shrink-0 overflow-hidden rounded-lg border border-[var(--border)]">
                  {(['all', '30d', '90d'] as const).map(period => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setVideoTimeFilter(period)}
                      className="px-3 py-1.5 text-xs font-medium transition-colors duration-150"
                      style={{
                        background: videoTimeFilter === period ? 'var(--accent-subtle)' : 'transparent',
                        color: videoTimeFilter === period ? 'var(--accent-text)' : 'var(--text-secondary)',
                      }}
                    >
                      {period === 'all' ? 'All time' : period === '30d' ? 'Last 30d' : 'Last 90d'}
                    </button>
                  ))}
                </div>

                <div className="flex shrink-0 overflow-hidden rounded-lg border border-[var(--border)]">
                  {(
                    [
                      { value: 'table', label: 'All videos' },
                      { value: 'top', label: 'Top performers' },
                      { value: 'weak', label: 'Underperforming' },
                    ] as const
                  ).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setVideoPerfTab(value)}
                      className="px-3 py-1.5 text-xs font-medium transition-colors duration-150"
                      style={{
                        background: videoPerfTab === value ? 'var(--accent-subtle)' : 'transparent',
                        color: videoPerfTab === value ? 'var(--accent-text)' : 'var(--text-secondary)',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[140px] flex-1">
                  <Search
                    size={14}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <Input
                    placeholder="Search videos..."
                    value={videoSearch}
                    onChange={e => setVideoSearch(e.target.value)}
                    className="h-8 pl-9 text-sm"
                    style={{ borderColor: 'var(--border)' }}
                  />
                </div>
              </div>

              <TabsContent value="table" className="mt-0">
                <VideoTable
                  videos={videosTabAll}
                  renderToolbar={false}
                  globalFilter={videoSearch}
                  onGlobalFilterChange={setVideoSearch}
                  onRowClick={video => {
                    setSelectedVideo(video)
                    setDeepDiveOpen(true)
                  }}
                />
              </TabsContent>

              <TabsContent value="top" className="mt-0">
                {videos.filter(v => v.performanceTier === 'hot' || v.performanceTier === 'rising').length >
                0 ? (
                  <VideoTable
                    videos={videosTabTop}
                    renderToolbar={false}
                    globalFilter={videoSearch}
                    onGlobalFilterChange={setVideoSearch}
                    onRowClick={video => {
                      setSelectedVideo(video)
                      setDeepDiveOpen(true)
                    }}
                  />
                ) : (
                  <div className="flex h-[200px] flex-col items-center justify-center gap-2">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      No hot or rising videos in the current dataset
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="weak" className="mt-0">
                {videos.filter(v => v.performanceTier === 'underperforming').length > 0 ? (
                  <VideoTable
                    videos={videosTabWeak}
                    renderToolbar={false}
                    globalFilter={videoSearch}
                    onGlobalFilterChange={setVideoSearch}
                    onRowClick={video => {
                      setSelectedVideo(video)
                      setDeepDiveOpen(true)
                    }}
                  />
                ) : (
                  <div className="flex h-[200px] flex-col items-center justify-center gap-2">
                    <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                      No underperforming videos detected — this channel performs consistently across its
                      content
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </AnalysisSection>
      </div>

      <VideoDeepDive
        video={selectedVideo}
        metrics={metrics}
        open={deepDiveOpen}
        onOpenChange={setDeepDiveOpen}
      />
    </div>
  )
}

function computeUploadDayCounts(videos: Video[]): Record<number, number> {
  const counts: Record<number, number> = {}
  for (const v of videos) {
    const day = (new Date(v.publishedAt).getUTCDay() + 6) % 7
    counts[day] = (counts[day] ?? 0) + 1
  }
  return counts
}
