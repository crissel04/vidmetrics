'use client'

import { useMemo, type ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatNumber } from '@/lib/utils'
import type { Video } from '@/lib/types'

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const hourLabels = ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm']

interface HeatmapGridProps {
  videos: Video[]
  bestDay: string
  bestTime: string
}

const CELL_H = 22

export function HeatmapGrid({ videos, bestDay, bestTime }: HeatmapGridProps) {
  const { grid, maxAvg } = useMemo(() => {
    const buckets: { total: number; count: number }[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => ({ total: 0, count: 0 }))
    )

    for (const v of videos) {
      const date = new Date(v.publishedAt)
      const day = (date.getUTCDay() + 6) % 7
      const hour = date.getUTCHours()
      buckets[day][hour].total += v.viewCount
      buckets[day][hour].count += 1
    }

    const grid = buckets.map(row =>
      row.map(cell => ({
        avg: cell.count > 0 ? Math.round(cell.total / cell.count) : 0,
        count: cell.count,
      }))
    )

    const maxAvg = Math.max(...grid.flat().map(c => c.avg), 1)

    return { grid, maxAvg }
  }, [videos])

  if (videos.length < 6) {
    return (
      <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 fade-in">
        <h3 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Best times to post
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Not enough data to show posting patterns. At least 6 videos are needed.
        </p>
      </div>
    )
  }

  const gridChildren: ReactNode[] = [
    <div key="corner" className="min-h-[20px]" aria-hidden />,
    ...Array.from({ length: 24 }, (_, h) => (
      <div
        key={`hour-${h}`}
        className="min-w-0 flex items-end justify-center pb-0.5"
      >
        {h % 3 === 0 && (
          <span className="text-[10px] leading-none text-center" style={{ color: 'var(--text-muted)' }}>
            {hourLabels[h / 3]}
          </span>
        )}
      </div>
    )),
  ]

  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    gridChildren.push(
      <div
        key={`day-label-${dayIdx}`}
        className="flex items-center text-xs pr-1 min-h-0"
        style={{ color: 'var(--text-muted)', height: CELL_H }}
      >
        {dayLabels[dayIdx]}
      </div>
    )
    for (let hourIdx = 0; hourIdx < 24; hourIdx++) {
      const cell = grid[dayIdx][hourIdx]
      const intensity = cell.avg / maxAvg
      gridChildren.push(
        <Tooltip key={`cell-${dayIdx}-${hourIdx}`}>
          <TooltipTrigger
            render={
              <div
                className="w-full min-w-0 rounded-sm cursor-default"
                style={{
                  height: CELL_H,
                  background:
                    cell.count > 0
                      ? `color-mix(in srgb, var(--accent) ${Math.round(intensity * 100)}%, var(--bg-elevated))`
                      : 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              />
            }
          />
          <TooltipContent>
            <p className="text-xs">
              {dayLabels[dayIdx]} {hourIdx}:00 UTC
              <br />
              Avg {formatNumber(cell.avg)} views | {cell.count} videos
            </p>
          </TooltipContent>
        </Tooltip>
      )
    }
  }

  return (
    <div className="w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 fade-in">
      <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
        Best times to post (based on top performing videos)
      </h3>

      <div className="overflow-x-auto">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `2.5rem repeat(24, minmax(0, 1fr))`,
            minWidth: '480px',
          }}
        >
          {gridChildren}
        </div>
      </div>

      <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Best performing slot:{' '}
        <span className="font-medium" style={{ color: 'var(--accent-text)' }}>
          {bestDay}s at {bestTime}
        </span>
      </p>
    </div>
  )
}
