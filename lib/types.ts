// Note: YouTube API returns all statistics as strings — always parseInt() them server-side
// before storing. By the time types reach the client, they are already numbers.

export interface ChannelInfo {
  id: string
  title: string
  handle: string              // snippet.customUrl — may be empty for old channels
  description: string
  thumbnailUrl: string
  subscriberCount: number     // rounded to 3 significant figures by YouTube
  hiddenSubscriberCount: boolean
  videoCount: number
  viewCount: number
  publishedAt: string
  country?: string
  category: string            // derived from topicCategories Wikipedia URLs
}

// Raw shape direct from YouTube API before metric computation
export interface RawVideo {
  id: string
  title: string
  thumbnailUrl: string
  publishedAt: string
  duration: string            // ISO 8601 e.g. "PT4M30S"
  viewCount: number
  likeCount: number           // 0 if creator has hidden likes
  commentCount: number        // 0 if creator has disabled comments
}

// Computed — stored, displayed, and sent to clients
export interface Video extends RawVideo {
  engagementRate: number      // (likeCount + commentCount) / viewCount * 100
  performanceTier: 'hot' | 'rising' | 'average' | 'underperforming'
  daysLive: number
  viewsPerDay: number
  durationSeconds: number     // parsed from ISO 8601, used for duration comparisons
}

export interface ChannelMetrics {
  avgViews: number
  avgEngagementRate: number
  avgViewsPerDay: number
  medianViews: number
  uploadFrequency: string        // e.g. "3x / week"
  bestDayOfWeek: string
  bestTimeOfDay: string
  momentumScore: number          // 0–100
  momentumLabel: 'Accelerating' | 'Stable' | 'Slowing' | 'Dormant'
  totalViewsLast30d: number
  totalViewsPrev30d: number
  viewsGrowthPct: number
  uploadConsistency: {
    score: 'very-consistent' | 'somewhat-consistent' | 'irregular' | 'insufficient-data'
    label: string
    detail: string
    stdDevDays: number
  }
  category: string               // mapped from YouTube topicDetails, used for benchmarks
}

export interface AIInsights {
  whatIsWorking: string
  uploadPattern: string
  titleFormula: string
  gapOpportunity: string       // single paragraph summary
  gapOpportunities: string[]   // array of 3 specific actionable gaps
}

export interface RecentChannel {
  channelId: string
  title: string
  handle: string
  thumbnailUrl: string
  subscriberCount: number
  analyzedAt: string   // ISO timestamp
}

export interface ContentSignals {
  titleLength: number
  hasNumber: boolean
  hasQuestion: boolean
  durationBucket: 'short' | 'long'
  uploadDayName: string
  uploadHour: number
  isOptimalDay: boolean
  isOptimalHour: boolean
}

export interface VideoDeepDiveData extends Video {
  estimatedVelocityCurve: { day: number; views: number }[]
  contentSignals: ContentSignals
}
