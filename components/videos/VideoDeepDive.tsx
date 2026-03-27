'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import { formatNumber, formatDate, formatDuration } from '@/lib/utils'
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
      <SheetContent side="right" className="sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{video.title}</SheetTitle>
          <SheetDescription className="sr-only">Video deep dive analysis</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          {content}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DeepDiveContent({ video, metrics }: { video: Video; metrics: ChannelMetrics }) {
  const signals = useMemo(() => computeContentSignals(video, metrics), [video, metrics])
  const velocityCurve = useMemo(() => computeVelocityCurve(video), [video])
  const sentence = useMemo(() => buildPerformanceSentence(video, signals, metrics), [video, signals, metrics])

  return (
    <div className="flex flex-col gap-5">
      {/* Thumbnail */}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden" style={{ background: 'var(--bg-app)' }}>
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          className="object-cover"
          sizes="480px"
        />
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>{formatDate(video.publishedAt)}</span>
        <span>·</span>
        <span>{formatDuration(video.duration)}</span>
        <span>·</span>
        <span className="tabular-nums">{formatNumber(Math.round(video.viewsPerDay))} views/day</span>
      </div>

      {/* Section 1 — Performance vs channel average */}
      <div
        className="rounded-xl border p-4 flex flex-col gap-3"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
      >
        <h3 className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          Performance vs Channel Average
        </h3>
        <ComparisonBar
          label="Views"
          videoVal={video.viewCount}
          channelAvg={metrics.avgViews}
        />
        <ComparisonBar
          label="Engagement"
          videoVal={video.engagementRate}
          channelAvg={metrics.avgEngagementRate}
          isPercent
        />
        <ComparisonBar
          label="Comments"
          videoVal={video.commentCount}
          channelAvg={metrics.avgViews > 0 ? metrics.avgEngagementRate * metrics.avgViews / 200 : 0}
        />
      </div>

      {/* Section 2 — Velocity curve */}
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
      >
        <h3 className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
          Estimated View Velocity (Modelled)
        </h3>
        <ChartContainer config={chartConfig} className="h-[160px] w-full">
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

      {/* Section 3 — Content signals */}
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
      >
        <h3 className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
          Content Signals
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <SignalItem label="Title length" value={`${signals.titleLength} chars`} />
          <SignalItem label="Has number" value={signals.hasNumber ? 'Yes' : 'No'} />
          <SignalItem label="Has question" value={signals.hasQuestion ? 'Yes' : 'No'} />
          <SignalItem label="Duration" value={signals.durationBucket === 'short' ? 'Short (<8 min)' : 'Long (8+ min)'} />
          <SignalItem label="Upload day" value={signals.uploadDayName} highlight={signals.isOptimalDay} />
          <SignalItem label="Upload hour" value={`${signals.uploadHour}:00 UTC`} highlight={signals.isOptimalHour} />
        </div>
      </div>

      {/* Section 4 — Performance one-liner */}
      {sentence && (
        <p
          className="text-sm italic px-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          {sentence}
        </p>
      )}
    </div>
  )
}

function ComparisonBar({
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
  const ratio = channelAvg > 0 ? (videoVal / channelAvg) : 0
  const isAbove = ratio > 1

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span
          className="font-medium tabular-nums"
          style={{ color: isAbove ? 'var(--green-text)' : ratio < 1 ? 'var(--red-text)' : 'var(--text-primary)' }}
        >
          {ratio > 0 ? `${ratio.toFixed(1)}×` : '—'}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] w-16 shrink-0" style={{ color: 'var(--text-muted)' }}>This video</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${videoPct}%`, background: 'var(--accent)' }}
            />
          </div>
          <span className="text-[10px] tabular-nums w-12 text-right" style={{ color: 'var(--text-primary)' }}>
            {isPercent ? `${videoVal.toFixed(1)}%` : formatNumber(videoVal)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] w-16 shrink-0" style={{ color: 'var(--text-muted)' }}>Ch. avg</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${avgPct}%`, background: 'var(--text-muted)' }}
            />
          </div>
          <span className="text-[10px] tabular-nums w-12 text-right" style={{ color: 'var(--text-secondary)' }}>
            {isPercent ? `${channelAvg.toFixed(1)}%` : formatNumber(channelAvg)}
          </span>
        </div>
      </div>
    </div>
  )
}

function SignalItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <p
        className="text-sm font-medium"
        style={{ color: highlight ? 'var(--green-text)' : 'var(--text-primary)' }}
      >
        {value}
        {highlight && ' ✓'}
      </p>
    </div>
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

function buildPerformanceSentence(video: Video, signals: ContentSignals, metrics: ChannelMetrics): string {
  const parts: string[] = []

  const ratio = (video.viewCount / Math.max(metrics.avgViews, 1)).toFixed(1)
  if (parseFloat(ratio) > 1.2) {
    parts.push(`Outperformed the channel average by ${ratio}×`)
  } else if (parseFloat(ratio) < 0.8) {
    parts.push(`Underperformed the channel average by ${ratio}×`)
  }

  const strengths: string[] = []
  if (signals.hasNumber) strengths.push('numbered title')
  if (signals.hasQuestion) strengths.push('question-format title')
  if (signals.durationBucket === 'short') strengths.push('short-form format')
  if (signals.durationBucket === 'long') strengths.push('long-form format')
  if (signals.isOptimalDay) strengths.push(`posted on their strongest day (${signals.uploadDayName})`)

  if (strengths.length > 0) {
    parts.push(`driven by ${strengths.slice(0, 2).join(' and ')}`)
  }

  return parts.length > 0 ? parts.join(' — ') + '.' : ''
}
