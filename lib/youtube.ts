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
 * Fetches up to maxVideos video IDs from a channel's uploads
 * playlist using pagination. Each page of 50 costs 1 quota unit.
 * Default of 200 videos uses 4 quota units.
 *
 * Stops early if the channel has fewer videos than maxVideos.
 * Results are in reverse chronological order (newest first)
 * as returned by the YouTube API.
 *
 * @param uploadsPlaylistId - from channel.contentDetails.relatedPlaylists.uploads
 * @param maxVideos - maximum videos to fetch, default 200, must be multiple of 50
 */
export async function fetchVideoIds(uploadsPlaylistId: string, maxVideos = 200): Promise<string[]> {
  const allIds: string[] = []
  let pageToken: string | undefined = undefined
  const maxPages = Math.ceil(maxVideos / 50)

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      part: 'contentDetails',
      playlistId: uploadsPlaylistId,
      maxResults: '50',
      fields: 'items(contentDetails/videoId),nextPageToken',
      key: KEY(),
    })
    if (pageToken) params.set('pageToken', pageToken)

    const res = await fetch(`${BASE}/playlistItems?${params.toString()}`)

    if (!res.ok) {
      console.error(`playlistItems.list failed on page ${page}:`, res.status)
      break
    }

    const data = await res.json()

    if (data.error) {
      handleYouTubeError(data.error)
    }

    const ids = (data.items ?? []).map(
      (item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId
    )
    allIds.push(...ids)

    if (!data.nextPageToken) break
    pageToken = data.nextPageToken
  }

  return allIds.slice(0, maxVideos)
}

/**
 * Fetches full video details for a list of video IDs.
 * Splits into batches of 50 (YouTube API limit per request) and fetches in parallel.
 * Each batch costs 1 quota unit regardless of count within the batch.
 *
 * Note: likeCount and commentCount may be absent (not just 0) if hidden by the creator.
 */
export async function fetchVideoDetails(videoIds: string[]): Promise<RawVideo[]> {
  if (videoIds.length === 0) return []

  // Split into batches of 50 — each batch costs 1 quota unit
  const batches: string[][] = []
  for (let i = 0; i < videoIds.length; i += 50) {
    batches.push(videoIds.slice(i, i + 50))
  }

  // Fetch all batches in parallel — faster than sequential
  const batchResults = await Promise.all(
    batches.map(async (batch) => {
      const res = await fetch(
        `${BASE}/videos?part=snippet,statistics,contentDetails` +
        `&id=${batch.join(',')}&key=${KEY()}`
      )
      const data = await res.json()

      if (data.error) {
        handleYouTubeError(data.error)
      }

      return data
    })
  )

  const allVideos: RawVideo[] = []

  for (const data of batchResults) {
    const videos = (data.items ?? []).map((v: {
      id: string
      snippet: { title: string; thumbnails: Record<string, { url: string }>; publishedAt: string }
      contentDetails: { duration: string }
      statistics: { viewCount?: string; likeCount?: string; commentCount?: string }
    }): RawVideo => ({
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
    allVideos.push(...videos)
  }

  return allVideos
}

/**
 * Fetches all data needed for a full channel analysis in ~9 YouTube API quota units:
 * 1. channels.list (1 unit) — channel info + uploads playlist ID
 * 2. playlistItems.list (4 units) — up to 200 most recent video IDs via pagination
 * 3. videos.list (4 units) — full stats in parallel batches of 50
 *
 * Note: YouTube API returns all statistics (viewCount, likeCount, etc.) as strings.
 * This function parses them to numbers before returning.
 * likeCount and commentCount may be absent (not just 0) if hidden by the creator.
 */
export async function fetchFullChannelData(channelId: string, maxVideos = 50) {
  const channelInfo = await fetchChannelInfo(channelId)
  const videoIds = await fetchVideoIds(channelInfo.uploadsPlaylistId, maxVideos)
  const rawVideos = await fetchVideoDetails(videoIds)

  return { channelInfo, rawVideos }
}

/**
 * Wraps fetchFullChannelData with Next.js unstable_cache for 1-hour TTL.
 * Cache key includes channelId to keep each channel's data separate.
 */
export function getCachedChannelData(channelId: string, maxVideos = 50) {
  return unstable_cache(
    async () => fetchFullChannelData(channelId, maxVideos),
    [`channel-data-${channelId}-${maxVideos}`],
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
