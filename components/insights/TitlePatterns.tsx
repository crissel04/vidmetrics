'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { formatNumber } from '@/lib/utils'
import type { Video, ChannelMetrics } from '@/lib/types'

const patterns = [
  {
    label: 'Contains a number',
    test: (title: string) => /\d/.test(title),
  },
  {
    label: 'Contains "How to"',
    test: (title: string) => /how[\s-]?to/i.test(title),
  },
  {
    label: 'Contains a question',
    test: (title: string) => /\?/.test(title),
  },
  {
    label: 'Under 50 characters',
    test: (title: string) => title.length < 50,
  },
  {
    label: 'Over 70 characters',
    test: (title: string) => title.length > 70,
  },
  {
    label: 'Contains "vs" or "versus"',
    test: (title: string) => /\bvs\.?\b|\bversus\b/i.test(title),
  },
]

interface TitlePatternsProps {
  videos: Video[]
  metrics: ChannelMetrics
}

export function TitlePatterns({ videos, metrics }: TitlePatternsProps) {
  const rows = patterns
    .map(pattern => {
      const matching = videos.filter(v => pattern.test(v.title))
      if (matching.length < 3) return null
      const avgViews = Math.round(
        matching.reduce((s, v) => s + v.viewCount, 0) / matching.length
      )
      const avgEngagement =
        matching.reduce((s, v) => s + v.engagementRate, 0) / matching.length
      return {
        label: pattern.label,
        count: matching.length,
        avgViews,
        avgEngagement,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.avgViews - a.avgViews)

  if (rows.length === 0) return null

  return (
    <Card style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }} className="shadow-none">
      <CardHeader className="pb-3">
        <CardTitle
          className="text-sm font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Title pattern performance
        </CardTitle>
        <CardDescription style={{ color: 'var(--text-muted)' }}>
          Which title formats perform best on this channel?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pattern</TableHead>
                <TableHead className="text-right">Videos</TableHead>
                <TableHead className="text-right">Avg Views</TableHead>
                <TableHead className="text-right">Avg Engagement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.label}>
                  <TableCell className="font-medium text-sm">{row.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                  <TableCell
                    className="text-right tabular-nums"
                    style={{
                      color: row.avgViews >= metrics.avgViews
                        ? 'var(--green-text)'
                        : 'var(--red-text)',
                    }}
                  >
                    {formatNumber(row.avgViews)}
                  </TableCell>
                  <TableCell
                    className="text-right tabular-nums"
                    style={{
                      color: row.avgEngagement >= metrics.avgEngagementRate
                        ? 'var(--green-text)'
                        : 'var(--red-text)',
                    }}
                  >
                    {row.avgEngagement.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
