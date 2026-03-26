import type { RawVideo, Video, ChannelMetrics, ChannelInfo } from './types'

/**
 * Parses an ISO 8601 duration string (e.g. "PT4M30S") to seconds.
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
 * Computes the engagement rate for a video.
 * Formula: (likes + comments) / views * 100
 *
 * We use comments in addition to likes because comments require genuine user intent
 * and are harder to inflate artificially than likes.
 */
export function computeEngagementRate(likeCount: number, commentCount: number, viewCount: number): number {
  if (viewCount === 0) return 0
  return parseFloat((((likeCount + commentCount) / viewCount) * 100).toFixed(2))
}

/**
 * Assigns a performance tier to a video based on its views relative to the channel median.
 *
 * - 'hot': viewCount > channelMedian * 1.5
 * - 'rising': published < 14 days ago AND viewCount > channelMedian * 0.8
 * - 'average': between 50% and 150% of median
 * - 'underperforming': viewCount < channelMedian * 0.5
 */
export function computePerformanceTier(
  viewCount: number,
  channelMedian: number,
  daysLive: number
): 'hot' | 'rising' | 'average' | 'underperforming' {
  if (viewCount > channelMedian * 1.5) return 'hot'
  if (daysLive < 14 && viewCount > channelMedian * 0.8) return 'rising'
  if (viewCount < channelMedian * 0.5) return 'underperforming'
  return 'average'
}

/**
 * Computes the number of days since a video was published.
 */
function computeDaysLive(publishedAt: string): number {
  const published = new Date(publishedAt).getTime()
  const now = Date.now()
  return Math.max(Math.floor((now - published) / (1000 * 60 * 60 * 24)), 1)
}

/**
 * Computes normalized views per day for a video, accounting for video age.
 */
export function computeViewsPerDay(viewCount: number, daysLive: number): number {
  return parseFloat((viewCount / Math.max(daysLive, 1)).toFixed(1))
}

/**
 * Computes the Momentum Score (0–100) for a channel.
 *
 * Three components:
 * - Views growth (40pts): last 30d vs prior 30d total views
 * - Upload frequency change (30pts): video count last 30d vs prior 30d
 * - Engagement trend (30pts): avg engagement rate last 10 videos vs prior 10
 *
 * Labels: 80–100 = Accelerating, 50–79 = Stable, 25–49 = Slowing, 0–24 = Dormant
 */
export function computeMomentumScore(videos: Video[]): {
  score: number
  label: 'Accelerating' | 'Stable' | 'Slowing' | 'Dormant'
  totalViewsLast30d: number
  totalViewsPrev30d: number
  viewsGrowthPct: number
} {
  const now = Date.now()
  const day30 = 30 * 24 * 60 * 60 * 1000
  const day60 = 60 * 24 * 60 * 60 * 1000

  const last30d = videos.filter(v => now - new Date(v.publishedAt).getTime() <= day30)
  const prev30d = videos.filter(v => {
    const age = now - new Date(v.publishedAt).getTime()
    return age > day30 && age <= day60
  })

  // Component 1 (40 pts): Views growth
  const totalViewsLast30d = last30d.reduce((sum, v) => sum + v.viewCount, 0)
  const totalViewsPrev30d = prev30d.reduce((sum, v) => sum + v.viewCount, 0)
  const viewsGrowthRatio = totalViewsPrev30d > 0
    ? (totalViewsLast30d / totalViewsPrev30d - 1) * 100
    : 0
  const viewsComponent = clamp(viewsGrowthRatio, -40, 40) + 40

  // Component 2 (30 pts): Upload frequency consistency
  const last30dCount = last30d.length
  const prev30dCount = Math.max(prev30d.length, 1)
  const uploadComponent = clamp((last30dCount / prev30dCount) * 15, 0, 30)

  // Component 3 (30 pts): Engagement trend
  const sorted = [...videos].sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
  const recent10 = sorted.slice(0, 10)
  const prior10 = sorted.slice(10, 20)

  const recentEngagement = recent10.length > 0
    ? recent10.reduce((sum, v) => sum + v.engagementRate, 0) / recent10.length
    : 0
  const historicEngagement = prior10.length > 0
    ? prior10.reduce((sum, v) => sum + v.engagementRate, 0) / prior10.length
    : recentEngagement || 1

  const engagementRatio = historicEngagement > 0
    ? (recentEngagement / historicEngagement - 1) * 100
    : 0
  const engagementComponent = clamp(engagementRatio, -30, 30) + 30

  const score = Math.round(viewsComponent + uploadComponent + engagementComponent)
  const viewsGrowthPct = totalViewsPrev30d > 0
    ? parseFloat(((totalViewsLast30d / totalViewsPrev30d - 1) * 100).toFixed(1))
    : 0

  let label: 'Accelerating' | 'Stable' | 'Slowing' | 'Dormant'
  if (score >= 80) label = 'Accelerating'
  else if (score >= 50) label = 'Stable'
  else if (score >= 25) label = 'Slowing'
  else label = 'Dormant'

  return { score, label, totalViewsLast30d, totalViewsPrev30d, viewsGrowthPct }
}

/**
 * Computes upload frequency as a human-readable string.
 * Counts videos in last 90 days and divides by ~13 weeks.
 */
export function computeUploadFrequency(videos: Video[]): string {
  const now = Date.now()
  const day90 = 90 * 24 * 60 * 60 * 1000
  const recentCount = videos.filter(v => now - new Date(v.publishedAt).getTime() <= day90).length

  const perWeek = recentCount / 13

  if (perWeek >= 6.5) return '7x / week'
  if (perWeek >= 4.5) return '5x / week'
  if (perWeek >= 3.5) return '4x / week'
  if (perWeek >= 2.5) return '3x / week'
  if (perWeek >= 1.5) return '2x / week'
  if (perWeek >= 0.8) return '1x / week'
  if (perWeek >= 0.35) return '~2x / month'
  if (perWeek >= 0.15) return '~1x / month'
  return 'Infrequent'
}

