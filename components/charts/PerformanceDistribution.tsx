'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import type { Video } from '@/lib/types'

const chartConfig = {
  count: { label: 'Videos', color: 'var(--chart-1)' },
}

const axisStroke = 'var(--border-strong)'
const tickProps = { fontSize: 12, fill: 'var(--text-secondary)' }

function buildBuckets(videos: Video[]) {
  if (videos.length === 0) return []
  const sorted = [...videos].sort((a, b) => a.viewCount - b.viewCount)
  const bucketSize = Math.ceil(sorted.length / 6)
  const buckets = []
  for (let i = 0; i < 6; i++) {
    const slice = sorted.slice(i * bucketSize, (i + 1) * bucketSize)
    if (slice.length === 0) continue
    const minV = slice[0].viewCount
    const maxV = slice[slice.length - 1].viewCount
    buckets.push({
      label: `${formatNumber(minV)}\u2013${formatNumber(maxV)}`,
      count: slice.length,
      avgViews: Math.round(
        slice.reduce((s, v) => s + v.viewCount, 0) / slice.length
      ),
    })
  }
  return buckets
}

interface PerformanceDistributionProps {
  videos: Video[]
}

export function PerformanceDistribution({ videos }: PerformanceDistributionProps) {
  const buckets = buildBuckets(videos)

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
          Performance distribution
        </CardTitle>
        <CardDescription style={{ color: 'var(--text-muted)' }}>
          A spread-out distribution = consistent. All bars low except one = relies on viral hits.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col min-h-0 px-4 pb-4 pt-0">
        <ChartContainer
          config={chartConfig}
          className="h-full min-h-[260px] w-full flex-1 aspect-auto [&_.recharts-responsive-container]:!h-full"
        >
          <BarChart data={buckets}>
            <CartesianGrid strokeDasharray="3 3" stroke={axisStroke} strokeOpacity={0.35} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
              tickLine={{ stroke: axisStroke }}
              axisLine={{ stroke: axisStroke }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={tickProps}
              tickLine={{ stroke: axisStroke }}
              axisLine={{ stroke: axisStroke }}
              allowDecimals={false}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null
                const d = payload[0].payload as (typeof buckets)[0]
                return (
                  <div
                    className="rounded-lg border px-3 py-2 text-xs"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                  >
                    <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{d.label} views</p>
                    <p style={{ color: 'var(--text-secondary)' }}>{d.count} videos</p>
                    <p style={{ color: 'var(--text-secondary)' }}>Avg: {formatNumber(d.avgViews)} views</p>
                  </div>
                )
              }}
            />
            <Bar dataKey="count" fill="var(--chart-1)" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
