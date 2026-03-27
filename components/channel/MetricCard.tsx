'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useCountUp } from '@/lib/hooks/useCountUp'
import { formatNumber } from '@/lib/utils'

import { InfoTooltip } from '@/components/ui/info-tooltip'

interface MetricCardProps {
  label: string
  value: number
  format?: 'number' | 'percent' | 'string'
  stringValue?: string
  trend?: number
  trendLabel?: string
  tooltip?: string
}

export function MetricCard({ label, value, format = 'number', stringValue, trend, trendLabel, tooltip }: MetricCardProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const animatedValue = useCountUp(value, 600, mounted)

  const displayValue = format === 'string'
    ? stringValue
    : format === 'percent'
      ? `${(mounted ? animatedValue / 100 : value / 100).toFixed(2)}%`
      : formatNumber(mounted ? animatedValue : value)

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 fade-in">
      <div className="flex items-center gap-1.5">
        <p
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </p>
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      <div className="flex items-end gap-3 mt-2">
        <p
          className="text-2xl font-bold tabular-nums"
          style={{ fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}
        >
          {displayValue}
        </p>
        {trend !== undefined && (
          <TrendBadge value={trend} label={trendLabel} />
        )}
      </div>
    </div>
  )
}

function TrendBadge({ value, label }: { value: number; label?: string }) {
  const isPositive = value >= 0
  const Icon = isPositive ? TrendingUp : TrendingDown

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium badge-pulse"
      style={{
        background: isPositive ? 'var(--green-subtle)' : 'var(--red-subtle)',
        color: isPositive ? 'var(--green-text)' : 'var(--red-text)',
      }}
    >
      <Icon size={10} />
      {Math.abs(value).toFixed(1)}%
      {label && (
        <span style={{ color: 'var(--text-muted)' }} className="ml-0.5">
          {label}
        </span>
      )}
    </span>
  )
}
