'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Info, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { InsightTimelineRailed } from '@/components/insights/InsightTimelineRailed'
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
      label: 'Views / video',
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

  const nicheTimelineItems = [
    summaryText,
    ...comparisons.map(c => {
      const rel =
        c.status === 'above' ? 'above niche average' : c.status === 'below' ? 'below niche average' : 'in line with niche average'
      return `${c.label}: ${rel} (${c.channel} vs ${c.niche}).`
    }),
  ]
  const nicheLayoutKey = `${wins}-${comparisons.map(c => `${c.label}-${c.status}-${c.channel}`).join('|')}`

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center gap-2">
        <h3
          className="text-sm font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Niche: {benchmark.label}
        </h3>
        <Tooltip>
          <TooltipTrigger
            render={
              <Info size={14} style={{ color: 'var(--text-muted)' }} className="cursor-help" />
            }
          />
          <TooltipContent className="max-w-[280px]">
            <p className="text-sm">
              Benchmarks are category averages based on typical YouTube channel performance. Used for directional comparison only — not official YouTube data.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {comparisons.map((comp) => (
          <div
            key={comp.label}
            className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5"
          >
            <p
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: 'var(--text-secondary)' }}
            >
              {comp.label}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="text-3xl font-bold tabular-nums"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text-primary)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {comp.channel}
              </span>
              <StatusIcon status={comp.status} />
            </div>
            <div
              className="mt-4 border-t border-dashed pt-1.5"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                Niche avg · {comp.niche}
              </p>
            </div>
          </div>
        ))}
      </div>

      <InsightTimelineRailed
        layoutKey={nicheLayoutKey}
        railConnectTopClass="-top-4"
        items={nicheTimelineItems}
      />
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
