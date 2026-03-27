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