/**
 * Determines the best posting day and time based on top-performing videos.
 * Groups top 25% videos by day of week and hour to find modal values.
 */
export function computeBestPostingTime(videos: Video[]): { bestDay: string; bestTime: string } {
  if (videos.length === 0) return { bestDay: 'N/A', bestTime: 'N/A' }

  // Sort by views descending, take top 25%
  const sorted = [...videos].sort((a, b) => b.viewCount - a.viewCount)
  const topQuartile = sorted.slice(0, Math.max(Math.ceil(sorted.length * 0.25), 1))

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayCounts: Record<string, number> = {}
  const hourCounts: Record<number, number> = {}

  for (const v of topQuartile) {
    const date = new Date(v.publishedAt)
    const day = days[date.getUTCDay()]
    const hour = date.getUTCHours()
    dayCounts[day] = (dayCounts[day] ?? 0) + 1
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1
  }

  const bestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A'
  const bestHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '12'

  const hour = parseInt(bestHour, 10)
  const ampm = hour >= 12 ? 'pm' : 'am'
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  const bestTime = `${display}${ampm} UTC`

  return { bestDay, bestTime }
}

/**
 * Computes the upload consistency score based on standard deviation of gaps
 * between consecutive uploads. Returns a classification, description, and
 * the raw stdDev value.
 */
export function computeUploadConsistency(videos: Video[]): {
  score: 'very-consistent' | 'somewhat-consistent' | 'irregular' | 'insufficient-data'
  label: string
  detail: string
  stdDevDays: number
} {
  const sorted = [...videos].sort((a, b) =>
    new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  )

  // Need at least 6 videos to compute meaningful consistency
  if (sorted.length < 6) return {
    score: 'insufficient-data',
    label: 'Not enough data',
    detail: 'Need at least 6 videos',
    stdDevDays: 0,
  }

  // Compute gaps between consecutive uploads in days
  const gaps: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i].publishedAt).getTime() -
                  new Date(sorted[i - 1].publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    gaps.push(diff)
  }

  // Standard deviation of gaps
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length
  const variance = gaps.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / gaps.length
  const stdDev = Math.sqrt(variance)

  if (stdDev <= 1.5) return {
    score: 'very-consistent',
    label: 'Very consistent',
    detail: `Posts within ${stdDev.toFixed(1)} days of their usual schedule`,
    stdDevDays: stdDev,
  }
  if (stdDev <= 4) return {
    score: 'somewhat-consistent',
    label: 'Somewhat consistent',
    detail: `Schedule varies by \u00B1${stdDev.toFixed(0)} days`,
    stdDevDays: stdDev,
  }
  return {
    score: 'irregular',
    label: 'Irregular',
    detail: 'No predictable posting pattern detected',
    stdDevDays: stdDev,
  }
}

/**
 * Transforms raw YouTube video data into computed Video objects and channel-level metrics.
 * This is the main entry point called by the /api/channel route.
 */
export function computeAllMetrics(
  rawVideos: RawVideo[],
  channelInfo: ChannelInfo & { uploadsPlaylistId: string }
): { videos: Video[]; metrics: ChannelMetrics } {
  // Sort by views to compute median
  const sortedByViews = [...rawVideos].sort((a, b) => b.viewCount - a.viewCount)
  const medianViews = sortedByViews.length > 0
    ? sortedByViews[Math.floor(sortedByViews.length / 2)].viewCount
    : 0

  // Transform raw videos to computed Video objects
  const videos: Video[] = rawVideos.map(raw => {
    const daysLive = computeDaysLive(raw.publishedAt)
    const engagementRate = computeEngagementRate(raw.likeCount, raw.commentCount, raw.viewCount)
    const viewsPerDay = computeViewsPerDay(raw.viewCount, daysLive)
    const performanceTier = computePerformanceTier(raw.viewCount, medianViews, daysLive)
    const durationSeconds = parseDurationSeconds(raw.duration)

    return {
      ...raw,
      engagementRate,
      performanceTier,
      daysLive,
      viewsPerDay,
      durationSeconds,
    }
  })

  // Sort videos by publish date descending for display
  videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  // Channel-level metrics
  const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0)
  const avgViews = videos.length > 0 ? Math.round(totalViews / videos.length) : 0
  const avgEngagementRate = videos.length > 0
    ? parseFloat((videos.reduce((sum, v) => sum + v.engagementRate, 0) / videos.length).toFixed(2))
    : 0
  const avgViewsPerDay = videos.length > 0
    ? parseFloat((videos.reduce((sum, v) => sum + v.viewsPerDay, 0) / videos.length).toFixed(1))
    : 0

  const { score: momentumScore, label: momentumLabel, totalViewsLast30d, totalViewsPrev30d, viewsGrowthPct } =
    computeMomentumScore(videos)
  const uploadFrequency = computeUploadFrequency(videos)
  const { bestDay, bestTime } = computeBestPostingTime(videos)
  const uploadConsistency = computeUploadConsistency(videos)

  const metrics: ChannelMetrics = {
    avgViews,
    avgEngagementRate,
    avgViewsPerDay,
    medianViews,
    uploadFrequency,
    bestDayOfWeek: bestDay,
    bestTimeOfDay: bestTime,
    momentumScore,
    momentumLabel,
    totalViewsLast30d,
    totalViewsPrev30d,
    viewsGrowthPct,
    uploadConsistency,
    category: channelInfo.category,
  }

  return { videos, metrics }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
