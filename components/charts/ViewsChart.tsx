'use client'

import { ScatterChart, Scatter, CartesianGrid, XAxis, YAxis, ReferenceLine, Cell } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { subtleScatterActiveShape } from '@/components/charts/subtleScatterActiveShape'
import { SCATTER_PRIMARY, scatterTierFill } from '@/components/charts/scatterPalette'
import { formatNumber } from '@/lib/utils'
import type { Video, ChannelMetrics } from '@/lib/types'

const tierLabels: Record<string, string> = {
  hot: 'Hot',
  rising: 'Rising',
  average: 'Average',
  underperforming: 'Underperforming',
}

const chartConfig = {
  views: { label: 'Views', color: SCATTER_PRIMARY },
}

const axisStroke = 'var(--border-strong)'
const tickProps = { fontSize: 12, fill: 'var(--text-secondary)' }

interface ViewsChartProps {
  videos: Video[]
  metrics: ChannelMetrics
}

export function ViewsChart({ videos, metrics }: ViewsChartProps) {
  const data = videos.map(v => ({
    daysLive: v.daysLive,
    views: v.viewCount,
    tier: v.performanceTier,
    title: v.title.length > 45 ? v.title.slice(0, 45) + '...' : v.title,
  }))

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
          Views vs content age
        </CardTitle>
        <CardDescription style={{ color: 'var(--text-muted)' }}>
          Shows which videos keep earning views as they age so you can spot evergreen winners versus short-lived spikes and steer your content mix.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="pb-2.5">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={axisStroke} strokeOpacity={0.35} vertical={false} />
              <XAxis
                dataKey="daysLive"
                type="number"
                name="Days"
                tick={tickProps}
                tickLine={{ stroke: axisStroke }}
                axisLine={{ stroke: axisStroke }}
                label={{ value: 'Days since published', position: 'insideBottom', offset: -5, fontSize: 11, fill: 'var(--text-secondary)' }}
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
                y={metrics.avgViews}
                stroke="var(--border-strong)"
                strokeDasharray="4 4"
                label={{ value: 'Channel avg', position: 'right', fontSize: 11, fill: 'var(--text-secondary)' }}
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
                      <p style={{ color: 'var(--text-secondary)' }}>{d.daysLive} days old</p>
                      <span
                        className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          background: scatterTierFill[d.tier] ?? SCATTER_PRIMARY,
                          color: '#ffffff',
                        }}
                      >
                        {tierLabels[d.tier]}
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
                    fill={scatterTierFill[entry.tier] ?? SCATTER_PRIMARY}
                    r={5}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ChartContainer>
        </div>
        <div
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-dashed pt-3"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {(Object.keys(tierLabels) as Array<keyof typeof tierLabels>).map((tier) => (
            <div key={tier} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: scatterTierFill[tier] ?? SCATTER_PRIMARY }}
              />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {tierLabels[tier]}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
