'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Minus, TrendingUp, TrendingDown, Check, BookmarkPlus, Loader2, GitCompare, Plus, ArrowUp, ArrowRight, Trophy, Lightbulb } from 'lucide-react'
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
import { cn, formatNumber, normalizeChannelInput } from '@/lib/utils'
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
import { computeContentStrategy, computeTitlePatterns } from '@/lib/metrics'
import { useChannelCache } from '@/lib/context/ChannelCacheContext'
import { useChannelTabs } from '@/lib/hooks/useChannelTabs'
import { useSettings } from '@/lib/context/SettingsContext'
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

const CHART_COLORS = ['var(--accent)', 'var(--chart-5)', 'var(--chart-4)', 'var(--chart-2)']
const BAR_RADIUS: [number, number, number, number] = [3, 3, 0, 0]
const BAR_RADIUS_H: [number, number, number, number] = [0, 3, 3, 0]
const axisTick = { fontSize: 10, fill: 'var(--text-muted)' }

// Module-level cache: persists across component mounts within the same browser session.
// Keyed by sorted channel IDs so revisiting a comparison tab never re-fires the AI request.
const aiComparisonSessionCache = new Map<string, AIComparison>()


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
  const { settings } = useSettings()

  // Build cache key from sorted channel IDs so we detect when we already have data
  const allIds = [channelAId, channelBId, channelCId].filter(Boolean).sort()
  const cacheKey = allIds.join(',')

  // Try to build result from client-side cache on first render
  const [data, setData] = useState<CompareResult | null>(() => {
    if (!channelAId || !channelBId) return null
    const a = channelCache.get(channelAId)
    const b = channelCache.get(channelBId)
    const c = channelCId ? channelCache.get(channelCId) : undefined
    if (!a || !b || (channelCId && !c)) return null
    return { channelA: a, channelB: b, channelC: c, aiComparison: { whoIsWinning: '', channelStrengths: {}, gapOpportunity: '' } }
  })
  const [loading, setLoading] = useState(!data)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)

  // Stable refs so the fetch effect doesn't depend on context/callback identity
  const channelCacheRef = useRef(channelCache)
  channelCacheRef.current = channelCache
  const updateComparisonTabRef = useRef(updateComparisonTab)
  updateComparisonTabRef.current = updateComparisonTab
  // Track which channel set we've already fetched to avoid duplicate requests
  const fetchedKeyRef = useRef<string | null>(data ? cacheKey : null)

  useEffect(() => {
    if (!channelAId || !channelBId) {
      setError('Two channel IDs are required for comparison')
      setData(null)
      setLoading(false)
      return
    }

    // Skip fetch if we already have data for these exact channels
    if (fetchedKeyRef.current === cacheKey && data) {
      setLoading(false)
      return
    }

    // Check if all channels are already in client cache (e.g. from analysis page)
    const cachedA = channelCacheRef.current.get(channelAId)
    const cachedB = channelCacheRef.current.get(channelBId)
    const cachedC = channelCId ? channelCacheRef.current.get(channelCId) : undefined
    if (cachedA && cachedB && (!channelCId || cachedC)) {
      // Build comparison from cached data — show channel data immediately
      const sessionAI = aiComparisonSessionCache.get(cacheKey)
      setData({ channelA: cachedA, channelB: cachedB, channelC: cachedC, aiComparison: sessionAI ?? { whoIsWinning: '', channelStrengths: {}, gapOpportunity: '' } })
      fetchedKeyRef.current = cacheKey
      setLoading(false)

      // If we already have AI in the session cache, no need to re-fetch
      if (sessionAI) return

      // Fetch AI insights in background
      setAiLoading(true)
      const bodyData: Record<string, string | number> = {
        channelAUrl: `https://www.youtube.com/channel/${channelAId}`,
        channelBUrl: `https://www.youtube.com/channel/${channelBId}`,
        maxVideos: settings.videosToFetch,
      }
      if (channelCId) bodyData.channelCUrl = `https://www.youtube.com/channel/${channelCId}`

      fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      })
        .then(res => res.json())
        .then(json => {
          if (json.aiComparison) {
            aiComparisonSessionCache.set(cacheKey, json.aiComparison)
            setData(prev => prev ? { ...prev, aiComparison: json.aiComparison } : prev)
          }
        })
        .catch(() => {})
        .finally(() => setAiLoading(false))
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    async function fetchComparison() {
      try {
        const bodyData: Record<string, string | number> = {
          channelAUrl: `https://www.youtube.com/channel/${channelAId}`,
          channelBUrl: `https://www.youtube.com/channel/${channelBId}`,
          maxVideos: settings.videosToFetch,
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

        // Set data FIRST, before any side effects that could trigger re-renders
        setData(json)
        fetchedKeyRef.current = cacheKey

        // Cache AI result for this session so tab revisits don't re-fetch
        if (json.aiComparison) {
          aiComparisonSessionCache.set(cacheKey, json.aiComparison)
        }

        // Pre-populate channel cache so tab switches are instant
        const results = [json.channelA, json.channelB]
        if (json.channelC) results.push(json.channelC)
        results.forEach((r: ChannelData) => {
          channelCacheRef.current.set(r.channel.id, r)
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
          updateComparisonTabRef.current(compareTabId, { name, channels: tabChannels })
        }
      } catch {
        if (!cancelled) setError('Network error — please try again')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchComparison()

    return () => { cancelled = true }
    // Only re-fetch when channel IDs actually change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, compareTabId])

  const channels = data ? [data.channelA, data.channelB, ...(data.channelC ? [data.channelC] : [])] : []


  // Not enough channels — show empty state with channel selector
  if (!channelAId || !channelBId) {
    return (
      <CompareEmptyState compareTabId={compareTabId} />
    )
  }

  if (error && !data) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p style={{ color: 'var(--red-text)' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (!data && loading) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4 sm:px-6 sm:pt-6">
        <CompareLoadingSkeleton />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pt-4 sm:px-6 sm:pt-6 fade-in">
      <div className="flex flex-col gap-8">
      {user && channels.length >= 2 && (
        <div className="flex justify-end">
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
        </div>
      )}

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
              <ViewsPerVideoCard channels={channels} />
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
              loading={aiLoading}
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
  const gridLine = 'color-mix(in srgb, var(--border-strong) 32%, transparent)'
  return (
    <div className={`grid gap-4 ${channels.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
      {channels.map((ch) => (
        <div
          key={ch.channel.id}
          className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]"
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            aria-hidden
            style={{
              backgroundImage: `linear-gradient(to right, ${gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${gridLine} 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent, black)',
              maskImage: 'linear-gradient(to bottom, transparent, black)',
            }}
          />
          <div className="relative z-[1] flex items-center gap-4 p-5">
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
              <p className="mt-1.5 text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                {formatNumber(ch.channel.subscriberCount)} subs · {formatNumber(ch.channel.videoCount)} videos · {formatNumber(ch.channel.viewCount)} views
              </p>
              {ch.metrics.category && (
                <span
                  className="mt-1.5 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full capitalize"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', border: '1px solid color-mix(in srgb, var(--accent-text) 28%, transparent)' }}
                >
                  {ch.metrics.category}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
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
    <Card className="shadow-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
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
          className="overflow-x-auto rounded-md"
          style={{ border: '1px solid var(--border-subtle)' }}
        >
          <Table className="border-separate border-spacing-0 min-w-[400px]">
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
                    <span className="inline-flex items-center justify-end gap-1.5">
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage src={ch.channel.thumbnailUrl} alt={ch.channel.title} />
                        <AvatarFallback style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', fontSize: '8px' }}>
                          {ch.channel.title.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      {ch.channel.title.length > 18 ? `${ch.channel.title.slice(0, 18)}…` : ch.channel.title}
                    </span>
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
                          className={cn(
                            'px-3 py-3 text-right text-sm tabular-nums',
                            isWinner ? 'font-semibold' : 'font-medium'
                          )}
                          style={{
                            color: 'var(--text-primary)',
                            ...rowDivider,
                          }}
                        >
                          <span className="inline-flex items-center justify-end gap-1.5">
                            {metric.format(val)}
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

/* ─── Card 4: Views per video (avg) ─── */

function ViewsPerVideoCard({ channels }: { channels: ChannelData[] }) {
  // Build per-month average views per video for last 6 months
  const now = new Date()
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    months.push(format(startOfMonth(subMonths(now, i)), 'yyyy-MM'))
  }

  const chartData = months.map(month => {
    const row: Record<string, string | number> = { month: format(new Date(month + '-01'), 'MMM yy') }
    channels.forEach((ch, ci) => {
      const vidsInMonth = ch.videos.filter(v => format(new Date(v.publishedAt), 'yyyy-MM') === month)
      const avg = vidsInMonth.length > 0
        ? Math.round(vidsInMonth.reduce((s, v) => s + v.viewCount, 0) / vidsInMonth.length)
        : 0
      row[`ch${ci}`] = avg
    })
    return row
  })

  // Check if there's enough data
  const hasData = chartData.some(row => channels.some((_, ci) => (row[`ch${ci}`] as number) > 0))

  if (!hasData) {
    return (
      <ChartCard
        title="Views per video"
        description="Average views per video by month. Shows which channel gets more traction per upload."
      >
        <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>
          Not enough video data to render this chart.
        </p>
      </ChartCard>
    )
  }

  const config: Record<string, { label: string; color: string }> = {}
  channels.forEach((ch, ci) => {
    config[`ch${ci}`] = { label: ch.channel.title, color: CHART_COLORS[ci % CHART_COLORS.length] }
  })

  return (
    <ChartCard
      title="Views per video"
      description="Average views per video by month. Shows which channel gets more traction per upload."
    >
      <ChartContainer config={config} className="min-h-[220px] w-full">
        <BarChart data={chartData} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="month" tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(v) => formatNumber(v)} tick={axisTick} tickLine={false} axisLine={false} />
          <ChartTooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              return (
                <div
                  className="rounded-lg border px-2.5 py-1.5 text-xs"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                >
                  <p className="mb-1 font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                  {payload.map((p) => (
                    <p key={p.dataKey as string} style={{ color: p.color }}>
                      {config[p.dataKey as string]?.label}: {formatNumber(p.value as number)}
                    </p>
                  ))}
                </div>
              )
            }}
          />
          {channels.map((_, ci) => (
            <Bar
              key={`ch${ci}`}
              dataKey={`ch${ci}`}
              radius={BAR_RADIUS}
              fill={CHART_COLORS[ci % CHART_COLORS.length]}
              fillOpacity={0.85}
            />
          ))}
        </BarChart>
      </ChartContainer>
      <InlineChartLegend channels={channels} />
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
        <div className="overflow-x-auto rounded-md" style={{ border: '1px solid var(--border-subtle)' }}>
          <Table className="border-separate border-spacing-0 min-w-[400px]">
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
                    <span className="inline-flex items-center justify-end gap-1.5">
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage src={s.channel.thumbnailUrl} alt={s.channel.title} />
                        <AvatarFallback style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', fontSize: '8px' }}>
                          {s.channel.title.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      {s.channel.title.length > 18 ? `${s.channel.title.slice(0, 18)}…` : s.channel.title}
                    </span>
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
        <div className="overflow-x-auto rounded-md" style={{ border: '1px solid var(--border-subtle)' }}>
          <Table className="border-separate border-spacing-0 min-w-[400px]">
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
                    <span className="inline-flex items-center justify-end gap-1.5">
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage src={s.channel.thumbnailUrl} alt={s.channel.title} />
                        <AvatarFallback style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', fontSize: '8px' }}>
                          {s.channel.title.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      {s.channel.title.length > 18 ? `${s.channel.title.slice(0, 18)}…` : s.channel.title}
                    </span>
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
    <div
      className={cn(
        'grid gap-6',
        channels.length === 3 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'
      )}
    >
      {patterns.map(({ channel, patterns: p }) => (
        <div key={channel.id} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={channel.thumbnailUrl} alt={channel.title} />
              <AvatarFallback style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', fontSize: '9px' }}>
                {channel.title.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <p
              className="text-sm font-semibold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              {channel.title}
            </p>
          </div>
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
      ))}
    </div>
  )
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-lg font-bold tabular-nums" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  )
}

/* ─── AI Competitive Intelligence ─── */

function AIIntelligenceSection({ aiComparison, channels, loading }: { aiComparison: AIComparison; channels: ChannelData[]; loading?: boolean }) {
  const hasContent = aiComparison.whoIsWinning || Object.keys(aiComparison.channelStrengths).length > 0 || aiComparison.gapOpportunity

  if (loading && !hasContent) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
        <div className={cn('grid gap-4', channels.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2')}>
          {channels.map(ch => (
            <div key={ch.channel.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!hasContent && !loading) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        AI insights are not available for this comparison.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {aiComparison.whoIsWinning && (
        <Card className="shadow-none gap-0 py-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <CardContent className="px-4 py-4 sm:px-5">
            <div
              className="mb-2.5 flex items-center gap-2.5 border-b border-dashed pb-2.5"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }} aria-hidden>
                <Trophy size={16} strokeWidth={2} />
              </span>
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
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={ch.channel.thumbnailUrl} alt={ch.channel.title} />
                    <AvatarFallback style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', fontSize: '9px' }}>
                      {ch.channel.title.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
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
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }} aria-hidden>
                <Lightbulb size={16} strokeWidth={2} />
              </span>
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
  const { settings } = useSettings()
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
      const fullUrl = normalizeChannelInput(addUrl)
      const res = await fetch(`/api/channel?url=${encodeURIComponent(fullUrl)}&maxVideos=${settings.videosToFetch}`)
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
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Network error')
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
              placeholder="@channel or paste URL"
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
