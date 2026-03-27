'use client'

import { Line, LineChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { Video } from '@/lib/types'

const chartConfig = {
  engagement: { label: 'Engagement Rate', color: 'var(--chart-1)' },
}

interface EngagementChartProps {
  videos: Video[]
  avgEngagementRate: number
}

export function EngagementChart({ videos, avgEngagementRate }: EngagementChartProps) {
  const data = [...videos]
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
    .slice(-20)
    .map(v => ({
      title: v.title.slice(0, 30) + (v.title.length > 30 ? '...' : ''),
      engagement: v.engagementRate,
      date: new Date(v.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 fade-in">
      <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
        Engagement Rate Trend
      </h3>
      <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => `${(value as number).toFixed(2)}%`}
              />
            }
          />
          <ReferenceLine
            y={avgEngagementRate}
            stroke="var(--amber)"
            strokeDasharray="3 3"
            label={{
              value: `Avg: ${avgEngagementRate.toFixed(2)}%`,
              position: 'right',
              fill: 'var(--amber-text)',
              fontSize: 11,
            }}
          />
          <Line
            type="monotone"
            dataKey="engagement"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--chart-1)' }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
