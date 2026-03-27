'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import { getSnapshots, type ChannelSnapshot } from '@/lib/snapshots'
import {
  Card, CardContent, CardHeader,
  CardTitle, CardDescription,
} from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Line, LineChart, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber } from '@/lib/utils'
import { format } from 'date-fns'

interface ChannelHistoryChartProps {
  channelId: string
}

const chartConfig = {
  subscribers: { label: 'Subscribers', color: 'var(--chart-1)' },
  momentum: { label: 'Momentum Score', color: 'var(--chart-2)' },
  avgViews: { label: 'Avg Views/Video', color: 'var(--chart-3)' },
  engagement: { label: 'Engagement Rate', color: 'var(--chart-4)' },
}

type MetricKey = keyof typeof chartConfig

const metricKeys: MetricKey[] = ['momentum', 'subscribers', 'avgViews', 'engagement']

export default function ChannelHistoryChart({ channelId }: ChannelHistoryChartProps) {
  const { user } = useAuth()
  const [snapshots, setSnapshots] = useState<ChannelSnapshot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    getSnapshots(user.id, channelId).then(data => {
      setSnapshots(data.reverse())
      setLoading(false)
    })
  }, [user, channelId])

  if (!user) return null
  if (loading) return (
    <Card style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }} className="shadow-none">
      <CardContent className="p-6">
        <Skeleton className="h-[200px] w-full" />
      </CardContent>
    </Card>
  )
  if (snapshots.length < 2) return null

  const chartData = snapshots.map(s => ({
    date: format(new Date(s.snapshottedAt), 'MMM d'),
    fullDate: format(new Date(s.snapshottedAt), 'MMM d, yyyy HH:mm'),
    subscribers: s.subscriberCount,
    momentum: s.momentumScore,
    avgViews: s.avgViewsPerVideo,
    engagement: parseFloat(s.avgEngagementRate.toFixed(2)),
  }))

  function formatYAxis(value: number, key: MetricKey) {
    if (key === 'engagement') return `${value}%`
    if (key === 'momentum') return String(value)
    return formatNumber(value)
  }

  return (
    <Card style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }} className="shadow-none">
      <CardHeader className="pb-3">
        <CardTitle
          className="text-base font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Channel history
        </CardTitle>
        <CardDescription style={{ color: 'var(--text-muted)' }}>
          Tracked across {snapshots.length} analyses
          — from {format(new Date(snapshots[0].snapshottedAt), 'MMM d, yyyy')} to today
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="momentum">
          <TabsList className="mb-4">
            <TabsTrigger value="momentum">Momentum</TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
            <TabsTrigger value="avgViews">Avg Views</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          {metricKeys.map(key => (
            <TabsContent key={key} value={key}>
              <ChartContainer
                config={chartConfig}
                className="h-[200px] w-full"
              >
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-subtle)"
                    vertical={false}
                  />
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
                    tickFormatter={(v) => formatYAxis(v, key)}
                    width={key === 'subscribers' || key === 'avgViews' ? 55 : 35}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_value, payload) =>
                          (payload?.[0]?.payload as Record<string, string>)?.fullDate ?? ''
                        }
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey={key}
                    stroke={chartConfig[key].color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
