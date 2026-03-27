'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { formatNumber } from '@/lib/utils'
import type { Video } from '@/lib/types'

const tierColors: Record<string, string> = {
  hot: 'var(--green)',
  rising: 'var(--chart-1)',
  average: 'var(--text-muted)',
  underperforming: 'var(--red)',
}

const chartConfig = {
  views: { label: 'Views', color: 'var(--chart-1)' },
}

interface ViewsChartProps {
  videos: Video[]
}

export function ViewsChart({ videos }: ViewsChartProps) {
  // Take last 20 videos chronologically
  const data = [...videos]
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
    .slice(-20)
    .map(v => ({
      title: v.title.slice(0, 30) + (v.title.length > 30 ? '...' : ''),
      views: v.viewCount,
      tier: v.performanceTier,
      date: new Date(v.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 fade-in">
      <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
        Views Over Time
      </h3>
      <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
        <BarChart data={data}>
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
            tickFormatter={(v) => formatNumber(v)}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => formatNumber(value as number)}
              />
            }
          />
          <Bar dataKey="views" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={tierColors[entry.tier]} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}
