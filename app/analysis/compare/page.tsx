'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Minus, TrendingUp, TrendingDown, Check } from 'lucide-react'
import {
  CartesianGrid, XAxis, YAxis,
  LineChart, Line,
  BarChart, Bar,
  ReferenceLine,
} from 'recharts'
import { format, subMonths, startOfMonth } from 'date-fns'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { formatNumber } from '@/lib/utils'
import { computeContentStrategy, computeTitlePatterns, computeMomentumScore } from '@/lib/metrics'
import { ChannelSelector } from '@/components/compare/ChannelSelector'
import { useChannelCache } from '@/lib/context/ChannelCacheContext'
import { TimePeriodProvider, useTimePeriod } from '@/lib/context/TimePeriodContext'
import { TimePeriodSelector } from '@/components/ui/TimePeriodSelector'
import type { ChannelInfo, Video, ChannelMetrics } from '@/lib/types'

interface ChannelData {
  channel: ChannelInfo
  videos: Video[]
  metrics: ChannelMetrics
}

interface AIComparison {
  whoIsWinning: string
  channelStrengths: Record<string, string>
  gapOpportunity: string
}

interface CompareResult {
  channelA: ChannelData
  channelB: ChannelData
  channelC?: ChannelData
  aiComparison: AIComparison
}

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)']

export default function ComparePage() {
  return (
    <TimePeriodProvider>
      <ComparePageContent />
    </TimePeriodProvider>
  )
}

function ComparePageContent() {
  const searchParams = useSearchParams()
  const channelAId = searchParams.get('a')
  const channelBId = searchParams.get('b')
  const channelCId = searchParams.get('c')
  const channelCache = useChannelCache()

  const [data, setData] = useState<CompareResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!channelAId || !channelBId) {
      setError('Two channel IDs are required for comparison')
      setData(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    async function fetchComparison() {
      try {
        const bodyData: Record<string, string> = {
          channelAUrl: `https://www.youtube.com/channel/${channelAId}`,
          channelBUrl: `https://www.youtube.com/channel/${channelBId}`,
        }
        if (channelCId) {
          bodyData.channelCUrl = `https://www.youtube.com/channel/${channelCId}`
        }

        const res = await fetch('/api/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData),
        })
        if (cancelled) return
        const json = await res.json()
        if (cancelled) return

        if (!res.ok) {
          setError(json.error || 'Comparison failed')
          setLoading(false)
          return
        }

        // Pre-populate channel cache so tab switches are instant
        const results = [json.channelA, json.channelB]
        if (json.channelC) results.push(json.channelC)
        results.forEach((r: ChannelData) => {
          channelCache.set(r.channel.id, r)
        })

        setData(json)
      } catch {
        if (!cancelled) setError('Network error — please try again')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchComparison()

    return () => { cancelled = true }
  }, [channelAId, channelBId, channelCId, channelCache])

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p style={{ color: 'var(--red-text)' }}>{error}</p>
      </div>
    )
  }

  if (!data && loading) {
    return <CompareLoadingSkeleton />
  }

  const channels = data ? [data.channelA, data.channelB] : []
  if (data?.channelC) channels.push(data.channelC)

  const { filterVideos } = useTimePeriod()

  const filteredChannels = useMemo(() =>
    channels.map(ch => ({
      ...ch,
      videos: filterVideos(ch.videos),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, filterVideos]
  )

  const totalFiltered = filteredChannels.reduce((s, ch) => s + ch.videos.length, 0)
  const totalAll = channels.reduce((s, ch) => s + ch.videos.length, 0)

  const selectorChannels = channels.map(ch => ({
    channelId: ch.channel.id,
    title: ch.channel.title,
    handle: ch.channel.handle,
    thumbnailUrl: ch.channel.thumbnailUrl,
  }))

  return (
    <div className="flex flex-col gap-6 fade-in">
      <ChannelSelector channels={selectorChannels} />

      {loading && <CompareLoadingSkeleton />}

      {!loading && !data && error && (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p style={{ color: 'var(--red-text)' }}>{error}</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Time Period Selector */}
          <div
            className="flex items-center justify-between py-3"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Analysis period</p>
            <TimePeriodSelector
              videosInPeriod={totalFiltered}
              totalVideos={totalAll}
            />
          </div>

          <ChannelIdentityRow channels={channels} />
          <ScorecardTable channels={filteredChannels} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ViewsOverTimeCard channels={filteredChannels} />
            <EngagementTrendCard channels={filteredChannels} />
            <UploadFrequencyCard channels={filteredChannels} />
            <PerformanceConsistencyCard channels={filteredChannels} />
          </div>
          <ContentStrategySection channels={filteredChannels} />
          <EngagementQualitySection channels={filteredChannels} />
          <TitlePatternSection channels={filteredChannels} />
          <AIIntelligenceSection
            aiComparison={data.aiComparison}
            channels={channels}
          />
        </>
      )}
    </div>
  )
}

