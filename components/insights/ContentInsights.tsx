'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn, formatNumber } from '@/lib/utils'
import { InsightTimelineRailed } from '@/components/insights/InsightTimelineRailed'
import { computeTakeaways } from '@/components/insights/TopTakeaways'
import type { Video, ChannelMetrics } from '@/lib/types'

const patterns = [
  { label: 'Contains a number', test: (title: string) => /\d/.test(title) },
  { label: 'Contains "How to"', test: (title: string) => /how[\s-]?to/i.test(title) },
  { label: 'Contains a question', test: (title: string) => /\?/.test(title) },
  { label: 'Under 50 characters', test: (title: string) => title.length < 50 },
  { label: 'Over 70 characters', test: (title: string) => title.length > 70 },
  { label: 'Contains "vs" or "versus"', test: (title: string) => /\bvs\.?\b|\bversus\b/i.test(title) },
]

interface ContentInsightsProps {
  videos: Video[]
  metrics: ChannelMetrics
}

export function ContentInsights({ videos, metrics }: ContentInsightsProps) {
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

  const showTable = rows.length > 0
  const showTakeaways = videos.length > 0
  const takeawaysList = showTakeaways ? computeTakeaways(videos, metrics) : []

  if (!showTable && !showTakeaways) return null

  return (
    <div className="flex flex-col">
      {showTable && (
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
          <CardContent className="pb-4 pt-0">
            <div
              className="overflow-x-auto rounded-md"
              style={{ border: '1px solid var(--border-subtle)' }}
            >
              <Table className="border-separate border-spacing-0 min-w-[400px]">
                <TableHeader className="[&_tr]:border-b-0">
                  <TableRow
                    className="border-0 border-b border-solid hover:bg-transparent"
                    style={{
                      background: 'var(--border-subtle)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <TableHead
                      className="h-11 px-3 text-left text-xs font-medium first:rounded-tl-md last:rounded-tr-md"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Pattern
                    </TableHead>
                    <TableHead
                      className="h-11 px-3 text-right text-xs font-medium first:rounded-tl-md last:rounded-tr-md"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Videos
                    </TableHead>
                    <TableHead
                      className="h-11 px-3 text-right text-xs font-medium first:rounded-tl-md last:rounded-tr-md"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Avg views
                    </TableHead>
                    <TableHead
                      className="h-11 px-3 text-right text-xs font-medium first:rounded-tl-md last:rounded-tr-md"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Avg engagement
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, rowIndex) => {
                    const isLastRow = rowIndex === rows.length - 1
                    const viewsAbove = row.avgViews >= metrics.avgViews
                    const engAbove = row.avgEngagement >= metrics.avgEngagementRate
                    const rowDivider = !isLastRow
                      ? { borderBottom: '1px dashed var(--border)' as const }
                      : undefined
                    return (
                      <TableRow key={row.label} className="border-0 hover:bg-transparent">
                        <TableCell
                          className="whitespace-normal px-3 py-3 text-sm font-medium"
                          style={{ color: 'var(--text-primary)', ...rowDivider }}
                        >
                          {row.label}
                        </TableCell>
                        <TableCell
                          className="px-3 py-3 text-right text-sm tabular-nums"
                          style={{ color: 'var(--text-secondary)', ...rowDivider }}
                        >
                          {row.count}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'px-3 py-3 text-right text-sm tabular-nums',
                            viewsAbove ? 'font-medium' : 'font-normal'
                          )}
                          style={{
                            color: viewsAbove ? 'var(--text-primary)' : 'var(--text-secondary)',
                            ...rowDivider,
                          }}
                        >
                          {formatNumber(row.avgViews)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'px-3 py-3 text-right text-sm tabular-nums',
                            engAbove ? 'font-medium' : 'font-normal'
                          )}
                          style={{
                            color: engAbove ? 'var(--text-primary)' : 'var(--text-secondary)',
                            ...rowDivider,
                          }}
                        >
                          {row.avgEngagement.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {showTakeaways && (
        <InsightTimelineRailed
          layoutKey={takeawaysList.join('\n')}
          className={showTable ? 'mt-5' : undefined}
          railConnectTopClass={showTable ? '-top-5' : undefined}
          items={takeawaysList}
        />
      )}
    </div>
  )
}
