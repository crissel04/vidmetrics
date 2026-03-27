'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Info, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { NICHE_BENCHMARKS } from '@/lib/benchmarks'
import { formatNumber } from '@/lib/utils'
import type { ChannelMetrics } from '@/lib/types'

interface NicheBenchmarkProps {
  metrics: ChannelMetrics
}

export function NicheBenchmark({ metrics }: NicheBenchmarkProps) {
  const benchmark = NICHE_BENCHMARKS[metrics.category] ?? NICHE_BENCHMARKS['default']

  const comparisons = [
    {
      label: 'Engagement rate',
      channel: `${metrics.avgEngagementRate.toFixed(1)}%`,
      niche: `${benchmark.avgEngagementRate}%`,
      status: getStatus(metrics.avgEngagementRate, benchmark.avgEngagementRate),
    },
    {
      label: 'Views/video',
      channel: formatNumber(metrics.avgViews),
      niche: formatNumber(benchmark.avgViewsPerVideo),
      status: getStatus(metrics.avgViews, benchmark.avgViewsPerVideo),
    },
    {
      label: 'Upload frequency',
      channel: metrics.uploadFrequency,
      niche: benchmark.avgUploadFrequency,
      status: 'equal' as const,
    },
  ]

  const wins = comparisons.filter(c => c.status === 'above').length
  const summaryText = `Outperforming their niche on ${wins} of 3 key metrics`

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 fade-in">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          Niche: {benchmark.label}
        </h3>
        <Tooltip>
          <TooltipTrigger
            render={
              <Info size={14} style={{ color: 'var(--text-muted)' }} className="cursor-help" />
            }
          />
          <TooltipContent>
            <p className="text-xs max-w-[200px]">
              Benchmarks based on category averages across YouTube. Used for directional comparison only.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-3">
        {comparisons.map((comp) => (
          <div key={comp.label} className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>{comp.label}</span>
            <div className="flex items-center gap-4">
              <span className="font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {comp.channel}
              </span>
              <StatusIcon status={comp.status} />
              <span className="tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {comp.niche}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs mt-4 pt-3 border-t border-[var(--border-subtle)]" style={{ color: 'var(--text-secondary)' }}>
        {summaryText}
      </p>
    </div>
  )
}

function getStatus(channel: number, niche: number): 'above' | 'below' | 'equal' {
  const ratio = channel / Math.max(niche, 0.01)
  if (ratio > 1.1) return 'above'
  if (ratio < 0.9) return 'below'
  return 'equal'
}

function StatusIcon({ status }: { status: 'above' | 'below' | 'equal' }) {
  if (status === 'above') return <ArrowUp size={14} style={{ color: 'var(--green-text)' }} />
  if (status === 'below') return <ArrowDown size={14} style={{ color: 'var(--red-text)' }} />
  return <Minus size={14} style={{ color: 'var(--text-muted)' }} />
}
