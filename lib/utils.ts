import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"
import type { Video } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number for display in the UI.
 * 1234 → "1,234", 12345 → "12.3K", 1234567 → "1.2M", 1234567890 → "1.2B"
 */
export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('en-US')
}

/**
 * Formats an ISO 8601 duration string to human-readable.
 * "PT4M30S" → "4:30", "PT1H2M3S" → "1:02:03"
 */
export function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return '0:00'
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * Formats a date string for display.
 * Recent dates show relative ("2 days ago"), older dates show absolute ("Mar 15, 2024").
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const daysDiff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)

  if (daysDiff < 30) {
    return formatDistanceToNow(date, { addSuffix: true })
  }
  return format(date, 'MMM d, yyyy')
}

/**
 * Parses an ISO 8601 duration string to total seconds.
 */
export function parseDurationSeconds(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)
  return hours * 3600 + minutes * 60 + seconds
}

/**
 * Exports video data as a CSV file download.
 * Creates a Blob, triggers the browser's download dialog.
 */
export function exportToCSV(videos: Video[], channelTitle: string) {
  const headers = [
    'Title', 'URL', 'Published Date', 'Views', 'Likes', 'Comments',
    'Engagement Rate (%)', 'Views Per Day', 'Duration', 'Performance Tier',
  ]

  const rows = videos.map(v => [
    `"${v.title.replace(/"/g, '""')}"`,
    `https://youtube.com/watch?v=${v.id}`,
    format(new Date(v.publishedAt), 'yyyy-MM-dd'),
    v.viewCount,
    v.likeCount,
    v.commentCount,
    v.engagementRate.toFixed(2),
    v.viewsPerDay.toFixed(0),
    v.duration,
    v.performanceTier,
  ])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const dateStr = format(new Date(), 'yyyy-MM-dd')
  link.href = url
  link.download = `${channelTitle}-vidmetrics-${dateStr}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
