'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, Minus, TrendingUp, TrendingDown } from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis,
  ScatterChart, Scatter, ZAxis,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { formatNumber } from '@/lib/utils'
import { computeContentStrategy, computeTitlePatterns, computeMomentumScore } from '@/lib/metrics'
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

export default function ComparePage() {
  const searchParams = useSearchParams()
  const channelAId = searchParams.get('a')
  const channelBId = searchParams.get('b')
  const channelCId = searchParams.get('c')

  const [data, setData] = useState<CompareResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!channelAId || !channelBId) {
      setError('Two channel IDs are required for comparison')
      setLoading(false)
      return
    }

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
        const json = await res.json()

        if (!res.ok) {
          setError(json.error || 'Comparison failed')
          setLoading(false)
          return
        }

        setData(json)
      } catch {
        setError('Network error — please try again')
      } finally {
        setLoading(false)
      }
    }
    fetchComparison()
  }, [channelAId, channelBId, channelCId])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p style={{ color: 'var(--red-text)' }}>{error}</p>
      </div>
    )
  }

  if (loading || !data) {
    return <CompareLoadingSkeleton />
  }

  const channels = [data.channelA, data.channelB]
  if (data.channelC) channels.push(data.channelC)

  return (
    <div className="flex flex-col gap-6 fade-in">
      {/* Section 1: Channel Identity Row */}
      <ChannelIdentityRow channels={channels} />

      {/* Section 2: Head-to-Head Scorecard */}
      <ScorecardTable channels={channels} />

      {/* Section 3: Content Strategy Divergence */}
      <ContentStrategySection channels={channels} />

      {/* Section 4: Performance Charts */}
      <PerformanceCharts channels={channels} />

      {/* Section 5: Title Pattern Analysis */}
      <TitlePatternSection channels={channels} />

      {/* Section 6: AI Competitive Intelligence */}
      <AIIntelligenceSection
        aiComparison={data.aiComparison}
        channels={channels}
      />

      {/* Section 7: Engagement Quality */}
      <EngagementQualitySection channels={channels} />
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
              <h2
                className="text-base font-semibold truncate"
                style={{ color: 'var(--text-primary)' }}
              >
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
]

function getMetricVal(ch: ChannelData, key: string): number | string {
  if (key === '_subs') return ch.channel.subscriberCount
  return (ch.metrics as unknown as Record<string, number | string>)[key]
}