/* ─── Section 1: Channel Identity Row ─── */

function ChannelIdentityRow({ channels }: { channels: ChannelData[] }) {
  return (
    <div className={`grid gap-4 ${channels.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
      {channels.map((ch) => {
        const momentum = computeMomentumScore(ch.videos)
        return (
          <div
            key={ch.channel.id}
            className="rounded-xl border p-5 flex items-center gap-4"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
          >
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarImage src={ch.channel.thumbnailUrl} alt={ch.channel.title} />
              <AvatarFallback
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
              >
                {ch.channel.title.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {ch.channel.title}
              </h2>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {ch.channel.handle || ch.channel.id}
              </p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                  {formatNumber(ch.channel.subscriberCount)} subs
                </span>
                {ch.metrics.category && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
                  >
                    {ch.metrics.category}
                  </span>
                )}
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{
                    background: momentum.label === 'Accelerating' ? 'var(--green-subtle)' :
                      momentum.label === 'Stable' ? 'var(--accent-subtle)' :
                      momentum.label === 'Slowing' ? 'var(--amber-subtle)' : 'var(--bg-app)',
                    color: momentum.label === 'Accelerating' ? 'var(--green-text)' :
                      momentum.label === 'Stable' ? 'var(--accent-text)' :
                      momentum.label === 'Slowing' ? 'var(--amber-text)' : 'var(--text-muted)',
                  }}
                >
                  {momentum.score} — {momentum.label}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Section 2: Head-to-Head Scorecard ─── */

const SCORECARD_METRICS: {
  label: string
  key: string
  format: (v: number | string) => string
  higherIsBetter: boolean
}[] = [
  { label: 'Subscribers', key: '_subs', format: (v) => formatNumber(v as number), higherIsBetter: true },
  { label: 'Avg Views/Video', key: 'avgViews', format: (v) => formatNumber(v as number), higherIsBetter: true },
  { label: 'Engagement Rate', key: 'avgEngagementRate', format: (v) => `${(v as number).toFixed(2)}%`, higherIsBetter: true },
  { label: 'Views/Day', key: 'avgViewsPerDay', format: (v) => formatNumber(v as number), higherIsBetter: true },
  { label: 'Momentum', key: 'momentumScore', format: (v) => `${v}/100`, higherIsBetter: true },
  { label: 'Upload Frequency', key: 'uploadFrequency', format: (v) => v as string, higherIsBetter: false },
  { label: 'Views Last 30d', key: 'totalViewsLast30d', format: (v) => formatNumber(v as number), higherIsBetter: true },
  { label: 'Evergreen Score', key: '_evergreen', format: (v) => `${v}%`, higherIsBetter: true },
]

function getMetricVal(ch: ChannelData, key: string): number | string {
  if (key === '_subs') return ch.channel.subscriberCount
  if (key === '_evergreen') {
    const totalViews = ch.videos.reduce((s, v) => s + v.viewCount, 0)
    if (totalViews === 0) return 0
    const olderViews = ch.videos.filter(v => v.daysLive > 90).reduce((s, v) => s + v.viewCount, 0)
    return Math.round((olderViews / totalViews) * 100)
  }
  return (ch.metrics as unknown as Record<string, number | string>)[key]
}

function computeRanks(nums: (number | null)[]): (number | null)[] {
  const indexed = nums.map((n, i) => ({ n, i })).filter(x => x.n !== null) as { n: number; i: number }[]
  indexed.sort((a, b) => b.n - a.n)
  const ranks: (number | null)[] = nums.map(() => null)
  indexed.forEach((x, rank) => { ranks[x.i] = rank + 1 })
  return ranks
}

function ScorecardTable({ channels }: { channels: ChannelData[] }) {
  const is3 = channels.length === 3

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Head-to-Head Scorecard
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-app)' }}>
              <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                Metric
              </th>
              {channels.map((ch) => (
                <th
                  key={ch.channel.id}
                  className="text-right px-4 py-2.5 font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {ch.channel.title.length > 18 ? ch.channel.title.slice(0, 18) + '...' : ch.channel.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SCORECARD_METRICS.map((metric) => {
              const values = channels.map(ch => getMetricVal(ch, metric.key))
              const numericValues = values.map(v => typeof v === 'number' ? v : null)
              const validNums = numericValues.filter((n): n is number => n !== null)
              const maxIdx = validNums.length > 0
                ? numericValues.indexOf(Math.max(...validNums))
                : -1
              const allEqual = validNums.length > 1 && validNums.every(n => n === validNums[0])
              const ranks = is3 ? computeRanks(numericValues) : null

              return (
                <tr key={metric.label} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2.5" style={{ color: 'var(--text-primary)' }}>
                    {metric.label}
                  </td>
                  {values.map((val, i) => {
                    const isWinner = !allEqual && i === maxIdx
                    const rank = ranks?.[i]
                    return (
                      <td
                        key={channels[i].channel.id}
                        className="text-right px-4 py-2.5 tabular-nums font-medium"
                        style={{
                          background: isWinner ? 'var(--green-subtle)' : 'transparent',
                          color: isWinner ? 'var(--green-text)' : 'var(--text-primary)',
                        }}
                      >
                        <span className="inline-flex items-center gap-1.5 justify-end">
                          {metric.format(val)}
                          {/* 2-channel: checkmark for winner */}
                          {!is3 && isWinner && (
                            <Check size={12} style={{ color: 'var(--green-text)' }} />
                          )}
                          {/* 3-channel: rank badge */}
                          {is3 && rank !== null && !allEqual && (
                            <span
                              className="text-[9px] font-semibold px-1 py-0.5 rounded"
                              style={{
                                background: rank === 1 ? 'var(--accent-subtle)' : 'transparent',
                                color: rank === 1 ? 'var(--accent-text)' :
                                  rank === 2 ? 'var(--text-secondary)' : 'var(--text-muted)',
                              }}
                            >
                              {rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}
                            </span>
                          )}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─── Chart helpers ─── */

function buildTimeline(
  perChannel: { channel: ChannelInfo; videos: Video[] }[],
  getValue: (v: Video) => number,
): Record<string, unknown>[] {
  const points: { date: number; dateLabel: string; fullDate: string; channelIdx: number; channelName: string; value: number; title: string }[] = []
  perChannel.forEach((pc, ci) => {
    for (const v of pc.videos) {
      points.push({
        date: new Date(v.publishedAt).getTime(),
        dateLabel: format(new Date(v.publishedAt), 'MMM d'),
        fullDate: format(new Date(v.publishedAt), 'MMM d, yyyy'),
        channelIdx: ci,
        channelName: pc.channel.title,
        value: getValue(v),
        title: v.title.length > 50 ? v.title.slice(0, 50) + '...' : v.title,
      })
    }
  })
  points.sort((a, b) => a.date - b.date)
  return points.map(p => {
    const row: Record<string, unknown> = {
      date: p.date,
      dateLabel: p.dateLabel,
      [`title${p.channelIdx}`]: p.title,
      [`fullDate${p.channelIdx}`]: p.fullDate,
      [`channelName${p.channelIdx}`]: p.channelName,
    }
    row[`ch${p.channelIdx}`] = p.value
    return row
  })
}

function CustomLineTooltip({
  active,
  payload,
  channels,
  chartColors,
  valueFormatter,
}: {
  active?: boolean
  payload?: Array<{ dataKey?: string | number; value?: number; payload?: Record<string, unknown> }>
  channels: ChannelData[]
  chartColors: string[]
  valueFormatter: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  const data = payload[0]?.payload
  if (!data) return null

  return (
    <div
      className="rounded-lg border px-2.5 py-1.5 text-xs space-y-2"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
    >
      {channels.map((ch, i) => {
        const val = data[`ch${i}`] as number | undefined
        if (val == null) return null
        const title = data[`title${i}`] as string | undefined
        const fullDate = data[`fullDate${i}`] as string | undefined
        const channelName = data[`channelName${i}`] as string | undefined
        return (
          <div key={ch.channel.id} className="flex items-start gap-1.5">
            <div className="h-2 w-2 rounded-full shrink-0 mt-0.5" style={{ background: chartColors[i] }} />
            <div className="min-w-0">
              {title && <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{title}</p>}
              {channelName && <p style={{ color: 'var(--text-muted)' }}>{channelName}</p>}
              <p style={{ color: 'var(--text-secondary)' }}>{valueFormatter(val)}</p>
              {fullDate && <p style={{ color: 'var(--text-muted)' }}>{fullDate}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function InlineChartLegend({ channels }: { channels: ChannelData[] }) {
  return (
    <div className="flex items-center gap-4 mt-2 px-2">
      {channels.map((ch, i) => (
        <div key={ch.channel.id} className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART_COLORS[i] }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{ch.channel.title}</span>
        </div>
      ))}
    </div>
  )
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

/* ─── Card 1: Views over time ─── */

function ViewsOverTimeCard({ channels }: { channels: ChannelData[] }) {
  const perChannel = channels.map(ch => ({
    channel: ch.channel,
    videos: [...ch.videos].sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()).slice(-20),
  }))
  const timeline = buildTimeline(perChannel, (v) => v.viewCount)
  const config: Record<string, { label: string; color: string }> = {}
  channels.forEach((ch, i) => { config[`ch${i}`] = { label: ch.channel.title, color: CHART_COLORS[i] } })

  return (
    <ChartCard title="Views over time" description="Last 20 videos per channel, sorted by publish date">
      <ChartContainer config={config} className="min-h-[300px] w-full">
        <LineChart data={timeline}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(v) => formatNumber(v)} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={50} />
          <ChartTooltip content={<CustomLineTooltip channels={channels} chartColors={CHART_COLORS} valueFormatter={(v) => `${formatNumber(v)} views`} />} />
          {channels.map((_, i) => (
            <Line key={i} type="monotone" dataKey={`ch${i}`} stroke={CHART_COLORS[i]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
          ))}
        </LineChart>
      </ChartContainer>
      <InlineChartLegend channels={channels} />
    </ChartCard>
  )
}

/* ─── Card 2: Engagement rate over time ─── */

function EngagementTrendCard({ channels }: { channels: ChannelData[] }) {
  const perChannel = channels.map(ch => ({
    channel: ch.channel,
    videos: [...ch.videos].sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()).slice(-20),
  }))
  const timeline = buildTimeline(perChannel, (v) => v.engagementRate)
  const config: Record<string, { label: string; color: string }> = {}
  channels.forEach((ch, i) => { config[`ch${i}`] = { label: ch.channel.title, color: CHART_COLORS[i] } })

  return (
    <ChartCard title="Engagement rate over time" description="Higher engagement means a more active and loyal audience">
      <ChartContainer config={config} className="min-h-[300px] w-full">
        <LineChart data={timeline}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={50} />
          <ChartTooltip content={<CustomLineTooltip channels={channels} chartColors={CHART_COLORS} valueFormatter={(v) => `${v.toFixed(2)}% engagement`} />} />
          {channels.map((_, i) => (
            <Line key={i} type="monotone" dataKey={`ch${i}`} stroke={CHART_COLORS[i]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
          ))}
        </LineChart>
      </ChartContainer>
      <InlineChartLegend channels={channels} />
    </ChartCard>
  )
}

/* ─── Card 3: Upload frequency by month ─── */

function UploadFrequencyCard({ channels }: { channels: ChannelData[] }) {
  const now = new Date()
  const months: { key: string; label: string; start: number; end: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i))
    const monthEnd = i === 0 ? now : startOfMonth(subMonths(now, i - 1))
    months.push({
      key: format(monthStart, 'yyyy-MM'),
      label: format(monthStart, 'MMM'),
      start: monthStart.getTime(),
      end: monthEnd.getTime(),
    })
  }

  // Check empty state: each channel needs >= 3 videos in the last 6 months
  const sixMonthsAgo = months[0].start
  const tooSparse = channels.filter(ch => {
    const recentCount = ch.videos.filter(v => new Date(v.publishedAt).getTime() >= sixMonthsAgo).length
    return recentCount < 3
  })

  if (tooSparse.length > 0) {
    return (
      <ChartCard title="Upload frequency by month" description="Shows whether each channel is ramping up or slowing down">
        <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>
          Not enough video data for {tooSparse.map(ch => ch.channel.title).join(', ')} to render this chart.
        </p>
      </ChartCard>
    )
  }

  const barData = months.map(m => {
    const point: Record<string, string | number> = { month: m.label }
    channels.forEach((ch, ci) => {
      const count = ch.videos.filter(v => {
        const t = new Date(v.publishedAt).getTime()
        return t >= m.start && t < m.end
      }).length
      point[`ch${ci}`] = count
    })
    return point
  })

  // Compute average videos/month per channel for reference lines
  const avgPerMonth = channels.map((ch, ci) => {
    const total = barData.reduce((sum, d) => sum + (d[`ch${ci}`] as number), 0)
    return total / 6
  })

  const config: Record<string, { label: string; color: string }> = {}
  channels.forEach((ch, i) => { config[`ch${i}`] = { label: ch.channel.title, color: CHART_COLORS[i] } })

  return (
    <ChartCard title="Upload frequency by month" description="Shows whether each channel is ramping up or slowing down">
      <ChartContainer config={config} className="min-h-[300px] w-full">
        <BarChart data={barData} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={30} />
          <ChartTooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              return (
                <div
                  className="rounded-lg border px-2.5 py-1.5 text-xs space-y-1"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                >
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                  {payload.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {config[p.dataKey as string]?.label}: {p.value} videos
                      </span>
                    </div>
                  ))}
                </div>
              )
            }}
          />
          {channels.map((_, i) => (
            <Bar key={i} dataKey={`ch${i}`} fill={CHART_COLORS[i]} radius={[4, 4, 0, 0]} />
          ))}
          {channels.map((_, i) => (
            <ReferenceLine
              key={`avg-${i}`}
              y={avgPerMonth[i]}
              stroke={CHART_COLORS[i]}
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              label={{
                value: 'Avg',
                position: 'right',
                fill: 'var(--text-muted)',
                fontSize: 10,
              }}
            />
          ))}
        </BarChart>
      </ChartContainer>
      <InlineChartLegend channels={channels} />
    </ChartCard>
  )
}

/* ─── Card 4: Performance consistency ─── */

function PerformanceConsistencyCard({ channels }: { channels: ChannelData[] }) {
  // Check empty state: each channel needs >= 5 videos
  const tooSparse = channels.filter(ch => ch.videos.length < 5)

  if (tooSparse.length > 0) {
    return (
      <ChartCard
        title="Performance consistency"
        description="A gradual drop-off means consistent performance. A single tall bar means the channel relies on viral outliers."
      >
        <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>
          Not enough video data for {tooSparse.map(ch => ch.channel.title).join(', ')} to render this chart.
        </p>
      </ChartCard>
    )
  }

  return (
    <ChartCard
      title="Performance consistency"
      description="A gradual drop-off means consistent performance. A single tall bar means the channel relies on viral outliers."
    >
      <div className="flex flex-col gap-4">
        {channels.map((ch, ci) => {
          const sorted = [...ch.videos]
            .sort((a, b) => b.viewCount - a.viewCount)
            .slice(0, 20)

          const config: Record<string, { label: string; color: string }> = {
            views: { label: 'Views', color: CHART_COLORS[ci] },
          }

          const barData = sorted.map(v => ({
            title: v.title.length > 35 ? v.title.slice(0, 35) + '...' : v.title,
            views: v.viewCount,
          }))

          const avgViews = sorted.reduce((sum, v) => sum + v.viewCount, 0) / sorted.length

          return (
            <div key={ch.channel.id}>
              {ci > 0 && <Separator className="mb-4" />}
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarImage src={ch.channel.thumbnailUrl} alt={ch.channel.title} />
                  <AvatarFallback style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', fontSize: '8px' }}>
                    {ch.channel.title.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {ch.channel.title}
                </span>
              </div>
              <ChartContainer config={config} className="min-h-[200px] w-full">
                <BarChart data={barData} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => formatNumber(v)}
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="title"
                    width={160}
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div
                          className="rounded-lg border px-2.5 py-1.5 text-xs"
                          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                        >
                          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{d.title}</p>
                          <p style={{ color: 'var(--text-secondary)' }}>{formatNumber(d.views)} views</p>
                        </div>
                      )
                    }}
                  />
                  <ReferenceLine
                    x={avgViews}
                    stroke="var(--border-strong)"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Channel avg',
                      position: 'top',
                      fill: 'var(--text-muted)',
                      fontSize: 10,
                    }}
                  />
                  <Bar
                    dataKey="views"
                    radius={[0, 4, 4, 0]}
                    fill={CHART_COLORS[ci]}
                    fillOpacity={0.7}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          )
        })}
      </div>
    </ChartCard>
  )
}

/* ─── Content Strategy Divergence ─── */

function ContentStrategySection({ channels }: { channels: ChannelData[] }) {
  const strategies = channels.map(ch => ({
    channel: ch.channel,
    strategy: computeContentStrategy(ch.videos),
  }))

  const rows: { label: string; getValue: (s: ReturnType<typeof computeContentStrategy>) => string }[] = [
    { label: 'Avg Duration', getValue: (s) => `${Math.floor(s.avgDurationSeconds / 60)}m ${s.avgDurationSeconds % 60}s` },
    { label: 'Short-form (<4m)', getValue: (s) => `${s.shortFormPct}%` },
    { label: 'Long-form (10m+)', getValue: (s) => `${s.longFormPct}%` },
    { label: 'Avg Title Length', getValue: (s) => `${s.avgTitleLength} chars` },
    { label: 'Question Titles', getValue: (s) => `${s.questionTitlePct}%` },
    { label: 'Number in Title', getValue: (s) => `${s.numberTitlePct}%` },
    { label: 'Uploads/Week', getValue: (s) => `${s.uploadsPerWeek}` },
    { label: 'Consistency', getValue: (s) => s.consistencyLabel },
  ]

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Content Strategy Divergence</h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>How each channel approaches content creation</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-app)' }}>
              <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>Strategy</th>
              {strategies.map(s => (
                <th key={s.channel.id} className="text-right px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {s.channel.title.length > 18 ? s.channel.title.slice(0, 18) + '...' : s.channel.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} style={{ borderTop: '1px solid var(--border)' }}>
                <td className="px-4 py-2.5" style={{ color: 'var(--text-primary)' }}>{row.label}</td>
                {strategies.map(s => (
                  <td key={s.channel.id} className="text-right px-4 py-2.5 tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {row.getValue(s.strategy)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─── Engagement Quality ─── */

function EngagementQualitySection({ channels }: { channels: ChannelData[] }) {
  const stats = channels.map(ch => {
    const totalViews = ch.videos.reduce((s, v) => s + v.viewCount, 0)
    const totalLikes = ch.videos.reduce((s, v) => s + v.likeCount, 0)
    const totalComments = ch.videos.reduce((s, v) => s + v.commentCount, 0)
    const likeRate = totalViews > 0 ? (totalLikes / totalViews * 100) : 0
    const commentRate = totalViews > 0 ? (totalComments / totalViews * 100) : 0
    return {
      channel: ch.channel,
      likeRate,
      commentRate,
      engagementRate: ch.metrics.avgEngagementRate,
      avgLikes: ch.videos.length > 0 ? Math.round(totalLikes / ch.videos.length) : 0,
      avgComments: ch.videos.length > 0 ? Math.round(totalComments / ch.videos.length) : 0,
    }
  })

  const rows: { label: string; getValue: (s: typeof stats[0]) => string; getNum: (s: typeof stats[0]) => number }[] = [
    { label: 'Like Rate', getValue: (s) => `${s.likeRate.toFixed(2)}%`, getNum: (s) => s.likeRate },
    { label: 'Comment Rate', getValue: (s) => `${s.commentRate.toFixed(3)}%`, getNum: (s) => s.commentRate },
    { label: 'Engagement Rate', getValue: (s) => `${s.engagementRate.toFixed(2)}%`, getNum: (s) => s.engagementRate },
    { label: 'Avg Likes/Video', getValue: (s) => formatNumber(s.avgLikes), getNum: (s) => s.avgLikes },
    { label: 'Avg Comments/Video', getValue: (s) => formatNumber(s.avgComments), getNum: (s) => s.avgComments },
  ]

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Engagement Quality</h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Like rate, comment rate, and overall engagement comparison</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-app)' }}>
              <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>Metric</th>
              {stats.map(s => (
                <th key={s.channel.id} className="text-right px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {s.channel.title.length > 18 ? s.channel.title.slice(0, 18) + '...' : s.channel.title}
                </th>
              ))}
              <th className="text-center px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const nums = stats.map(s => row.getNum(s))
              const maxVal = Math.max(...nums)
              const maxIdx = nums.indexOf(maxVal)
              const allEqual = nums.every(n => n === nums[0])
              return (
                <tr key={row.label} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2.5" style={{ color: 'var(--text-primary)' }}>{row.label}</td>
                  {stats.map((s, i) => (
                    <td
                      key={s.channel.id}
                      className="text-right px-4 py-2.5 tabular-nums font-medium"
                      style={{ color: !allEqual && i === maxIdx ? 'var(--green-text)' : 'var(--text-primary)' }}
                    >
                      {row.getValue(s)}
                    </td>
                  ))}
                  <td className="text-center px-4 py-2.5">
                    {allEqual ? (
                      <Minus size={14} style={{ color: 'var(--text-muted)', display: 'inline' }} />
                    ) : maxIdx === 0 ? (
                      <TrendingUp size={14} style={{ color: 'var(--green-text)', display: 'inline' }} />
                    ) : (
                      <TrendingDown size={14} style={{ color: 'var(--red-text)', display: 'inline' }} />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─── Title Pattern Analysis ─── */

function TitlePatternSection({ channels }: { channels: ChannelData[] }) {
  const patterns = channels.map(ch => ({
    channel: ch.channel,
    patterns: computeTitlePatterns(ch.videos),
  }))

  return (
    <div className="rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Title Pattern Analysis</h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Recurring words and formatting patterns in video titles</p>
      </div>
      <div className={`grid gap-4 p-4 ${channels.length === 3 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {patterns.map(({ channel, patterns: p }) => (
          <div key={channel.id} className="space-y-3">
            <h4 className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{channel.title}</h4>
            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="Question titles" value={`${p.hasQuestionMark.pct}%`} sub={`${formatNumber(p.hasQuestionMark.avgViews)} avg views`} />
              <MiniStat label="Number in title" value={`${p.hasNumber.pct}%`} sub={`${formatNumber(p.hasNumber.avgViews)} avg views`} />
              <MiniStat label="Short titles (<=40)" value={`${formatNumber(p.shortTitleAvgViews)}`} sub="avg views" />
              <MiniStat label="Long titles (>40)" value={`${formatNumber(p.longTitleAvgViews)}`} sub="avg views" />
            </div>
            {p.topWords.length > 0 && (
              <div>
                <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Top recurring words</p>
                <div className="flex flex-wrap gap-1">
                  {p.topWords.slice(0, 8).map(w => (
                    <span key={w.word} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-app)', color: 'var(--text-secondary)' }}>
                      {w.word} ({w.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg p-2" style={{ background: 'var(--bg-app)' }}>
      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  )
}

/* ─── AI Competitive Intelligence ─── */

function AIIntelligenceSection({ aiComparison, channels }: { aiComparison: AIComparison; channels: ChannelData[] }) {
  return (
    <div className="rounded-xl border" style={{ borderColor: 'var(--accent-subtle)', background: 'var(--bg-card)' }}>
      <div className="p-4 border-b" style={{ borderColor: 'var(--accent-subtle)', background: 'var(--accent-subtle)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--accent-text)' }}>AI Competitive Intelligence</h3>
      </div>
      <div className="p-4 space-y-4">
        {aiComparison.whoIsWinning && (
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Overall Assessment</p>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{aiComparison.whoIsWinning}</p>
          </div>
        )}
        {Object.keys(aiComparison.channelStrengths).length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Key Strengths</p>
            <div className={`grid gap-3 ${channels.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
              {channels.map(ch => (
                <div key={ch.channel.id} className="rounded-lg p-3" style={{ background: 'var(--bg-app)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{ch.channel.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                    {aiComparison.channelStrengths[ch.channel.title] || 'No data available'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {aiComparison.gapOpportunity && (
          <div className="rounded-lg p-3 border" style={{ borderColor: 'var(--accent-subtle)', background: 'var(--accent-subtle)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--accent-text)' }}>Gap Opportunity</p>
            <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{aiComparison.gapOpportunity}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Loading Skeleton ─── */

function CompareLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map(i => (
          <div key={i} className="rounded-xl border p-5 flex items-center gap-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
        <Skeleton className="h-5 w-48 mb-4" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex justify-between py-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ))}
      <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
        <Skeleton className="h-5 w-48 mb-4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mt-2" />
        <Skeleton className="h-4 w-full mt-2" />
      </div>
    </div>
  )
}
