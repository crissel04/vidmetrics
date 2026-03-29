import { Redis } from '@upstash/redis'
import type { AIInsights } from './types'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

/**
 * Retrieves cached AI insights for a channel from Upstash Redis.
 * Returns null if no cache entry exists.
 */
export async function getCachedInsights(channelId: string): Promise<AIInsights | null> {
  return redis.get<AIInsights>(`insights:${channelId}`)
}

/**
 * Stores AI insights in Upstash Redis with a 24-hour TTL.
 * Key format: insights:{channelId}
 */
export async function setCachedInsights(channelId: string, insights: AIInsights) {
  return redis.setex(`insights:${channelId}`, 86400, insights)
}

interface AIComparison {
  whoIsWinning: string
  channelStrengths: Record<string, string>
  gapOpportunity: string
}

/**
 * Retrieves cached AI comparison from Upstash Redis.
 * Key is derived from sorted channel IDs so order doesn't matter.
 * Returns null if no cache entry exists.
 */
export async function getCachedComparison(channelIds: string[]): Promise<AIComparison | null> {
  const key = `compare:${[...channelIds].sort().join(',')}`
  return redis.get<AIComparison>(key)
}

/**
 * Stores AI comparison in Upstash Redis with a 24-hour TTL.
 */
export async function setCachedComparison(channelIds: string[], comparison: AIComparison) {
  const key = `compare:${[...channelIds].sort().join(',')}`
  return redis.setex(key, 86400, comparison)
}
