'use client'

import { BarChart2 } from 'lucide-react'
import { parseDurationSeconds } from '@/lib/metrics'
import type { Video } from '@/lib/types'

interface DurationInsightProps {
  videos: Video[]
}

export function DurationInsight({ videos }: DurationInsightProps) {
  const shortVideos = videos.filter(v => parseDurationSeconds(v.duration) < 480)
  const longVideos = videos.filter(v => parseDurationSeconds(v.duration) >= 480)

  // Only render if enough data in each bucket
  if (shortVideos.length < 3 || longVideos.length < 3) return null

  const shortAvg = shortVideos.reduce((s, v) => s + v.viewCount, 0) / shortVideos.length
  const longAvg = longVideos.reduce((s, v) => s + v.viewCount, 0) / longVideos.length
  const winner = shortAvg > longAvg ? 'Short' : 'Long'
  const multiplier = (Math.max(shortAvg, longAvg) / Math.min(shortAvg, longAvg)).toFixed(1)

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg"
      style={{
        background: 'var(--accent-subtle)',
        border: '1px solid var(--border)',
      }}
    >
      <BarChart2 size={16} style={{ color: 'var(--accent)' }} className="shrink-0" />
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        <span style={{ color: 'var(--text-primary)' }} className="font-medium">
          Duration insight:{' '}
        </span>
        {winner} videos ({winner === 'Short' ? '<8 min' : '8+ min'}) average{' '}
        <span style={{ color: 'var(--accent)' }} className="font-medium">
          {multiplier}&times;
        </span>{' '}
        more views on this channel. Consider this when planning content to compete.
      </p>
    </div>
  )
}
