'use client'

import { ScatterChart, Scatter, CartesianGrid, XAxis, YAxis, ReferenceLine, Cell } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { subtleScatterActiveShape } from '@/components/charts/subtleScatterActiveShape'
import { SCATTER_PRIMARY, scatterQuadrantFill } from '@/components/charts/scatterPalette'
import { formatNumber } from '@/lib/utils'
import type { Video } from '@/lib/types'

const chartConfig = {
  engagement: { label: 'Engagement Rate', color: SCATTER_PRIMARY },
}

type QuadrantLabel = keyof typeof scatterQuadrantFill

const quadrantLegendOrder: QuadrantLabel[] = [
  'High views, high engagement',
  'High views, low engagement',
  'Low views, high engagement',
  'Low views, low engagement',
]

const axisStroke = 'var(--border-strong)'
const tickProps = { fontSize: 12, fill: 'var(--text-secondary)' }

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
    <Card
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
      className="shadow-none h-full min-h-0"
    >
      <CardHeader className="pb-3">
        <CardTitle
          className="text-sm font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Engagement vs views
        </CardTitle>
        <CardDescription style={{ color: 'var(--text-muted)' }}>
          Surfaces whether reach comes from real audience reaction or passive views so you can prioritize formats that earn attention, not just clicks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="pb-2.5">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ScatterChart margin={{ left: 28, right: 8, top: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={axisStroke} strokeOpacity={0.35} vertical={false} />
              <XAxis
                dataKey="views"
                type="number"
                name="Views"
                tick={tickProps}
                tickLine={{ stroke: axisStroke }}
                axisLine={{ stroke: axisStroke }}
                tickFormatter={(v) => formatNumber(v)}
                label={{ value: 'Total views', position: 'insideBottom', offset: -5, fontSize: 11, fill: 'var(--text-secondary)' }}
              />
              <YAxis
                dataKey="engagement"
                type="number"
                name="Engagement"
                tick={tickProps}
                tickLine={{ stroke: axisStroke }}
                axisLine={{ stroke: axisStroke }}
                tickFormatter={(v) => `${v.toFixed(1)}%`}
                width={56}
                label={{
                  value: 'Engagement rate',
                  angle: -90,
                  position: 'left',
                  offset: 12,
                  fontSize: 11,
                  fill: 'var(--text-secondary)',
                }}
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
                      <p style={{ color: 'var(--text-secondary)' }}>{formatNumber(d.views)} views</p>
                      <p style={{ color: 'var(--text-secondary)' }}>{d.engagement.toFixed(2)}% engagement</p>
                      <span
                        className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          background:
                            scatterQuadrantFill[d.quadrant] ?? SCATTER_PRIMARY,
                          color: '#ffffff',
                        }}
                      >
                        {d.quadrant}
                      </span>
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
              >
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={scatterQuadrantFill[entry.quadrant] ?? SCATTER_PRIMARY}
                    r={5}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ChartContainer>
        </div>
        <div
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-dashed pt-3"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {quadrantLegendOrder.map((q) => (
            <div key={q} className="flex max-w-[200px] items-start gap-1.5 sm:max-w-none">
              <span
                className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: scatterQuadrantFill[q] ?? SCATTER_PRIMARY }}
              />
              <span className="text-[11px] leading-snug sm:text-xs" style={{ color: 'var(--text-secondary)' }}>
                {q}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
