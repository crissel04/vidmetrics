'use client'

import { Zap } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { parseDurationSeconds } from '@/lib/metrics'
import type { Video, ChannelMetrics } from '@/lib/types'

interface TopTakeawaysProps {
  videos: Video[]
  metrics: ChannelMetrics
}

export function TopTakeaways({ videos, metrics }: TopTakeawaysProps) {
  if (videos.length === 0) return null

  const takeaways = computeTakeaways(videos, metrics)

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={16} style={{ color: 'var(--accent)' }} />
        <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          Key Takeaways
        </h3>
      </div>
      <div className="space-y-3">
        {takeaways.map((t, i) => (
          <div key={i} className="flex gap-3">
            <span
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
            >
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {t}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function computeTakeaways(videos: Video[], metrics: ChannelMetrics): string[] {
  const takeaways: string[] = []

  // Takeaway 1: Top video outperformance
  const sorted = [...videos].sort((a, b) => b.viewCount - a.viewCount)
  const topVideo = sorted[0]
  if (topVideo && metrics.avgViews > 0) {
    const ratio = (topVideo.viewCount / metrics.avgViews).toFixed(1)
    takeaways.push(
      `Their top video outperformed their channel average by ${ratio}\u00D7`
    )
  }

  // Takeaway 2: Duration vs performance
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
    // Fallback: best engagement video
    const bestEng = [...videos].sort((a, b) => b.engagementRate - a.engagementRate)[0]
    if (bestEng) {
      const title = bestEng.title.length > 40 ? bestEng.title.slice(0, 40) + '...' : bestEng.title
      takeaways.push(
        `"${title}" has the highest engagement at ${bestEng.engagementRate.toFixed(2)}%`
      )
    }
  }

  // Takeaway 3: Upload pace change
  const now = Date.now()
  const last30 = videos.filter(v => (now - new Date(v.publishedAt).getTime()) / (1000 * 60 * 60 * 24) <= 30).length
  const prev30 = videos.filter(v => {
    const days = (now - new Date(v.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    return days > 30 && days <= 60
  }).length
  const pctChange = prev30 > 0
    ? ((last30 - prev30) / prev30 * 100)
    : 0
  const direction = pctChange >= 0 ? 'more' : 'fewer'
  takeaways.push(
    `Posted ${Math.abs(pctChange).toFixed(0)}% ${direction} videos in the last 30 days vs prior period`
  )

  return takeaways.slice(0, 3)
}
