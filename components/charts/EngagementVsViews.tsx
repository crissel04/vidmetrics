'use client'

import { ScatterChart, Scatter, CartesianGrid, XAxis, YAxis, ReferenceLine, Cell } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import type { Video } from '@/lib/types'

const chartConfig = {
  engagement: { label: 'Engagement Rate', color: 'var(--chart-1)' },
}

const quadrantColors = {
  'High views, high engagement': 'var(--green)',
  'High views, low engagement': 'var(--amber)',
  'Low views, high engagement': 'var(--chart-1)',
  'Low views, low engagement': 'var(--text-muted)',
} as const

type QuadrantLabel = keyof typeof quadrantColors

function getMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

interface EngagementVsViewsProps {
  videos: Video[]
}

export function EngagementVsViews({ videos }: EngagementVsViewsProps) {
  const medianViews = getMedian(videos.map(v => v.viewCount))
  const medianEngagement = getMedian(videos.map(v => v.engagementRate))

  const data = videos.map(v => {
    const highViews = v.viewCount >= medianViews
    const highEngagement = v.engagementRate >= medianEngagement
    let quadrant: QuadrantLabel
    if (highViews && highEngagement) quadrant = 'High views, high engagement'
    else if (highViews) quadrant = 'High views, low engagement'
    else if (highEngagement) quadrant = 'Low views, high engagement'
    else quadrant = 'Low views, low engagement'

    return {
      views: v.viewCount,
      engagement: v.engagementRate,
      title: v.title.length > 45 ? v.title.slice(0, 45) + '...' : v.title,
      quadrant,
    }
  })

  return (
    <Card style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }} className="shadow-none">
      <CardHeader className="pb-3">
        <CardTitle
          className="text-sm font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Engagement vs views
        </CardTitle>
        <CardDescription style={{ color: 'var(--text-muted)' }}>
          Top-right = high performing content. High views + low engagement = passive audience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="views"
              type="number"
              name="Views"
              tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatNumber(v)}
              label={{ value: 'Total views', position: 'insideBottom', offset: -5, fontSize: 11, fill: 'var(--text-muted)' }}
            />
            <YAxis
              dataKey="engagement"
              type="number"
              name="Engagement"
              tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v.toFixed(1)}%`}
              width={45}
              label={{ value: 'Engagement rate', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: 'var(--text-muted)' }}
            />
            <ReferenceLine
              x={medianViews}
              stroke="var(--border-strong)"
              strokeDasharray="4 4"
            />
            <ReferenceLine
              y={medianEngagement}
              stroke="var(--border-strong)"
              strokeDasharray="4 4"
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
                    <p style={{ color: 'var(--text-secondary)' }}>{formatNumber(d.views)} views</p>
                    <p style={{ color: 'var(--text-secondary)' }}>{d.engagement.toFixed(2)}% engagement</p>
                    <span
                      className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: quadrantColors[d.quadrant], color: '#ffffff' }}
                    >
                      {d.quadrant}
                    </span>
                  </div>
                )
              }}
            />
            <Scatter data={data} fill="var(--chart-1)">
              {data.map((entry, i) => (
                <Cell key={i} fill={quadrantColors[entry.quadrant]} r={5} />
              ))}
            </Scatter>
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
