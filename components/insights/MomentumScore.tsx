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

const consistencyColors: Record<string, string> = {
  'very-consistent': 'var(--green-text)',
  'somewhat-consistent': 'var(--amber-text)',
  'irregular': 'var(--red-text)',
  'insufficient-data': 'var(--text-muted)',
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

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 fade-in">
      <div className="flex items-start justify-between">
        <div>
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
              className="text-4xl font-bold tabular-nums"
              style={{
                fontFamily: 'var(--font-display)',
                fontVariantNumeric: 'tabular-nums',
                color: labelColors[metrics.momentumLabel],
              }}
            >
              {mounted ? animatedScore : metrics.momentumScore}
            </span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full mb-1"
              style={{
                background: labelBg[metrics.momentumLabel],
                color: labelColors[metrics.momentumLabel],
              }}
            >
              {metrics.momentumLabel}
            </span>
          </div>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            {explanation}
          </p>
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="w-32">
            <MomentumSparkline data={sparklineData} />
          </div>
        )}
      </div>

      {/* Upload consistency */}
      <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-1.5 mb-2">
          <p
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: 'var(--text-secondary)' }}
          >
            Upload Consistency
          </p>
          <InfoTooltip text="Measured by the standard deviation of days between uploads. Very consistent = posts within ~1 day of their usual schedule. Irregular = unpredictable gaps." />
        </div>
        <p
          className="text-sm font-medium"
          style={{ color: consistencyColors[metrics.uploadConsistency.score] }}
        >
          {metrics.uploadConsistency.label}
        </p>
        {metrics.uploadConsistency.score !== 'insufficient-data' && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {metrics.uploadConsistency.detail}
          </p>
        )}

        {/* 7-day dot grid */}
        {uploadDayCounts && (
          <div className="flex items-center gap-2 mt-3">
            {days.map((day, idx) => {
              const count = uploadDayCounts[idx] ?? 0
              const maxCount = Math.max(...Object.values(uploadDayCounts), 1)
              const isFilled = count > maxCount * 0.3
              return (
                <div key={day} className="flex flex-col items-center gap-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: isFilled ? 'var(--green)' : 'var(--border-subtle)',
                      opacity: isFilled ? 1 : 0.4,
                    }}
                  />
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
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
