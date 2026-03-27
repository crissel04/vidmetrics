'use client'

import { Area, AreaChart } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'

const chartConfig = {
  score: { label: 'Score', color: 'var(--chart-1)' },
}

interface MomentumSparklineProps {
  data: { month: string; score: number }[]
}

export function MomentumSparkline({ data }: MomentumSparklineProps) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[60px] w-full">
      <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="momentumGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="score"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#momentumGradient)"
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}
