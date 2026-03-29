'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { eachMonthOfInterval, format, startOfMonth } from 'date-fns'
import type { Video } from '@/lib/types'

const chartConfig = {
  count: { label: 'Videos', color: 'var(--chart-1)' },
}

const axisStroke = 'var(--border-strong)'
const tickProps = { fontSize: 12, fill: 'var(--text-secondary)' }

interface UploadFrequencyChartProps {
  videos: Video[]
}

export function UploadFrequencyChart({ videos }: UploadFrequencyChartProps) {
  const months: { key: string; label: string; count: number }[] = []

  if (videos.length > 0) {
    const times = videos.map(v => new Date(v.publishedAt).getTime())
    const minDate = new Date(Math.min(...times))
    const maxDate = new Date(Math.max(...times))
    const start = startOfMonth(minDate)
    const end = startOfMonth(maxDate)
    for (const ms of eachMonthOfInterval({ start, end })) {
      months.push({
        key: format(ms, 'yyyy-MM'),
        label: format(ms, 'MMM yyyy'),
        count: 0,
      })
    }
    for (const v of videos) {
      const key = format(new Date(v.publishedAt), 'yyyy-MM')
      const month = months.find(m => m.key === key)
      if (month) month.count++
    }
  }

  const totalCount = months.reduce((s, m) => s + m.count, 0)
  const monthsWithUploads = months.filter(m => m.count > 0).length
  const avgPerMonth = monthsWithUploads > 0 ? totalCount / monthsWithUploads : 0

  return (
    <Card style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }} className="shadow-none">
      <CardHeader className="pb-3">
        <CardTitle
          className="text-sm font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Upload frequency
        </CardTitle>
        <CardDescription style={{ color: 'var(--text-muted)' }}>
          Tracks uploads by calendar month from your oldest to newest fetched video so you can see posting cadence across the snapshot.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {months.length === 0 ? (
          <p className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            No videos in this analysis to chart upload frequency.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={months}>
              <CartesianGrid strokeDasharray="3 3" stroke={axisStroke} strokeOpacity={0.35} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                tickLine={{ stroke: axisStroke }}
                axisLine={{ stroke: axisStroke }}
                interval={months.length > 14 ? 2 : months.length > 8 ? 1 : 0}
                angle={months.length > 10 ? -28 : 0}
                textAnchor={months.length > 10 ? 'end' : 'middle'}
                height={months.length > 10 ? 56 : undefined}
              />
              <YAxis
                tick={tickProps}
                tickLine={{ stroke: axisStroke }}
                axisLine={{ stroke: axisStroke }}
                allowDecimals={false}
              />
              {avgPerMonth > 0 && (
                <ReferenceLine
                  y={Math.round(avgPerMonth * 10) / 10}
                  stroke="var(--border-strong)"
                  strokeDasharray="4 4"
                  label={{ value: `Avg: ${avgPerMonth.toFixed(1)}/mo`, position: 'right', fontSize: 11, fill: 'var(--text-secondary)' }}
                />
              )}
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null
                  const d = payload[0].payload as (typeof months)[0]
                  return (
                    <div
                      className="rounded-lg border px-3 py-2 text-xs"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                    >
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{d.label}</p>
                      <p style={{ color: 'var(--text-secondary)' }}>{d.count} video{d.count !== 1 ? 's' : ''} published</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="count" fill="var(--chart-1)" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
