'use client'

import type { ChannelSnapshot } from '@/lib/snapshots'
import type { ChannelMetrics, ChannelInfo } from '@/lib/types'
import { formatNumber } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react'

interface AnalysisDiffProps {
  current: {
    channel: ChannelInfo
    metrics: ChannelMetrics
  }
  previous: ChannelSnapshot
}

interface DiffItem {
  label: string
  previous: number
  current: number
  format: (n: number) => string
  higherIsBetter: boolean
}

function DiffRow({ item }: { item: DiffItem }) {
  const diff = item.current - item.previous
  const pct = item.previous === 0
    ? 0
    : Math.abs((diff / item.previous) * 100)
  const isPositive = item.higherIsBetter ? diff > 0 : diff < 0
  const isNeutral = pct < 1

  if (isNeutral) {
    return (
      <div className="flex items-center gap-1.5">
        <Minus size={11} style={{ color: 'var(--text-muted)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {item.label} unchanged
        </span>
      </div>
    )
  }

  const Icon = diff > 0 ? TrendingUp : TrendingDown
  const color = isPositive ? 'var(--green-text)' : 'var(--red-text)'

  return (
    <div className="flex items-center gap-1.5">
      <Icon size={11} style={{ color }} />
      <span className="text-xs" style={{ color }}>
        {item.label}: {item.format(item.previous)} → {item.format(item.current)}
        {' '}({diff > 0 ? '+' : ''}{pct.toFixed(0)}%)
      </span>
    </div>
  )
}

export default function AnalysisDiff({ current, previous }: AnalysisDiffProps) {
  const timeAgo = formatDistanceToNow(
    new Date(previous.snapshottedAt),
    { addSuffix: true }
  )

  const items: DiffItem[] = [
    {
      label: 'Subscribers',
      previous: previous.subscriberCount,
      current: current.channel.subscriberCount,
      format: formatNumber,
      higherIsBetter: true,
    },
    {
      label: 'Momentum',
      previous: previous.momentumScore,
      current: current.metrics.momentumScore,
      format: n => `${n}/100`,
      higherIsBetter: true,
    },
    {
      label: 'Avg views',
      previous: previous.avgViewsPerVideo,
      current: Math.round(current.metrics.avgViews),
      format: formatNumber,
      higherIsBetter: true,
    },
    {
      label: 'Engagement',
      previous: parseFloat(String(previous.avgEngagementRate)),
      current: current.metrics.avgEngagementRate,
      format: n => `${n.toFixed(2)}%`,
      higherIsBetter: true,
    },
  ]

  const changed = items.filter(item => {
    const pct = item.previous === 0
      ? 0
      : Math.abs((item.current - item.previous) / item.previous * 100)
    return pct >= 1
  })

  const momentumChanged = previous.momentumLabel !== current.metrics.momentumLabel

  return (
    <div
      className="flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-3 rounded-lg border"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-app)' }}
    >
      <div className="flex items-center gap-2 w-full">
        <Clock size={12} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Changes since your last analysis {timeAgo}
        </span>
      </div>

      {changed.length === 0 && !momentumChanged && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          No significant changes detected
        </p>
      )}

      {momentumChanged && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
            Momentum: {previous.momentumLabel} → {current.metrics.momentumLabel}
          </span>
        </div>
      )}

      {changed.map(item => (
        <DiffRow key={item.label} item={item} />
      ))}
    </div>
  )
}
