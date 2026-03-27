'use client'

import { ScatterChart, Scatter, CartesianGrid, XAxis, YAxis, ReferenceLine } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import type { Video } from '@/lib/types'

const chartConfig = {
  views: { label: 'Views', color: 'var(--chart-2)' },
}

function formatDurationFromSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

interface DurationVsViewsProps {
  videos: Video[]
}

export function DurationVsViews({ videos }: DurationVsViewsProps) {
  const data = videos
    .filter(v => v.durationSeconds > 0)
    .map(v => ({
      duration: Math.round((v.durationSeconds / 60) * 10) / 10,
      views: v.viewCount,
      title: v.title.length > 45 ? v.title.slice(0, 45) + '...' : v.title,
      durationFormatted: formatDurationFromSeconds(v.durationSeconds),
    }))

  return (
    <Card style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }} className="shadow-none">
      <CardHeader className="pb-3">
        <CardTitle
          className="text-sm font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Duration vs views
        </CardTitle>
        <CardDescription style={{ color: 'var(--text-muted)' }}>
          Where does this channel&apos;s content sweet spot lie?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="duration"
              type="number"
              name="Duration"
              tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Video duration (minutes)', position: 'insideBottom', offset: -5, fontSize: 11, fill: 'var(--text-muted)' }}
            />
            <YAxis
              dataKey="views"
              type="number"
              name="Views"
              tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatNumber(v)}
              width={55}
            />
            <ReferenceLine
              x={8}
              stroke="var(--border-strong)"
              strokeDasharray="4 4"
              label={{ value: '8 min', position: 'top', fontSize: 11, fill: 'var(--text-muted)' }}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null
                const d = payload[0].payload as (typeof data)[0]
                return (
                  <div
                    className="rounded-lg border px-3 py-2 text-xs"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                  >
                    <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{d.title}</p>
                    <p style={{ color: 'var(--text-secondary)' }}>{d.durationFormatted} duration</p>
                    <p style={{ color: 'var(--text-secondary)' }}>{formatNumber(d.views)} views</p>
                  </div>
                )
              }}
            />
            <Scatter data={data} fill="var(--chart-2)" r={5} />
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
