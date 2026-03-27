'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { format, subMonths, startOfMonth } from 'date-fns'
import type { Video } from '@/lib/types'

const chartConfig = {
  count: { label: 'Videos', color: 'var(--chart-1)' },
}

interface UploadFrequencyChartProps {
  videos: Video[]
}

export function UploadFrequencyChart({ videos }: UploadFrequencyChartProps) {
  const now = new Date()
  const months: { key: string; label: string; count: number }[] = []

  for (let i = 11; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i))
    const key = format(monthStart, 'yyyy-MM')
    months.push({
      key,
      label: format(monthStart, 'MMM yyyy'),
      count: 0,
    })
  }

  for (const v of videos) {
    const key = format(new Date(v.publishedAt), 'yyyy-MM')
    const month = months.find(m => m.key === key)
    if (month) month.count++
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
          Has this channel been posting more or less frequently over the past year?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={months}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              tickLine={false}
              axisLine={false}
              interval={1}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            {avgPerMonth > 0 && (
              <ReferenceLine
                y={Math.round(avgPerMonth * 10) / 10}
                stroke="var(--border-strong)"
                strokeDasharray="4 4"
                label={{ value: `Avg: ${avgPerMonth.toFixed(1)}/mo`, position: 'right', fontSize: 11, fill: 'var(--text-muted)' }}
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
            <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