function ScorecardTable({ channels }: { channels: ChannelData[] }) {
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
              <th className="text-center px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                Gap
              </th>
              <th className="text-center px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                Winner
              </th>
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

              // Gap calculation
              let gapStr = ''
              if (validNums.length >= 2 && !allEqual) {
                const sorted = [...validNums].sort((a, b) => b - a)
                const gap = sorted[0] - sorted[1]
                const pct = sorted[1] > 0 ? ((gap / sorted[1]) * 100).toFixed(0) : '—'
                gapStr = `${pct}%`
              }

              return (
                <tr key={metric.label} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2.5" style={{ color: 'var(--text-primary)' }}>
                    {metric.label}
                  </td>
                  {values.map((val, i) => (
                    <td
                      key={channels[i].channel.id}
                      className="text-right px-4 py-2.5 tabular-nums font-medium"
                      style={{
                        color: !allEqual && i === maxIdx
                          ? 'var(--green-text)'
                          : 'var(--text-primary)',
                      }}
                    >
                      {metric.format(val)}
                    </td>
                  ))}
                  <td
                    className="text-center px-4 py-2.5 tabular-nums text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {gapStr}
                  </td>
                  <td className="text-center px-4 py-2.5">
                    {allEqual ? (
                      <Minus size={14} style={{ color: 'var(--text-muted)', display: 'inline' }} />
                    ) : maxIdx >= 0 ? (
                      <Check size={14} style={{ color: 'var(--green-text)', display: 'inline' }} />
                    ) : null}
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

/* ─── Section 3: Content Strategy Divergence ─── */

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
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Content Strategy Divergence
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          How each channel approaches content creation
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-app)' }}>
              <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                Strategy
              </th>
              {strategies.map(s => (
                <th
                  key={s.channel.id}
                  className="text-right px-4 py-2.5 font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {s.channel.title.length > 18 ? s.channel.title.slice(0, 18) + '...' : s.channel.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} style={{ borderTop: '1px solid var(--border)' }}>
                <td className="px-4 py-2.5" style={{ color: 'var(--text-primary)' }}>
                  {row.label}
                </td>
                {strategies.map(s => (
                  <td
                    key={s.channel.id}
                    className="text-right px-4 py-2.5 tabular-nums"
                    style={{ color: 'var(--text-primary)' }}
                  >
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

/* ─── Section 4: Performance Charts ─── */

function PerformanceCharts({ channels }: { channels: ChannelData[] }) {
  const chartColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)']

  // Bar chart: last 10 videos per channel
  const maxLen = Math.max(...channels.map(ch => Math.min(ch.videos.length, 10)))
  const barData = Array.from({ length: maxLen }, (_, i) => {
    const point: Record<string, string | number> = { index: `Video ${i + 1}` }
    channels.forEach((ch, ci) => {
      const sorted = [...ch.videos].sort((a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
      const reversed = sorted.slice(0, 10).reverse()
      point[`channel${ci}`] = reversed[i]?.viewCount ?? 0
    })
    return point
  })

  const barConfig: Record<string, { label: string; color: string }> = {}
  channels.forEach((ch, i) => {
    barConfig[`channel${i}`] = { label: ch.channel.title, color: chartColors[i] }
  })

  // Scatter chart: engagement vs views
  const scatterData = channels.flatMap((ch, ci) =>
    ch.videos.map(v => ({
      channel: ch.channel.title,
      channelIdx: ci,
      views: v.viewCount,
      engagement: v.engagementRate,
      title: v.title,
      fill: chartColors[ci],
    }))
  )

  const scatterConfig: Record<string, { label: string; color: string }> = {}
  channels.forEach((ch, i) => {
    scatterConfig[`scatter${i}`] = { label: ch.channel.title, color: chartColors[i] }
  })

  return (
    <div
      className="rounded-xl border"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Performance Comparison
        </h3>
      </div>
      <div className="p-4">
        <Tabs defaultValue="bar">
          <TabsList>
            <TabsTrigger value="bar">Views (Bar)</TabsTrigger>
            <TabsTrigger value="scatter">Engagement vs Views</TabsTrigger>
          </TabsList>

          <TabsContent value="bar">
            <div className="mt-4">
              <ChartContainer config={barConfig} className="h-[300px] w-full">
                <BarChart data={barData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis
                    dataKey="index"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => formatNumber(v)}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {channels.map((_, i) => (
                    <Bar
                      key={i}
                      dataKey={`channel${i}`}
                      fill={chartColors[i]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-2 px-2">
              {channels.map((ch, i) => (
                <div key={ch.channel.id} className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ background: chartColors[i] }}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {ch.channel.title}
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="scatter">
            <div className="mt-4">
              <ChartContainer config={scatterConfig} className="h-[300px] w-full">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis
                    type="number"
                    dataKey="views"
                    name="Views"
                    tickFormatter={(v) => formatNumber(v)}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="number"
                    dataKey="engagement"
                    name="Engagement %"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                  />
                  <ZAxis range={[40, 40]} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                  />
                  {channels.map((ch, i) => (
                    <Scatter
                      key={ch.channel.id}
                      name={ch.channel.title}
                      data={scatterData.filter(d => d.channelIdx === i)}
                      fill={chartColors[i]}
                    />
                  ))}
                </ScatterChart>
              </ChartContainer>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-2 px-2">
              {channels.map((ch, i) => (
                <div key={ch.channel.id} className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: chartColors[i] }}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {ch.channel.title}
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

/* ─── Section 5: Title Pattern Analysis ─── */

function TitlePatternSection({ channels }: { channels: ChannelData[] }) {
  const patterns = channels.map(ch => ({
    channel: ch.channel,
    patterns: computeTitlePatterns(ch.videos),
  }))

  return (
    <div
      className="rounded-xl border"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Title Pattern Analysis
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Recurring words and formatting patterns in video titles
        </p>
      </div>
      <div className={`grid gap-4 p-4 ${channels.length === 3 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {patterns.map(({ channel, patterns: p }) => (
          <div key={channel.id} className="space-y-3">
            <h4 className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {channel.title}
            </h4>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2">
              <MiniStat
                label="Question titles"
                value={`${p.hasQuestionMark.pct}%`}
                sub={`${formatNumber(p.hasQuestionMark.avgViews)} avg views`}
              />
              <MiniStat
                label="Number in title"
                value={`${p.hasNumber.pct}%`}
                sub={`${formatNumber(p.hasNumber.avgViews)} avg views`}
              />
              <MiniStat
                label="Short titles (<=40)"
                value={`${formatNumber(p.shortTitleAvgViews)}`}
                sub="avg views"
              />
              <MiniStat
                label="Long titles (>40)"
                value={`${formatNumber(p.longTitleAvgViews)}`}
                sub="avg views"
              />
            </div>

            {/* Top words */}
            {p.topWords.length > 0 && (
              <div>
                <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  Top recurring words
                </p>
                <div className="flex flex-wrap gap-1">
                  {p.topWords.slice(0, 8).map(w => (
                    <span
                      key={w.word}
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--bg-app)', color: 'var(--text-secondary)' }}
                    >
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
    <div
      className="rounded-lg p-2"
      style={{ background: 'var(--bg-app)' }}
    >
      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  )
}

/* ─── Section 6: AI Competitive Intelligence ─── */

function AIIntelligenceSection({
  aiComparison,
  channels,
}: {
  aiComparison: AIComparison
  channels: ChannelData[]
}) {
  return (
    <div
      className="rounded-xl border"
      style={{ borderColor: 'var(--accent-subtle)', background: 'var(--bg-card)' }}
    >
      <div
        className="p-4 border-b"
        style={{ borderColor: 'var(--accent-subtle)', background: 'var(--accent-subtle)' }}
      >
        <h3 className="text-sm font-semibold" style={{ color: 'var(--accent-text)' }}>
          AI Competitive Intelligence
        </h3>
      </div>
      <div className="p-4 space-y-4">
        {/* Who is winning */}
        {aiComparison.whoIsWinning && (
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Overall Assessment
            </p>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {aiComparison.whoIsWinning}
            </p>
          </div>
        )}

        {/* Channel strengths */}
        {Object.keys(aiComparison.channelStrengths).length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
              Key Strengths
            </p>
            <div className={`grid gap-3 ${channels.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
              {channels.map(ch => (
                <div
                  key={ch.channel.id}
                  className="rounded-lg p-3"
                  style={{ background: 'var(--bg-app)' }}
                >
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {ch.channel.title}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                    {aiComparison.channelStrengths[ch.channel.title] || 'No data available'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gap opportunity */}
        {aiComparison.gapOpportunity && (
          <div
            className="rounded-lg p-3 border"
            style={{ borderColor: 'var(--accent-subtle)', background: 'var(--accent-subtle)' }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--accent-text)' }}>
              Gap Opportunity
            </p>
            <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
              {aiComparison.gapOpportunity}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Section 7: Engagement Quality ─── */

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
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Engagement Quality
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Like rate, comment rate, and overall engagement comparison
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-app)' }}>
              <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                Metric
              </th>
              {stats.map(s => (
                <th
                  key={s.channel.id}
                  className="text-right px-4 py-2.5 font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {s.channel.title.length > 18 ? s.channel.title.slice(0, 18) + '...' : s.channel.title}
                </th>
              ))}
              <th className="text-center px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                Trend
              </th>
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
                  <td className="px-4 py-2.5" style={{ color: 'var(--text-primary)' }}>
                    {row.label}
                  </td>
                  {stats.map((s, i) => (
                    <td
                      key={s.channel.id}
                      className="text-right px-4 py-2.5 tabular-nums font-medium"
                      style={{
                        color: !allEqual && i === maxIdx
                          ? 'var(--green-text)'
                          : 'var(--text-primary)',
                      }}
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

/* ─── Loading Skeleton ─── */

function CompareLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Identity row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map(i => (
          <div
            key={i}
            className="rounded-xl border p-5 flex items-center gap-4"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
          >
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>

      {/* Scorecard */}
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
      >
        <Skeleton className="h-5 w-48 mb-4" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex justify-between py-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
      >
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-[300px] w-full" />
      </div>

      {/* AI Section */}
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
      >
        <Skeleton className="h-5 w-48 mb-4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mt-2" />
        <Skeleton className="h-4 w-full mt-2" />
      </div>
    </div>
  )
}
