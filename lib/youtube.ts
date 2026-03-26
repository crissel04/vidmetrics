import { unstable_cache } from 'next/cache'
import type { ChannelInfo, RawVideo } from './types'

const BASE = 'https://www.googleapis.com/youtube/v3'
const KEY = () => process.env.YOUTUBE_API_KEY!

/**
 * Resolves any YouTube channel URL format to a canonical channel ID.
 *
 * Handles four URL formats:
 * - /channel/UCxxxxxx — extracted directly, no API call (0 units)
 * - /@handle — resolved via channels.list?forHandle (1 quota unit)
 * - /c/customname — resolved via channels.list?forHandle (1 quota unit)
 * - /user/username — resolved via channels.list?forUsername (1 quota unit)
 *
 * Never uses search.list (costs 100 units).
 *
 * @throws {Error} If URL format is unrecognised or channel is not found
 */
export async function resolveChannelId(url: string): Promise<string> {
  const parsed = new URL(url)
  const path = parsed.pathname

  // Direct channel ID — no API call needed
  const channelMatch = path.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/)
  if (channelMatch) return channelMatch[1]

  // Handle (@handle or /c/name or /user/name)
  const handleMatch = path.match(/\/@([^/]+)/)
  const customMatch = path.match(/\/c\/([^/]+)/)
  const userMatch = path.match(/\/user\/([^/]+)/)

  const handle = handleMatch?.[1] ?? customMatch?.[1]
  const username = userMatch?.[1]

  if (handle) {
    // forHandle is the correct modern parameter for @handles and /c/ URLs
    const res = await fetch(
      `${BASE}/channels?part=id&forHandle=${encodeURIComponent(handle)}&key=${KEY()}`
    )
    const data = await res.json()
    if (data.error) {
      handleYouTubeError(data.error)
    }
    if (!data.items?.[0]) throw new Error('Channel not found')
    return data.items[0].id
  }

  if (username) {
    const res = await fetch(
      `${BASE}/channels?part=id&forUsername=${encodeURIComponent(username)}&key=${KEY()}`
    )
    const data = await res.json()
    if (data.error) {
      handleYouTubeError(data.error)
    }
    if (!data.items?.[0]) throw new Error('Channel not found')
    return data.items[0].id
  }

  throw new Error('Could not parse YouTube channel URL')
}

/**
 * Fetches full channel info from the YouTube API.
 * Single channels.list call with snippet, statistics, contentDetails, and topicDetails.
 * Cost: 1 quota unit.
 *
 * All statistics (viewCount, subscriberCount, etc.) are returned as strings by YouTube
 * and parsed to numbers here.
 */
export async function fetchChannelInfo(channelId: string): Promise<ChannelInfo & { uploadsPlaylistId: string }> {
  const res = await fetch(
    `${BASE}/channels?part=snippet,statistics,contentDetails,topicDetails&id=${channelId}&key=${KEY()}`
  )
  const data = await res.json()

  if (data.error) {
    handleYouTubeError(data.error)
  }
  if (!data.items?.[0]) throw new Error('Channel not found')

  const ch = data.items[0]
  const stats = ch.statistics

  // topicCategories are Wikipedia URLs — extract the category name from the URL
  const topicUrls: string[] = ch.topicDetails?.topicCategories ?? []
  const category = extractCategory(topicUrls)

  return {
    id: ch.id,
    title: ch.snippet.title,
    handle: ch.snippet.customUrl ?? '',
    description: ch.snippet.description ?? '',
    thumbnailUrl: ch.snippet.thumbnails?.high?.url ?? ch.snippet.thumbnails?.default?.url ?? '',
    // YouTube API returns subscriber counts rounded to 3 significant figures.
    // e.g. 1,234,567 is returned as 1,230,000. Do not display false precision.
    subscriberCount: parseInt(stats.subscriberCount ?? '0', 10),
    hiddenSubscriberCount: stats.hiddenSubscriberCount ?? false,
    videoCount: parseInt(stats.videoCount ?? '0', 10),
    viewCount: parseInt(stats.viewCount ?? '0', 10),
    publishedAt: ch.snippet.publishedAt,
    country: ch.snippet.country,
    category,
    // The uploads playlist ID is always the channel ID with "UC" replaced by "UU".
    // We get it from contentDetails.relatedPlaylists.uploads in the API response.
    uploadsPlaylistId: ch.contentDetails.relatedPlaylists.uploads,
  }
}

/**
 * Fetches up to 50 video IDs from a channel's uploads playlist.
 * Cost: 1 quota unit per page of 50.
 */
