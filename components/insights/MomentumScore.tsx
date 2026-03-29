'use client'

import { useEffect, useState } from 'react'
import { useCountUp } from '@/lib/hooks/useCountUp'
import { MomentumSparkline } from '@/components/charts/MomentumSparkline'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import type { ChannelMetrics } from '@/lib/types'

const labelColors: Record<string, string> = {
  Accelerating: 'var(--green-text)',
  Stable: 'var(--accent-text)',
  Slowing: 'var(--amber-text)',
  Dormant: 'var(--red-text)',
}

const labelBg: Record<string, string> = {
  Accelerating: 'var(--green-subtle)',
  Stable: 'var(--accent-subtle)',
  Slowing: 'var(--amber-subtle)',
  Dormant: 'var(--red-subtle)',
}

interface MomentumScoreProps {
  metrics: ChannelMetrics
  sparklineData?: { month: string; score: number }[]
  uploadDayCounts?: Record<number, number>
}

export function MomentumScoreWidget({ metrics, sparklineData, uploadDayCounts }: MomentumScoreProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const animatedScore = useCountUp(metrics.momentumScore, 600, mounted)

  const growthDir = metrics.viewsGrowthPct >= 0 ? 'up' : 'down'
  const explanation = `Views ${growthDir} ${Math.abs(metrics.viewsGrowthPct).toFixed(0)}% vs prior 30 days. Upload pace: ${metrics.uploadFrequency}.`

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const uploadConsistencyTooltip =
    'Measured by the standard deviation of days between uploads. Very consistent = posts within ~1 day of their usual schedule. Irregular = unpredictable gaps.' +
    (metrics.uploadConsistency.detail ? ` ${metrics.uploadConsistency.detail}` : '')

  const cardClass = 'rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6'

  return (
    <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2 fade-in">
      <div className={`${cardClass} flex min-h-0 flex-col lg:h-full`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color: 'var(--text-secondary)' }}
              >
                Momentum Score
              </p>
              <InfoTooltip text="A 0\u2013100 score combining three signals: views growth vs the prior 30 days (40 pts), upload pace vs prior 30 days (30 pts), and engagement trend across the last 10 videos (30 pts). 80+ = Accelerating, 50\u201379 = Stable, 25\u201349 = Slowing, 0\u201324 = Dormant." />
            </div>
            <div className="flex items-end gap-3 mt-2">
              <span
                className="text-5xl font-bold tabular-nums text-white"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontVariantNumeric: 'tabular-nums',
                  color: '#ffffff',
                }}
              >
                {mounted ? animatedScore : metrics.momentumScore}
              </span>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-md mb-1 border border-solid"
                style={{
                  background: labelBg[metrics.momentumLabel],
                  color: labelColors[metrics.momentumLabel],
                  borderColor: `color-mix(in srgb, ${labelColors[metrics.momentumLabel]} 28%, transparent)`,
                }}
              >
                {metrics.momentumLabel}
              </span>
            </div>
          </div>

          {sparklineData && sparklineData.length > 0 && (
            <div className="w-full shrink-0 sm:w-32">
              <MomentumSparkline data={sparklineData} />
            </div>
          )}
        </div>

        <div
          className="mt-4 pt-2 border-t border-dashed"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <p className="text-xs leading-snug" style={{ color: 'var(--text-secondary)' }}>
            {explanation}
          </p>
        </div>
      </div>

      <div className={`${cardClass} flex h-full min-h-0 flex-col`}>
        <div className="shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <p
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: 'var(--text-secondary)' }}
            >
              Upload Consistency
            </p>
            <InfoTooltip text={uploadConsistencyTooltip} />
          </div>
          <p className="text-lg font-semibold leading-snug" style={{ color: '#ffffff' }}>
            {metrics.uploadConsistency.label}
          </p>
        </div>

        {uploadDayCounts && (
          <div className="mt-auto flex w-full min-w-0 gap-1.5 pt-4">
            {days.map((day, idx) => {
              const count = uploadDayCounts[idx] ?? 0
              const maxCount = Math.max(...Object.values(uploadDayCounts), 1)
              const isFilled = count > maxCount * 0.3
              return (
                <div
                  key={day}
                  className="flex min-w-0 flex-1 basis-0 flex-col items-stretch gap-1.5"
                >
                  <div
                    className="h-5 w-full shrink-0 rounded-sm"
                    style={{
                      background: isFilled ? 'var(--accent)' : 'var(--border-subtle)',
                      opacity: isFilled ? 1 : 0.45,
                      ...(isFilled
                        ? { boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.28)' }
                        : {}),
                    }}
                  />
                  <span
                    className="w-full truncate text-center text-[10px] leading-tight"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {day}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
