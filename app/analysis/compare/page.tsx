'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Minus, TrendingUp, TrendingDown, Check, BookmarkPlus, Loader2, GitCompare, Plus, ArrowUp, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/context/AuthContext'
import { useSavedComparisons } from '@/lib/context/SavedComparisonsContext'
import {
  CartesianGrid, XAxis, YAxis,
  LineChart, Line,
  BarChart, Bar,
  ReferenceLine,
} from 'recharts'
import { format, subMonths, startOfMonth } from 'date-fns'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { cn, formatNumber } from '@/lib/utils'
import { AnalysisSection } from '@/components/analysis/AnalysisSection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { computeContentStrategy, computeTitlePatterns, computeMomentumScore } from '@/lib/metrics'
import { ChannelSelector } from '@/components/compare/ChannelSelector'
import { useChannelCache } from '@/lib/context/ChannelCacheContext'
import { useChannelTabs } from '@/lib/hooks/useChannelTabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { HeroBackground } from '@/components/layout/HeroBackground'
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

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-4)', 'var(--chart-5)']
const BAR_RADIUS: [number, number, number, number] = [3, 3, 0, 0]
const BAR_RADIUS_H: [number, number, number, number] = [0, 3, 3, 0]
const axisTick = { fontSize: 10, fill: 'var(--text-muted)' }

export default function ComparePage() {
  return <ComparePageContent />
}