export async function fetchVideoIds(uploadsPlaylistId: string, maxResults = 50): Promise<string[]> {
  const res = await fetch(
    `${BASE}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}` +
    `&maxResults=${Math.min(maxResults, 50)}&fields=items(contentDetails/videoId),nextPageToken&key=${KEY()}`
  )
  const data = await res.json()

  if (data.error) {
    handleYouTubeError(data.error)
  }

  return (data.items ?? []).map(
    (item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId
  )
}

/**
 * Fetches full video details for a batch of video IDs.
 * Up to 50 IDs per request — all in one call, 1 quota unit regardless of count.
 *
 * Note: likeCount and commentCount may be absent (not just 0) if hidden by the creator.
 */
export async function fetchVideoDetails(videoIds: string[]): Promise<RawVideo[]> {
  if (videoIds.length === 0) return []

  const res = await fetch(
    `${BASE}/videos?part=snippet,statistics,contentDetails` +
    `&id=${videoIds.join(',')}&key=${KEY()}`
  )
  const data = await res.json()

  if (data.error) {
    handleYouTubeError(data.error)
  }

  return (data.items ?? []).map((v: {
    id: string
    snippet: { title: string; thumbnails: Record<string, { url: string }>; publishedAt: string }
    contentDetails: { duration: string }
    statistics: { viewCount?: string; likeCount?: string; commentCount?: string }
  }) => ({
    id: v.id,
    title: v.snippet.title,
    thumbnailUrl: v.snippet.thumbnails?.maxres?.url
      ?? v.snippet.thumbnails?.high?.url
      ?? v.snippet.thumbnails?.medium?.url
      ?? '',
    publishedAt: v.snippet.publishedAt,
    duration: v.contentDetails.duration,
    viewCount: parseInt(v.statistics.viewCount ?? '0', 10),
    // likeCount and commentCount can be absent if the creator has hidden them
    likeCount: parseInt(v.statistics.likeCount ?? '0', 10),
    commentCount: parseInt(v.statistics.commentCount ?? '0', 10),
  }))
}

/**
 * Fetches all data needed for a full channel analysis in ~3 YouTube API quota units:
 * 1. channels.list (1 unit) — channel info + uploads playlist ID
 * 2. playlistItems.list (1 unit) — up to 50 most recent video IDs
 * 3. videos.list (1 unit) — full stats for all IDs in one batched request
 *
 * Note: YouTube API returns all statistics (viewCount, likeCount, etc.) as strings.
 * This function parses them to numbers before returning.
 * likeCount and commentCount may be absent (not just 0) if hidden by the creator.
 */
export async function fetchFullChannelData(channelId: string) {
  const channelInfo = await fetchChannelInfo(channelId)
  const videoIds = await fetchVideoIds(channelInfo.uploadsPlaylistId, 50)
  const rawVideos = await fetchVideoDetails(videoIds)

  return { channelInfo, rawVideos }
}

/**
 * Wraps fetchFullChannelData with Next.js unstable_cache for 1-hour TTL.
 * Cache key includes channelId to keep each channel's data separate.
 */
export function getCachedChannelData(channelId: string) {
  return unstable_cache(
    async () => fetchFullChannelData(channelId),
    [`channel-data-${channelId}`],
    {
      revalidate: 3600,
      tags: [`channel-${channelId}`],
    }
  )()
}

/**
 * Extracts a niche category from YouTube's topicCategories Wikipedia URLs.
 *
 * TODO V2: topicCategories are Wikipedia URLs that may not match our benchmark table.
 * Current approach covers the most common categories; unknown channels fall back to 'default'.
 * V2 should expand the mapping table or use the YouTube categories API endpoint.
 */
function extractCategory(topicUrls: string[]): string {
  const urlToCategory: Record<string, string> = {
    'Technology': 'tech',
    'Video_game_culture': 'gaming',
    'Music': 'music',
    'Entertainment': 'lifestyle',
    'Sports': 'sports',
    'Film': 'lifestyle',
    'Lifestyle_(sociology)': 'lifestyle',
    'Food': 'food',
    'Travel': 'travel',
    'Health': 'fitness',
    'Finance': 'finance',
    'News': 'news',
    'Education': 'education',
    'Comedy': 'comedy',
    'Beauty': 'beauty',
    'Fashion': 'beauty',
  }
  for (const url of topicUrls) {
    const slug = url.split('/wiki/').pop() ?? ''
    for (const [key, cat] of Object.entries(urlToCategory)) {
      if (slug.includes(key)) return cat
    }
  }
  return 'default'
}

/**
 * Maps YouTube API error codes to appropriate Error objects.
 * data.error.code → HTTP status to return:
 * - 404 → channel not found
 * - 403 with reason "forbidden" → private channel
 * - 403 with reason "quotaExceeded" → YouTube API limit reached
 */
function handleYouTubeError(error: { code: number; message: string; errors?: { reason: string }[] }): never {
  const reason = error.errors?.[0]?.reason

  if (error.code === 404) {
    throw new Error("We couldn't find this channel")
  }
  if (error.code === 403 && reason === 'quotaExceeded') {
    const e = new Error('YouTube API limit reached. Try again later.')
    ;(e as Error & { status: number }).status = 503
    throw e
  }
  if (error.code === 403) {
    const e = new Error('This channel appears to be private')
    ;(e as Error & { status: number }).status = 403
    throw e
  }

  throw new Error(error.message || 'YouTube API error')
}
