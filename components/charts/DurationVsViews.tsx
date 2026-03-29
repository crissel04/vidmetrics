'use client'

import { ScatterChart, Scatter, CartesianGrid, XAxis, YAxis, ReferenceLine } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { subtleScatterActiveShape } from '@/components/charts/subtleScatterActiveShape'
import { SCATTER_PRIMARY } from '@/components/charts/scatterPalette'
import { formatNumber } from '@/lib/utils'
import type { Video } from '@/lib/types'

const chartConfig = {
  views: { label: 'Views', color: SCATTER_PRIMARY },
}

const axisStroke = 'var(--border-strong)'
const tickProps = { fontSize: 12, fill: 'var(--text-secondary)' }

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
    <Card
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
      className="shadow-none h-full min-h-0"
    >
      <CardHeader className="shrink-0 pb-3">
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
      <CardContent className="flex flex-1 flex-col min-h-0 px-4 pb-4 pt-0">
        <ChartContainer
          config={chartConfig}
          className="h-full min-h-[260px] w-full flex-1 aspect-auto [&_.recharts-responsive-container]:!h-full"
        >
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke={axisStroke} strokeOpacity={0.35} vertical={false} />
            <XAxis
              dataKey="duration"
              type="number"
              name="Duration"
              tick={tickProps}
              tickLine={{ stroke: axisStroke }}
              axisLine={{ stroke: axisStroke }}
              label={{ value: 'Video duration (minutes)', position: 'insideBottom', offset: -5, fontSize: 11, fill: 'var(--text-secondary)' }}
            />
            <YAxis
              dataKey="views"
              type="number"
              name="Views"
              tick={tickProps}
              tickLine={{ stroke: axisStroke }}
              axisLine={{ stroke: axisStroke }}
              tickFormatter={(v) => formatNumber(v)}
              width={55}
            />
            <ReferenceLine
              x={8}
              stroke="var(--border-strong)"
              strokeDasharray="4 4"
              label={{ value: '8 min', position: 'top', fontSize: 11, fill: 'var(--text-secondary)' }}
            />
            <ChartTooltip
              cursor={false}
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
            <Scatter
              data={data}
              shape="circle"
              fill={SCATTER_PRIMARY}
              r={5}
              activeShape={subtleScatterActiveShape}
            />
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
