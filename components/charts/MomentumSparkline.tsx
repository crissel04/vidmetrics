'use client'

import { Area, AreaChart } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'

const chartConfig = {
  score: { label: 'Score', color: 'var(--chart-1)' },
}

interface MomentumSparklineProps {
  data: { month: string; score: number }[]
  /** Light stroke/fill for charts on accent or dark panels. */
  variant?: 'default' | 'onAccent'
}

export function MomentumSparkline({ data, variant = 'default' }: MomentumSparklineProps) {
  const stroke = variant === 'onAccent' ? '#ffffff' : 'var(--chart-1)'
  const gradId = variant === 'onAccent' ? 'momentumGradientAccent' : 'momentumGradient'

  return (
    <ChartContainer config={chartConfig} className="min-h-[60px] w-full">
      <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="momentumGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="momentumGradientAccent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="score"
          stroke={stroke}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}
