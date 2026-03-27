import { createClient } from '@/lib/supabase/client'
import type { ChannelInfo, ChannelMetrics } from '@/lib/types'

export interface ChannelSnapshot {
  channelId: string
  channelTitle: string
  handle: string
  thumbnailUrl: string
  subscriberCount: number
  totalViewCount: number
  videoCount: number
  avgViewsPerVideo: number
  avgEngagementRate: number
  momentumScore: number
  momentumLabel: string
  uploadFrequency: string
  viewsLast30d: number
  snapshottedAt: string
}

function mapRow(row: Record<string, unknown>): ChannelSnapshot {
  return {
    channelId: row.channel_id as string,
    channelTitle: row.channel_title as string,
    handle: row.handle as string,
    thumbnailUrl: row.thumbnail_url as string,
    subscriberCount: row.subscriber_count as number,
    totalViewCount: row.total_view_count as number,
    videoCount: row.video_count as number,
    avgViewsPerVideo: row.avg_views_per_video as number,
    avgEngagementRate: row.avg_engagement_rate as number,
    momentumScore: row.momentum_score as number,
    momentumLabel: row.momentum_label as string,
    uploadFrequency: row.upload_frequency as string,
    viewsLast30d: row.views_last_30d as number,
    snapshottedAt: row.snapshotted_at as string,
  }
}

/**
 * Saves a metric snapshot for a channel to Supabase.
 * Called every time a signed-in user loads a channel analysis.
 */
export async function saveSnapshot(
  userId: string,
  channel: ChannelInfo,
  metrics: ChannelMetrics
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('channel_snapshots').insert({
    user_id: userId,
    channel_id: channel.id,
    channel_title: channel.title,
    handle: channel.handle,
    thumbnail_url: channel.thumbnailUrl,
    subscriber_count: channel.subscriberCount,
    total_view_count: channel.viewCount,
    video_count: channel.videoCount,
    avg_views_per_video: Math.round(metrics.avgViews),
    avg_engagement_rate: metrics.avgEngagementRate,
    momentum_score: metrics.momentumScore,
    momentum_label: metrics.momentumLabel,
    upload_frequency: metrics.uploadFrequency,
    views_last_30d: metrics.totalViewsLast30d,
    snapshotted_at: new Date().toISOString(),
  })
  if (error) console.error('Failed to save snapshot:', error)
}

/**
 * Fetches all snapshots for a channel, ordered newest first.
 */
export async function getSnapshots(
  userId: string,
  channelId: string,
  limit = 30
): Promise<ChannelSnapshot[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('channel_snapshots')
    .select('*')
    .eq('user_id', userId)
    .eq('channel_id', channelId)
    .order('snapshotted_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch snapshots:', error)
    return []
  }

  return (data ?? []).map(mapRow)
}

/**
 * Gets the most recent snapshot before the current one.
 * Used for the analysis diff.
 */
export async function getPreviousSnapshot(
  userId: string,
  channelId: string
): Promise<ChannelSnapshot | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('channel_snapshots')
    .select('*')
    .eq('user_id', userId)
    .eq('channel_id', channelId)
    .order('snapshotted_at', { ascending: false })
    .range(1, 1)

  if (error || !data || data.length === 0) return null
  return mapRow(data[0])
}
