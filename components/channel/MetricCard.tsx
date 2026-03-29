'use client'

import { useEffect, useState } from 'react'
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

  const gridLine =
    'color-mix(in srgb, var(--border-strong) 32%, transparent)'

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 fade-in">
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
      <div className="relative z-[1]">
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
        </div>
      </div>
    </div>
  )
}