export function ComparePageContent({
  channelIds: propChannelIds,
  compareTabId,
}: {
  channelIds?: string[]
  compareTabId?: string
} = {}) {
  const searchParams = useSearchParams()
  // Use prop channel IDs if provided (from [compareId] route), otherwise fall back to query params
  const channelAId = propChannelIds?.[0] ?? searchParams.get('a')
  const channelBId = propChannelIds?.[1] ?? searchParams.get('b')
  const channelCId = propChannelIds?.[2] ?? searchParams.get('c')
  const channelCache = useChannelCache()
  const { user } = useAuth()
  const { saveComparison } = useSavedComparisons()
  const { updateComparisonTab } = useChannelTabs()

  const [data, setData] = useState<CompareResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)

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

        // Update comparison tab name & channels with real data
        if (compareTabId) {
          const tabChannels = results.map((r: ChannelData) => ({
            channelId: r.channel.id,
            title: r.channel.title,
            handle: r.channel.handle,
            thumbnailUrl: r.channel.thumbnailUrl,
          }))
          const name = tabChannels
            .map(ch => (ch.handle || ch.title).replace('@', ''))
            .join(' vs ')
          updateComparisonTab(compareTabId, { name, channels: tabChannels })
        }

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

  const channels = data ? [data.channelA, data.channelB, ...(data.channelC ? [data.channelC] : [])] : []

  const selectorChannels = channels.map(ch => ({
    channelId: ch.channel.id,
    title: ch.channel.title,
    handle: ch.channel.handle,
    thumbnailUrl: ch.channel.thumbnailUrl,
  }))

  // Not enough channels — show empty state with channel selector
  if (!channelAId || !channelBId) {
    return (
      <CompareEmptyState compareTabId={compareTabId} />
    )
  }

  if (error && !data) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-6 pt-6">
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p style={{ color: 'var(--red-text)' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (!data && loading) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-6 pt-6">
        <CompareLoadingSkeleton />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 pt-6 fade-in">
      <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <ChannelSelector channels={selectorChannels} compareTabId={compareTabId} />
        </div>
        {user && channels.length >= 2 && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => {
                setSaveName(
                  channels
                    .map(d => d.channel.handle.replace('@', ''))
                    .join(' vs ')
                )
                setSaveModalOpen(true)
              }}
            >
              <BookmarkPlus size={14} />
              Save comparison
            </Button>

            <Dialog open={saveModalOpen} onOpenChange={setSaveModalOpen}>
              <DialogContent
                className="max-w-[380px] shadow-none"
                style={{ borderColor: 'var(--border)' }}
              >
                <DialogHeader>
                  <DialogTitle
                    className="font-semibold"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Save this comparison
                  </DialogTitle>
                  <DialogDescription>
                    Give it a name so you can find it later
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 pt-2">
                  <Input
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    placeholder="e.g. Tech channels Q1 2025"
                    onKeyDown={async e => {
                      if (e.key === 'Enter' && saveName.trim() && !saving) {
                        setSaving(true)
                        await saveComparison(
                          saveName,
                          channels.map(d => ({
                            id: d.channel.id,
                            title: d.channel.title,
                            handle: d.channel.handle,
                            thumbnailUrl: d.channel.thumbnailUrl,
                          }))
                        )
                        setSaving(false)
                        setSaveModalOpen(false)
                        toast.success('Comparison saved')
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSaveModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={!saveName.trim() || saving}
                      onClick={async () => {
                        setSaving(true)
                        await saveComparison(
                          saveName,
                          channels.map(d => ({
                            id: d.channel.id,
                            title: d.channel.title,
                            handle: d.channel.handle,
                            thumbnailUrl: d.channel.thumbnailUrl,
                          }))
                        )
                        setSaving(false)
                        setSaveModalOpen(false)
                        toast.success('Comparison saved')
                      }}
                      style={{ background: 'var(--accent)', color: '#ffffff' }}
                    >
                      {saving ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : 'Save'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      {!loading && !data && error && (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p style={{ color: 'var(--red-text)' }}>{error}</p>
        </div>
      )}

      {!loading && data && (
        <div className="flex flex-col gap-12">
          <AnalysisSection title="Channels">
            <ChannelIdentityRow channels={channels} />
          </AnalysisSection>

          <AnalysisSection title="Head-to-head scorecard">
            <ScorecardTable channels={channels} />
          </AnalysisSection>

          <AnalysisSection title="Performance trends">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ViewsOverTimeCard channels={channels} />
              <EngagementTrendCard channels={channels} />
              <UploadFrequencyCard channels={channels} />
              <PerformanceConsistencyCard channels={channels} />
            </div>
          </AnalysisSection>

          <AnalysisSection title="Content strategy">
            <ContentStrategySection channels={channels} />
          </AnalysisSection>

          <AnalysisSection title="Engagement quality">
            <EngagementQualitySection channels={channels} />
          </AnalysisSection>

          <AnalysisSection title="Title patterns">
            <TitlePatternSection channels={channels} />
          </AnalysisSection>

          <AnalysisSection title="AI competitive intelligence">
            <AIIntelligenceSection
              aiComparison={data.aiComparison}
              channels={channels}
            />
          </AnalysisSection>
        </div>
      )}
      </div>
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
          <Card
            key={ch.channel.id}
            className="shadow-none gap-0 py-0"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
          >
            <CardContent className="flex items-center gap-4 p-5">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarImage src={ch.channel.thumbnailUrl} alt={ch.channel.title} />
              <AvatarFallback
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
              >
                {ch.channel.title.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3
                className="truncate text-base font-semibold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
              >
                {ch.channel.title}
              </h3>
              <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
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
            </CardContent>
          </Card>
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
    <Card className="shadow-none overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
      <CardHeader className="pb-3">
        <CardTitle
          className="text-sm font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Metrics at a glance
        </CardTitle>
        <CardDescription style={{ color: 'var(--text-muted)' }}>
          Side-by-side KPIs; highlights show the stronger value per row (where applicable).
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className="overflow-hidden rounded-md"
          style={{ border: '1px solid var(--border-subtle)' }}
        >
          <Table className="border-separate border-spacing-0">
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow
                className="border-0 border-b border-solid hover:bg-transparent"
                style={{
                  background: 'var(--border-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <TableHead
                  className="h-11 px-3 text-left text-xs font-medium first:rounded-tl-md"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Metric
                </TableHead>
                {channels.map((ch) => (
                  <TableHead
                    key={ch.channel.id}
                    className="h-11 px-3 text-right text-xs font-medium last:rounded-tr-md"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {ch.channel.title.length > 18 ? `${ch.channel.title.slice(0, 18)}…` : ch.channel.title}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {SCORECARD_METRICS.map((metric, rowIndex) => {
                const values = channels.map(ch => getMetricVal(ch, metric.key))
                const numericValues = values.map(v => typeof v === 'number' ? v : null)
                const validNums = numericValues.filter((n): n is number => n !== null)
                const maxIdx = validNums.length > 0
                  ? numericValues.indexOf(Math.max(...validNums))
                  : -1
                const allEqual = validNums.length > 1 && validNums.every(n => n === validNums[0])
                const ranks = is3 ? computeRanks(numericValues) : null
                const isLastRow = rowIndex === SCORECARD_METRICS.length - 1
                const rowDivider = !isLastRow
                  ? { borderBottom: '1px dashed var(--border)' as const }
                  : undefined

                return (
                  <TableRow key={metric.label} className="border-0 hover:bg-transparent">
                    <TableCell
                      className="px-3 py-3 text-sm font-medium"
                      style={{ color: 'var(--text-primary)', ...rowDivider }}
                    >
                      {metric.label}
                    </TableCell>
                    {values.map((val, i) => {
                      const isWinner = !allEqual && i === maxIdx
                      const rank = ranks?.[i]
                      return (
                        <TableCell
                          key={channels[i].channel.id}
                          className="px-3 py-3 text-right text-sm tabular-nums font-medium"
                          style={{
                            background: isWinner ? 'var(--green-subtle)' : undefined,
                            color: isWinner ? 'var(--green-text)' : 'var(--text-primary)',
                            ...rowDivider,
                          }}
                        >
                          <span className="inline-flex items-center justify-end gap-1.5">
                            {metric.format(val)}
                            {!is3 && isWinner && (
                              <Check size={12} style={{ color: 'var(--green-text)' }} />
                            )}
                            {is3 && rank !== null && !allEqual && (
                              <span
                                className="rounded px-1 py-0.5 text-[9px] font-semibold"
                                style={{
                                  background: rank === 1 ? 'var(--accent-subtle)' : 'transparent',
                                  color:
                                    rank === 1
                                      ? 'var(--accent-text)'
                                      : rank === 2
                                        ? 'var(--text-secondary)'
                                        : 'var(--text-muted)',
                                }}
                              >
                                {rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}
                              </span>
                            )}
                          </span>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
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
          <div
            className="h-2.5 w-2.5 rounded-sm"
            style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
          />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{ch.channel.title}</span>
        </div>
      ))}
    </div>
  )
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card
      className="shadow-none h-full min-h-0"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
    >
      <CardHeader className="pb-3">
        <CardTitle
          className="text-sm font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          {title}
        </CardTitle>
        <CardDescription style={{ color: 'var(--text-muted)' }}>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
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
  channels.forEach((ch, i) => {
    config[`ch${i}`] = { label: ch.channel.title, color: CHART_COLORS[i % CHART_COLORS.length] }
  })

  return (
    <ChartCard title="Views over time" description="Last 20 videos per channel, sorted by publish date">
      <ChartContainer config={config} className="min-h-[280px] w-full">
        <LineChart data={timeline}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="dateLabel" tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(v) => formatNumber(v)} tick={axisTick} tickLine={false} axisLine={false} width={50} />
          <ChartTooltip content={<CustomLineTooltip channels={channels} chartColors={CHART_COLORS} valueFormatter={(v) => `${formatNumber(v)} views`} />} />
          {channels.map((_, i) => (
            <Line
              key={i}
              type="monotone"
              dataKey={`ch${i}`}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
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
  channels.forEach((ch, i) => {
    config[`ch${i}`] = { label: ch.channel.title, color: CHART_COLORS[i % CHART_COLORS.length] }
  })

  return (
    <ChartCard title="Engagement rate over time" description="Higher engagement means a more active and loyal audience">
      <ChartContainer config={config} className="min-h-[280px] w-full">
        <LineChart data={timeline}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="dateLabel" tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(v) => `${v}%`} tick={axisTick} tickLine={false} axisLine={false} width={50} />
          <ChartTooltip content={<CustomLineTooltip channels={channels} chartColors={CHART_COLORS} valueFormatter={(v) => `${v.toFixed(2)}% engagement`} />} />
          {channels.map((_, i) => (
            <Line
              key={i}
              type="monotone"
              dataKey={`ch${i}`}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
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
  channels.forEach((ch, i) => {
    config[`ch${i}`] = { label: ch.channel.title, color: CHART_COLORS[i % CHART_COLORS.length] }
  })

  return (
    <ChartCard title="Upload frequency by month" description="Shows whether each channel is ramping up or slowing down">
      <ChartContainer config={config} className="min-h-[280px] w-full">
        <BarChart data={barData} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="month" tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={30} />
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
            <Bar key={i} dataKey={`ch${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={BAR_RADIUS} />
          ))}
          {channels.map((_, i) => (
            <ReferenceLine
              key={`avg-${i}`}
              y={avgPerMonth[i]}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
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
            views: { label: 'Views', color: CHART_COLORS[ci % CHART_COLORS.length] },
          }

          const barData = sorted.map(v => ({
            title: v.title.length > 35 ? v.title.slice(0, 35) + '...' : v.title,
            views: v.viewCount,
          }))

          const avgViews = sorted.reduce((sum, v) => sum + v.viewCount, 0) / sorted.length

          return (
            <div key={ch.channel.id}>
              {ci > 0 && (
                <div
                  className="mb-4 border-t border-dashed border-[var(--border-subtle)]"
                  aria-hidden
                />
              )}
              <div className="mb-2 flex items-center gap-2">
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarImage src={ch.channel.thumbnailUrl} alt={ch.channel.title} />
                  <AvatarFallback style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', fontSize: '8px' }}>
                    {ch.channel.title.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span
                  className="text-xs font-semibold"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
                >
                  {ch.channel.title}
                </span>
              </div>
              <ChartContainer config={config} className="min-h-[200px] w-full">
                <BarChart data={barData} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => formatNumber(v)}
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="title"
                    width={160}
                    tick={axisTick}
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
                    radius={BAR_RADIUS_H}
                    fill={CHART_COLORS[ci % CHART_COLORS.length]}
                    fillOpacity={0.85}
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
    <Card className="shadow-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
      <CardHeader className="pb-3">
        <CardTitle
          className="text-sm font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          How each channel creates content
        </CardTitle>
        <CardDescription style={{ color: 'var(--text-muted)' }}>
          Duration mix, title patterns, and upload rhythm side by side.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-hidden rounded-md" style={{ border: '1px solid var(--border-subtle)' }}>
          <Table className="border-separate border-spacing-0">
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow
                className="border-0 border-b border-solid hover:bg-transparent"
                style={{
                  background: 'var(--border-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <TableHead
                  className="h-11 px-3 text-left text-xs font-medium first:rounded-tl-md"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Strategy
                </TableHead>
                {strategies.map(s => (
                  <TableHead
                    key={s.channel.id}
                    className="h-11 px-3 text-right text-xs font-medium last:rounded-tr-md"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {s.channel.title.length > 18 ? `${s.channel.title.slice(0, 18)}…` : s.channel.title}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => {
                const isLast = rowIndex === rows.length - 1
                const div = !isLast ? { borderBottom: '1px dashed var(--border)' as const } : undefined
                return (
                  <TableRow key={row.label} className="border-0 hover:bg-transparent">
                    <TableCell className="px-3 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)', ...div }}>
                      {row.label}
                    </TableCell>
                    {strategies.map(s => (
                      <TableCell
                        key={s.channel.id}
                        className="px-3 py-3 text-right text-sm tabular-nums"
                        style={{ color: 'var(--text-secondary)', ...div }}
                      >
                        {row.getValue(s.strategy)}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
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
    <Card className="shadow-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
      <CardHeader className="pb-3">
        <CardTitle
          className="text-sm font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Likes, comments, and engagement
        </CardTitle>
        <CardDescription style={{ color: 'var(--text-muted)' }}>
          Aggregated rates across the loaded video set for each channel.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-hidden rounded-md" style={{ border: '1px solid var(--border-subtle)' }}>
          <Table className="border-separate border-spacing-0">
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow
                className="border-0 border-b border-solid hover:bg-transparent"
                style={{
                  background: 'var(--border-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <TableHead className="h-11 px-3 text-left text-xs font-medium first:rounded-tl-md" style={{ color: 'var(--text-muted)' }}>
                  Metric
                </TableHead>
                {stats.map(s => (
                  <TableHead
                    key={s.channel.id}
                    className="h-11 px-3 text-right text-xs font-medium"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {s.channel.title.length > 18 ? `${s.channel.title.slice(0, 18)}…` : s.channel.title}
                  </TableHead>
                ))}
                <TableHead
                  className="h-11 px-3 text-center text-xs font-medium last:rounded-tr-md"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Trend
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => {
                const nums = stats.map(s => row.getNum(s))
                const maxVal = Math.max(...nums)
                const maxIdx = nums.indexOf(maxVal)
                const allEqual = nums.every(n => n === nums[0])
                const isLast = rowIndex === rows.length - 1
                const div = !isLast ? { borderBottom: '1px dashed var(--border)' as const } : undefined
                return (
                  <TableRow key={row.label} className="border-0 hover:bg-transparent">
                    <TableCell className="px-3 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)', ...div }}>
                      {row.label}
                    </TableCell>
                    {stats.map((s, i) => (
                      <TableCell
                        key={s.channel.id}
                        className={cn(
                          'px-3 py-3 text-right text-sm tabular-nums',
                          !allEqual && i === maxIdx ? 'font-medium' : 'font-normal'
                        )}
                        style={{
                          color: !allEqual && i === maxIdx ? 'var(--green-text)' : 'var(--text-secondary)',
                          ...div,
                        }}
                      >
                        {row.getValue(s)}
                      </TableCell>
                    ))}
                    <TableCell className="px-3 py-3 text-center" style={div}>
                      {allEqual ? (
                        <Minus size={14} className="inline" style={{ color: 'var(--text-muted)' }} />
                      ) : maxIdx === 0 ? (
                        <TrendingUp size={14} className="inline" style={{ color: 'var(--green-text)' }} />
                      ) : (
                        <TrendingDown size={14} className="inline" style={{ color: 'var(--red-text)' }} />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Title Pattern Analysis ─── */

function TitlePatternSection({ channels }: { channels: ChannelData[] }) {
  const patterns = channels.map(ch => ({
    channel: ch.channel,
    patterns: computeTitlePatterns(ch.videos),
  }))

  return (
    <Card className="shadow-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
      <CardHeader className="pb-3">
        <CardTitle
          className="text-sm font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Title pattern analysis
        </CardTitle>
        <CardDescription style={{ color: 'var(--text-muted)' }}>
          Recurring words and title formats compared per channel.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className={cn(
            'grid gap-4',
            channels.length === 3 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'
          )}
        >
          {patterns.map(({ channel, patterns: p }) => (
            <div
              key={channel.id}
              className="overflow-hidden rounded-xl border"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
            >
              <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border-subtle)' }}>
                <p
                  className="text-sm font-semibold"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                >
                  {channel.title}
                </p>
              </div>
              <div className="space-y-3 p-4">
                <div className="grid grid-cols-2 gap-2">
                  <MiniStat label="Question titles" value={`${p.hasQuestionMark.pct}%`} sub={`${formatNumber(p.hasQuestionMark.avgViews)} avg views`} />
                  <MiniStat label="Number in title" value={`${p.hasNumber.pct}%`} sub={`${formatNumber(p.hasNumber.avgViews)} avg views`} />
                  <MiniStat label="Short titles (≤40)" value={`${formatNumber(p.shortTitleAvgViews)}`} sub="avg views" />
                  <MiniStat label="Long titles (>40)" value={`${formatNumber(p.longTitleAvgViews)}`} sub="avg views" />
                </div>
                {p.topWords.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      Top recurring words
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.topWords.slice(0, 8).map(w => (
                        <span
                          key={w.word}
                          className="rounded-md px-2 py-0.5 text-[10px]"
                          style={{
                            background: 'var(--border-subtle)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {w.word} ({w.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div
      className="rounded-md border px-2.5 py-2"
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-app)' }}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
        {sub}
      </p>
    </div>
  )
}

/* ─── AI Competitive Intelligence ─── */

function AIIntelligenceSection({ aiComparison, channels }: { aiComparison: AIComparison; channels: ChannelData[] }) {
  return (
    <div className="flex flex-col gap-4">
      {aiComparison.whoIsWinning && (
        <Card className="shadow-none gap-0 py-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <CardContent className="px-4 py-4 sm:px-5">
            <div
              className="mb-2.5 flex items-center gap-2.5 border-b border-dashed pb-2.5"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <h3
                className="text-sm font-semibold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
              >
                Overall assessment
              </h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {aiComparison.whoIsWinning}
            </p>
          </CardContent>
        </Card>
      )}
      {Object.keys(aiComparison.channelStrengths).length > 0 && (
        <div
          className={cn(
            'grid gap-4',
            channels.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
          )}
        >
          {channels.map(ch => (
            <Card
              key={ch.channel.id}
              className="shadow-none gap-0 py-0"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
            >
              <CardContent className="px-4 py-4 sm:px-5">
                <div
                  className="mb-2.5 flex items-center gap-2.5 border-b border-dashed pb-2.5"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <h3
                    className="min-w-0 text-sm font-semibold leading-tight"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                  >
                    {ch.channel.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {aiComparison.channelStrengths[ch.channel.title] || 'No data available'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {aiComparison.gapOpportunity && (
        <Card
          className="shadow-none gap-0 py-0"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
        >
          <CardContent className="px-4 py-4 sm:px-5">
            <div
              className="mb-2.5 flex items-center gap-2.5 border-b border-dashed pb-2.5"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <h3
                className="text-sm font-semibold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
              >
                Gap opportunity
              </h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {aiComparison.gapOpportunity}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ─── Empty State: no channels selected yet ─── */

function CompareEmptyState({ compareTabId }: { compareTabId?: string }) {
  const { channelTabs, addTab, updateComparisonTab } = useChannelTabs()
  const router = useRouter()
  const channelCache = useChannelCache()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [addedChannels, setAddedChannels] = useState<{ channelId: string; title: string; handle: string; thumbnailUrl: string }[]>([])
  const [addUrl, setAddUrl] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  // Merge open channel tabs with URL-added channels for the selection list
  const allChannels = [
    ...channelTabs.map(t => ({ channelId: t.channelId, title: t.title, handle: t.handle, thumbnailUrl: t.thumbnailUrl })),
    ...addedChannels.filter(ac => !channelTabs.some(t => t.channelId === ac.channelId)),
  ]

  const handleToggle = (channelId: string) => {
    setSelectedIds(prev =>
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : prev.length >= 3 ? prev : [...prev, channelId]
    )
  }

  const handleAddUrl = async () => {
    if (!addUrl.trim()) return
    setAddLoading(true)
    setAddError('')
    try {
      let fullUrl = addUrl.trim()
      if (!fullUrl.startsWith('http')) fullUrl = `https://${fullUrl}`
      const res = await fetch(`/api/channel?url=${encodeURIComponent(fullUrl)}`)
      const data = await res.json()
      if (!res.ok) {
        setAddError(data.error || 'Channel not found')
        return
      }
      channelCache.set(data.channel.id, {
        channel: data.channel,
        videos: data.videos,
        metrics: data.metrics,
      })
      // Add to channel tabs so it persists in the tab bar
      addTab({
        channelId: data.channel.id,
        title: data.channel.title,
        handle: data.channel.handle,
        thumbnailUrl: data.channel.thumbnailUrl,
      })
      // Track metadata for display in the selection list
      setAddedChannels(prev => [...prev, {
        channelId: data.channel.id,
        title: data.channel.title,
        handle: data.channel.handle,
        thumbnailUrl: data.channel.thumbnailUrl,
      }])
      if (selectedIds.length < 3 && !selectedIds.includes(data.channel.id)) {
        setSelectedIds(prev => [...prev, data.channel.id])
      }
      setAddUrl('')
    } catch {
      setAddError('Network error')
    } finally {
      setAddLoading(false)
    }
  }

  const handleStart = () => {
    if (selectedIds.length < 2) return

    if (compareTabId) {
      // Update the comparison tab's channels and name
      const channels = selectedIds.map(id => {
        const known = allChannels.find(ch => ch.channelId === id)
        const cached = channelCache.get(id)
        return {
          channelId: id,
          title: known?.title ?? cached?.channel.title ?? id,
          handle: known?.handle ?? cached?.channel.handle ?? '',
          thumbnailUrl: known?.thumbnailUrl ?? cached?.channel.thumbnailUrl ?? '',
        }
      })
      const name = channels
        .map(ch => (ch.handle || ch.title).replace('@', ''))
        .join(' vs ')
      updateComparisonTab(compareTabId, { channels, name })
      // updateComparisonTab triggers localStorage sync → useChannelTabs re-reads →
      // parent CompareTabPage re-renders with new channelIds → this component gets
      // new props and the useEffect fires the comparison fetch
    } else {
      // Navigate with query params (legacy flow)
      const params = new URLSearchParams()
      selectedIds.forEach((id, i) => {
        params.set(['a', 'b', 'c'][i], id)
      })
      router.push(`/analysis/compare?${params.toString()}`)
    }
  }

  const gridLine = 'color-mix(in srgb, var(--border-strong) 32%, transparent)'

  return (
    <div className="-mt-14 flex w-full flex-1 flex-col items-center justify-center fade-in">
      <HeroBackground />

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center px-6 pt-12 text-center">
        {/* Header */}
        <div className="flex w-full flex-col items-center gap-2">
          <h1
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            New comparison
          </h1>
          <p className="max-w-sm text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            Select 2–3 channels to compare side by side.
          </p>
        </div>

        {/* Available channels section */}
        {allChannels.length > 0 && (
          <div className="mt-8 w-full">
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3 text-left"
              style={{ color: 'var(--text-muted)' }}
            >
              Available channels
            </p>
            <div className="grid grid-cols-3 gap-3">
              {allChannels.map(ch => {
                const selected = selectedIds.includes(ch.channelId)
                return (
                  <button
                    key={ch.channelId}
                    type="button"
                    onClick={() => handleToggle(ch.channelId)}
                    className="relative overflow-hidden rounded-xl border text-left transition-colors duration-150 cursor-pointer"
                    style={{
                      borderColor: selected ? 'var(--accent)' : 'var(--border)',
                      background: 'var(--bg-card)',
                    }}
                  >
                    {/* Grid lines overlay */}
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
                    {/* Checkbox */}
                    <div className="relative z-[1] p-2.5 pb-0">
                      <div
                        className="h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors duration-150"
                        style={{
                          borderColor: selected ? 'var(--accent)' : 'var(--border-strong)',
                          background: selected ? 'var(--accent)' : 'transparent',
                        }}
                      >
                        {selected && <Check size={10} color="#ffffff" strokeWidth={3} />}
                      </div>
                    </div>
                    {/* Avatar + info — vertical */}
                    <div className="relative z-[1] flex flex-col items-center gap-1.5 px-3 pt-2 pb-3 text-center">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={ch.thumbnailUrl} alt={ch.title} />
                        <AvatarFallback
                          style={{
                            background: 'var(--accent-subtle)',
                            color: 'var(--accent-text)',
                            fontSize: '10px',
                          }}
                        >
                          {ch.title.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 w-full">
                        <p
                          className="text-xs font-medium truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {ch.title}
                        </p>
                        {ch.handle && (
                          <p
                            className="text-[10px] truncate"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {ch.handle}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── or ── divider */}
        <div className="mt-6 flex w-full items-center gap-4">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        {/* Add channel by URL */}
        <div className="mt-6 w-full">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2 text-left"
            style={{ color: 'var(--text-muted)' }}
          >
            Add a channel by URL
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="youtube.com/@channel"
              value={addUrl}
              onChange={(e) => { setAddUrl(e.target.value); setAddError('') }}
              onKeyDown={(e) => e.key === 'Enter' && !addLoading && handleAddUrl()}
              className="h-9 text-xs"
              style={{ borderColor: addError ? 'var(--red)' : 'var(--border)' }}
            />
            <Button
              onClick={handleAddUrl}
              disabled={addLoading || !addUrl.trim()}
              className="h-9 px-3.5 text-xs shrink-0"
              style={{ background: 'var(--accent)', color: '#ffffff' }}
            >
              {addLoading ? <Loader2 size={12} className="animate-spin" /> : 'Add'}
            </Button>
          </div>
          {addError && (
            <p className="text-[11px] mt-1 text-left" style={{ color: 'var(--red-text)' }}>{addError}</p>
          )}
        </div>

        {/* Start comparison */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {selectedIds.length}/3 channels selected
          </span>
          <Button
            onClick={handleStart}
            disabled={selectedIds.length < 2}
            className="h-10 cursor-pointer gap-2 px-5 text-sm font-medium border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.2)] transition-shadow duration-300 ease-out hover:shadow-[inset_0_2px_14px_rgba(255,255,255,0.18),inset_0_-3px_16px_rgba(0,0,0,0.22)]"
            style={{ background: 'var(--accent)', color: '#ffffff' }}
          >
            <GitCompare size={15} className="shrink-0" aria-hidden />
            Start comparison
            <ArrowRight size={14} className="shrink-0" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─── Loading Skeleton ─── */

const skLoad = '!bg-[var(--skeleton-on-canvas)]'

function CompareLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-5">
        <Skeleton className={cn('h-7 w-40 rounded-md', skLoad)} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0, 1].map(i => (
            <Card
              key={i}
              className="shadow-none gap-0 py-0"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
            >
              <CardContent className="flex items-center gap-4 p-5">
                <Skeleton className={cn('h-14 w-14 shrink-0 rounded-full', skLoad)} />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className={cn('h-5 w-40 max-w-full rounded-md', skLoad)} />
                  <Skeleton className={cn('h-3 w-28 rounded-md', skLoad)} />
                  <Skeleton className={cn('h-3 w-52 max-w-full rounded-md', skLoad)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <Skeleton className={cn('h-7 w-56 rounded-md', skLoad)} />
        <Card className="shadow-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <CardHeader className="pb-3">
            <Skeleton className={cn('h-4 w-48 rounded-md', skLoad)} />
            <Skeleton className={cn('mt-2 h-3 w-full max-w-md rounded-md', skLoad)} />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-hidden rounded-md" style={{ border: '1px solid var(--border-subtle)' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex justify-between gap-4 border-b border-dashed border-[var(--border)] px-3 py-2.5 last:border-b-0"
                >
                  <Skeleton className={cn('h-4 w-32 rounded-md', skLoad)} />
                  <Skeleton className={cn('h-4 w-16 rounded-md', skLoad)} />
                  <Skeleton className={cn('h-4 w-16 rounded-md', skLoad)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-5">
        <Skeleton className={cn('h-7 w-52 rounded-md', skLoad)} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map(i => (
            <Card key={i} className="shadow-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
              <CardHeader className="pb-3">
                <Skeleton className={cn('h-4 w-36 rounded-md', skLoad)} />
                <Skeleton className={cn('mt-2 h-3 w-full max-w-sm rounded-md', skLoad)} />
              </CardHeader>
              <CardContent>
                <Skeleton className={cn('h-[260px] w-full rounded-md', skLoad)} />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <Skeleton className={cn('h-7 w-48 rounded-md', skLoad)} />
        <Card className="shadow-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <CardHeader className="pb-3">
            <Skeleton className={cn('h-4 w-44 rounded-md', skLoad)} />
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <Skeleton className={cn('h-4 w-full rounded-md', skLoad)} />
            <Skeleton className={cn('h-4 max-w-[90%] rounded-md', skLoad)} />
            <Skeleton className={cn('h-4 w-full rounded-md', skLoad)} />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
