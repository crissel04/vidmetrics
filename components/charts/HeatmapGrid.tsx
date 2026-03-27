'use client'

import { useMemo } from 'react'
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

export function HeatmapGrid({ videos, bestDay, bestTime }: HeatmapGridProps) {
  const { grid, maxAvg } = useMemo(() => {
    // Initialize 7×24 grid
    const buckets: { total: number; count: number }[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => ({ total: 0, count: 0 }))
    )

    for (const v of videos) {
      const date = new Date(v.publishedAt)
      // getUTCDay: 0=Sun, we want 0=Mon
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
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 fade-in">
        <h3 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Best times to post
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Not enough data to show posting patterns. At least 6 videos are needed.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 fade-in">
      <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
        Best times to post (based on top performing videos)
      </h3>

      <div className="overflow-x-auto">
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 pr-2 pt-6">
            {dayLabels.map(d => (
              <div key={d} className="h-[22px] flex items-center text-xs" style={{ color: 'var(--text-muted)' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div>
            {/* Hour labels */}
            <div className="flex gap-1 mb-1">
              {Array.from({ length: 24 }).map((_, h) => (
                <div key={h} className="w-[22px] text-center">
                  {h % 3 === 0 && (
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {hourLabels[h / 3]}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Cells */}
            {grid.map((row, dayIdx) => (
              <div key={dayIdx} className="flex gap-1">
                {row.map((cell, hourIdx) => {
                  const intensity = cell.avg / maxAvg
                  return (
                    <Tooltip key={hourIdx}>
                      <TooltipTrigger
                        render={
                          <div
                            className="w-[22px] h-[22px] rounded-sm cursor-default"
                            style={{
                              background: cell.count > 0
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
                })}
              </div>
            ))}
          </div>
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
