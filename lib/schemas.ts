import { z } from 'zod'

export const channelQuerySchema = z.object({
  url: z.string().min(1, 'URL is required').url('Must be a valid URL'),
})

export const insightsBodySchema = z.object({
  channelId: z.string().min(1),
  channelTitle: z.string().min(1),
  subscriberCount: z.number().min(0),
  videos: z.array(z.object({
    id: z.string(),
    title: z.string(),
    viewCount: z.number(),
    engagementRate: z.number(),
    daysLive: z.number(),
    duration: z.string(),
  })).min(1).max(200),
  metrics: z.object({
    avgViews: z.number(),
    avgEngagementRate: z.number(),
    momentumScore: z.number(),
    momentumLabel: z.string(),
    uploadFrequency: z.string(),
  }),
})

export const compareBodySchema = z.object({
  channelAUrl: z.string().url(),
  channelBUrl: z.string().url(),
  channelCUrl: z.string().url().optional(),
})
