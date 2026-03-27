'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { formatNumber } from '@/lib/utils'
import type { Video } from '@/lib/types'

interface CompareChartProps {
  videosA: Video[]
  videosB: Video[]
  titleA: string
  titleB: string
}

export function CompareChart({ videosA, videosB, titleA, titleB }: CompareChartProps) {
  const lastA = [...videosA]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 10)
    .reverse()

  const lastB = [...videosB]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 10)
    .reverse()

  const maxLen = Math.max(lastA.length, lastB.length)
  const data = Array.from({ length: maxLen }, (_, i) => ({
    index: `Video ${i + 1}`,
    channelA: lastA[i]?.viewCount ?? 0,
    channelB: lastB[i]?.viewCount ?? 0,
  }))

  const config = {
    channelA: { label: titleA, color: 'var(--chart-1)' },
    channelB: { label: titleB, color: 'var(--chart-2)' },
  }

  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
    >
      <h3
        className="text-sm font-medium mb-3"
        style={{ color: 'var(--text-secondary)' }}
      >
        Views Comparison (Last 10 Videos)
      </h3>
      <ChartContainer config={config} className="h-[250px] w-full">
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis
            dataKey="index"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v) => formatNumber(v)}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
          />
          <Bar dataKey="channelA" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="channelB" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
