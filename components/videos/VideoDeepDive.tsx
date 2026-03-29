'use client'

import { useMemo, type ReactNode } from 'react'
import Image from 'next/image'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn, formatNumber, formatDuration } from '@/lib/utils'
import type { Video, ChannelMetrics, ContentSignals } from '@/lib/types'

const chartConfig = {
  views: { label: 'Est. Cumulative Views', color: 'var(--chart-1)' },
}

interface VideoDeepDiveProps {
  video: Video | null
  metrics: ChannelMetrics
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VideoDeepDive({ video, metrics, open, onOpenChange }: VideoDeepDiveProps) {
  const isMobile = useIsMobile()

  if (!video) return null

  const content = <DeepDiveContent video={video} metrics={metrics} />

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-left">{video.title}</DrawerTitle>
            <DrawerDescription className="sr-only">Video deep dive analysis</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-4 max-h-[70vh]">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto gap-6">
        <SheetHeader>
          <SheetTitle>{video.title}</SheetTitle>
          <SheetDescription className="sr-only">Video deep dive analysis</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-8 p-6 pb-10">
          {content}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DeepDiveContent({ video, metrics }: { video: Video; metrics: ChannelMetrics }) {
  const signals = useMemo(() => computeContentSignals(video, metrics), [video, metrics])
  const velocityCurve = useMemo(() => computeVelocityCurve(video), [video])
  return (
    <div className="flex flex-col gap-10">
      {/* Thumbnail + stats (tight to image) */}
      <div className="flex flex-col gap-2">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden" style={{ background: 'var(--bg-app)' }}>
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, min(384px, 75vw)"
          />
        </div>
        <div
          className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium tabular-nums"
          style={{ color: 'var(--text-primary)' }}
        >
          <span>
            {video.daysLive === 1 ? '1 day' : `${video.daysLive} days`} since posted
          </span>
          <span className="font-normal" style={{ color: 'var(--text-muted)' }}>
            ·
          </span>
          <span>{formatDuration(video.duration)}</span>
          <span className="font-normal" style={{ color: 'var(--text-muted)' }}>
            ·
          </span>
          <span>{formatNumber(Math.round(video.viewsPerDay))} avg views/day</span>
        </div>
      </div>

      {/* Section 1 — Performance vs channel average */}
      <section className="flex flex-col gap-3">
        <SectionTitle>Performance vs channel average</SectionTitle>
        <div className="flex flex-col gap-3">
          <ComparisonMetricCard
            label="Views"
            videoVal={video.viewCount}
            channelAvg={metrics.avgViews}
          />
          <ComparisonMetricCard
            label="Engagement"
            videoVal={video.engagementRate}
            channelAvg={metrics.avgEngagementRate}
            isPercent
          />
          <ComparisonMetricCard
            label="Comments"
            videoVal={video.commentCount}
            channelAvg={metrics.avgViews > 0 ? (metrics.avgEngagementRate * metrics.avgViews) / 200 : 0}
          />
        </div>
      </section>

      {/* Section 2 — Velocity curve */}
      <section className="flex flex-col gap-3">
        <SectionTitle>Estimated view velocity (modelled)</SectionTitle>
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
        >
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <AreaChart data={velocityCurve}>
            <defs>
              <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(d) => `D${d}`}
            />
            <YAxis
              tickFormatter={(v) => formatNumber(v)}
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="views"
              stroke="var(--chart-1)"
              fill="url(#velocityGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
        </div>
      </section>

      {/* Section 3 — Content signals */}
      <section className="flex flex-col gap-3">
        <SectionTitle>Content signals</SectionTitle>
        <ContentSignalsTable signals={signals} />
      </section>
    </div>
  )
}

/** Matches overview `MetricCard` trend delta styling; shows e.g. 1.2× vs channel avg. */
function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3
      className="text-sm font-semibold"
      style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
    >
      {children}
    </h3>
  )
}

