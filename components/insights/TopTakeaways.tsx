'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { parseDurationSeconds } from '@/lib/metrics'
import type { Video, ChannelMetrics } from '@/lib/types'

interface TakeawaysProps {
  videos: Video[]
  metrics: ChannelMetrics
}

/** Timeline rows (dots + copy). Vertical rail is optional — ContentInsights draws a full-height rail from the table. */
export function KeyTakeawaysTimeline({
  videos,
  metrics,
  showVerticalRail = true,
}: TakeawaysProps & { showVerticalRail?: boolean }) {
  if (videos.length === 0) return null

  const takeaways = computeTakeaways(videos, metrics)

  return (
    <ul className="relative m-0 list-none space-y-5 p-0">
      {showVerticalRail && takeaways.length > 1 && (
        <div
          className="pointer-events-none absolute left-[10px] z-0 w-px -translate-x-1/2"
          style={{
            top: '0.5rem',
            bottom: '0.5rem',
            background: 'var(--border-subtle)',
          }}
          aria-hidden
        />
      )}
      {takeaways.map((t, i) => (
        <li key={i} className="relative z-[1] flex gap-3.5">
          <div className="flex w-5 shrink-0 justify-center pt-1">
            <span
              className="relative z-[2] h-2 w-2 shrink-0 rounded-full"
              style={{
                background: 'var(--bg-card)',
                boxShadow: '0 0 0 1.5px var(--border-strong)',
              }}
              aria-hidden
            />
          </div>
          <p className="min-w-0 flex-1 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t}
          </p>
        </li>
      ))}
    </ul>
  )
}

interface TopTakeawaysProps extends TakeawaysProps {}

export function TopTakeaways({ videos, metrics }: TopTakeawaysProps) {
  if (videos.length === 0) return null

  return (
    <Card style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }} className="shadow-none">
      <CardHeader className="pb-3">
        <CardTitle
          className="text-sm font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Key takeaways
        </CardTitle>
        <CardDescription style={{ color: 'var(--text-muted)' }}>
          Snapshot signals from this channel&apos;s fetched videos.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-5 pt-0">
        <KeyTakeawaysTimeline videos={videos} metrics={metrics} showVerticalRail />
      </CardContent>
    </Card>
  )
}

export function computeTakeaways(videos: Video[], metrics: ChannelMetrics): string[] {
  const takeaways: string[] = []

  const sorted = [...videos].sort((a, b) => b.viewCount - a.viewCount)
  const topVideo = sorted[0]
  if (topVideo && metrics.avgViews > 0) {
    const ratio = (topVideo.viewCount / metrics.avgViews).toFixed(1)
    takeaways.push(`Their top video outperformed their channel average by ${ratio}\u00D7`)
  }

  const shortVideos = videos.filter(v => parseDurationSeconds(v.duration) < 480)
  const longVideos = videos.filter(v => parseDurationSeconds(v.duration) >= 480)

  if (shortVideos.length >= 3 && longVideos.length >= 3) {
    const shortAvg = shortVideos.reduce((s, v) => s + v.viewCount, 0) / shortVideos.length
    const longAvg = longVideos.reduce((s, v) => s + v.viewCount, 0) / longVideos.length
    const winner = shortAvg > longAvg ? 'Short' : 'Long'
    const multiplier = (Math.max(shortAvg, longAvg) / Math.min(shortAvg, longAvg)).toFixed(1)
    takeaways.push(
      `${winner} videos ${winner === 'Short' ? '(<8 min)' : '(8+ min)'} average ${multiplier}\u00D7 more views on this channel`
    )
  } else {
    const bestEng = [...videos].sort((a, b) => b.engagementRate - a.engagementRate)[0]
    if (bestEng) {
      const title = bestEng.title.length > 40 ? bestEng.title.slice(0, 40) + '...' : bestEng.title
      takeaways.push(`"${title}" has the highest engagement at ${bestEng.engagementRate.toFixed(2)}%`)
    }
  }

  const now = Date.now()
  const last30 = videos.filter(v => (now - new Date(v.publishedAt).getTime()) / (1000 * 60 * 60 * 24) <= 30).length
  const prev30 = videos.filter(v => {
    const days = (now - new Date(v.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    return days > 30 && days <= 60
  }).length
  const pctChange = prev30 > 0 ? ((last30 - prev30) / prev30) * 100 : 0
  const direction = pctChange >= 0 ? 'more' : 'fewer'
  takeaways.push(
    `Posted ${Math.abs(pctChange).toFixed(0)}% ${direction} videos in the last 30 days vs prior period`
  )

  return takeaways.slice(0, 3)
}