function ContentSignalsTable({ signals }: { signals: ContentSignals }) {
  const rows: { metric: string; value: string; valueEmphasis?: boolean }[] = [
    { metric: 'Title length', value: `${signals.titleLength} chars` },
    { metric: 'Has number', value: signals.hasNumber ? 'Yes' : 'No' },
    { metric: 'Has question', value: signals.hasQuestion ? 'Yes' : 'No' },
    {
      metric: 'Duration',
      value: signals.durationBucket === 'short' ? 'Short (<8 min)' : 'Long (8+ min)',
    },
    {
      metric: 'Upload day',
      value: signals.isOptimalDay ? `${signals.uploadDayName} ✓` : signals.uploadDayName,
      valueEmphasis: signals.isOptimalDay,
    },
    {
      metric: 'Upload hour',
      value: `${signals.uploadHour}:00 UTC${signals.isOptimalHour ? ' ✓' : ''}`,
      valueEmphasis: signals.isOptimalHour,
    },
  ]

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
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
              className="h-9 px-3 text-left text-xs font-medium first:rounded-tl-md last:rounded-tr-md"
              style={{ color: 'var(--text-muted)' }}
            >
              Signal
            </TableHead>
            <TableHead
              className="h-9 px-3 text-right text-xs font-medium first:rounded-tl-md last:rounded-tr-md"
              style={{ color: 'var(--text-muted)' }}
            >
              Value
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => {
            const isLastRow = rowIndex === rows.length - 1
            const rowDivider = !isLastRow
              ? { borderBottom: '1px dashed var(--border)' as const }
              : undefined
            return (
              <TableRow key={row.metric} className="border-0 hover:bg-transparent">
                <TableCell
                  className="px-3 py-2.5 text-sm font-medium"
                  style={{ color: 'var(--text-primary)', ...rowDivider }}
                >
                  {row.metric}
                </TableCell>
                <TableCell
                  className={cn(
                    'px-3 py-2.5 text-right text-sm',
                    row.valueEmphasis ? 'font-medium' : 'font-normal'
                  )}
                  style={{
                    color: row.valueEmphasis ? 'var(--text-primary)' : 'var(--text-secondary)',
                    ...rowDivider,
                  }}
                >
                  {row.value}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function MultiplierDeltaBadge({ ratio }: { ratio: number }) {
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return (
      <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
        —
      </span>
    )
  }
  const isPositive = ratio >= 1
  const fg = isPositive ? 'var(--green-text)' : 'var(--red-text)'
  const borderSoft = isPositive
    ? 'color-mix(in srgb, var(--green-text) 28%, transparent)'
    : 'color-mix(in srgb, var(--red-text) 28%, transparent)'
  const Icon = isPositive ? TrendingUp : TrendingDown

  return (
    <span
      className="badge-pulse inline-flex items-center gap-1 rounded-md border border-solid px-2 py-0.5 text-xs font-medium"
      style={{
        background: isPositive ? 'var(--green-subtle)' : 'var(--red-subtle)',
        color: fg,
        borderColor: borderSoft,
      }}
    >
      <Icon size={10} />
      {ratio.toFixed(1)}×
    </span>
  )
}

function ComparisonMetricCard({
  label,
  videoVal,
  channelAvg,
  isPercent = false,
}: {
  label: string
  videoVal: number
  channelAvg: number
  isPercent?: boolean
}) {
  const maxVal = Math.max(videoVal, channelAvg, 1)
  const videoPct = Math.min((videoVal / maxVal) * 100, 100)
  const avgPct = Math.min((channelAvg / maxVal) * 100, 100)
  const ratio = channelAvg > 0 ? videoVal / channelAvg : 0

  return (
    <Card
      className="shadow-none gap-0 py-0"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
    >
      <CardContent className="flex flex-col gap-3 p-4">
        <div>
          <p
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: 'var(--text-secondary)' }}
          >
            {label}
          </p>
          <div className="mt-2 flex items-end gap-3">
            <p
              className="text-2xl font-bold tabular-nums"
              style={{
                fontFamily: 'var(--font-display)',
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--text-primary)',
              }}
            >
              {isPercent ? `${videoVal.toFixed(1)}%` : formatNumber(videoVal)}
            </p>
            <MultiplierDeltaBadge ratio={ratio} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>
              This video
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-sm" style={{ background: 'var(--border-subtle)' }}>
              <div
                className="h-full rounded-sm"
                style={{ width: `${videoPct}%`, background: 'var(--accent)' }}
              />
            </div>
            <span className="w-12 text-right text-[10px] tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {isPercent ? `${videoVal.toFixed(1)}%` : formatNumber(videoVal)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Ch. avg
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-sm" style={{ background: 'var(--border-subtle)' }}>
              <div
                className="h-full rounded-sm"
                style={{ width: `${avgPct}%`, background: 'var(--text-muted)' }}
              />
            </div>
            <span className="w-12 text-right text-[10px] tabular-nums" style={{ color: 'var(--text-secondary)' }}>
              {isPercent ? `${channelAvg.toFixed(1)}%` : formatNumber(channelAvg)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Utility functions ---

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function computeContentSignals(video: Video, metrics: ChannelMetrics): ContentSignals {
  const publishDate = new Date(video.publishedAt)
  const dayOfWeek = publishDate.getUTCDay()
  const hour = publishDate.getUTCHours()

  return {
    titleLength: video.title.length,
    hasNumber: /\d/.test(video.title),
    hasQuestion: /\?|how|why|what|when|where|which|who/i.test(video.title),
    durationBucket: video.durationSeconds < 480 ? 'short' : 'long',
    uploadDayName: DAY_NAMES[dayOfWeek],
    uploadHour: hour,
    isOptimalDay: DAY_NAMES[dayOfWeek] === metrics.bestDayOfWeek,
    isOptimalHour: Math.abs(hour - parseInt(metrics.bestTimeOfDay, 10)) <= 2,
  }
}

// TODO V2: Replace modelled velocity curve with real time-series data.
// Currently we model view accumulation based on performance tier (hot/average/etc.)
// because the YouTube API does not expose historical view counts per video.
// A real implementation would snapshot view counts daily via a cron job.
function computeVelocityCurve(video: Video): { day: number; views: number }[] {
  const totalViews = video.viewCount
  const tier = video.performanceTier
  const daysLive = Math.max(video.daysLive, 1)

  // Model view accumulation
  const viralPct = tier === 'hot' ? 0.6 : tier === 'rising' ? 0.45 : 0.3
  const points: { day: number; views: number }[] = []
  const maxDay = Math.min(daysLive, 60)

  for (let d = 1; d <= maxDay; d++) {
    let cumulative: number
    if (d <= 3) {
      // Viral window
      cumulative = totalViews * viralPct * (d / 3)
    } else if (d <= 30) {
      // Decay curve
      const viralViews = totalViews * viralPct
      const remaining = totalViews - viralViews
      const decayProgress = (d - 3) / 27
      cumulative = viralViews + remaining * 0.7 * (1 - Math.exp(-3 * decayProgress))
    } else {
      // Long tail
      const dayPast30 = d - 30
      const at30 = totalViews * (viralPct + (1 - viralPct) * 0.7 * (1 - Math.exp(-3)))
      cumulative = at30 + (totalViews - at30) * (dayPast30 / (maxDay - 30))
    }
    points.push({ day: d, views: Math.round(Math.min(cumulative, totalViews)) })
  }

  return points
}

