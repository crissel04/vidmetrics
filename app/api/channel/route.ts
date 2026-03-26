import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler, validateQuery, createErrorResponse } from '@/lib/api'
import { channelQuerySchema } from '@/lib/schemas'
import { resolveChannelId, getCachedChannelData } from '@/lib/youtube'
import { computeAllMetrics } from '@/lib/metrics'

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const { searchParams } = request.nextUrl
    const validation = validateQuery(searchParams, channelQuerySchema)

    if (!validation.success) {
      return validation.response
    }

    const { url } = validation.data

    // Check the URL contains youtube.com or youtu.be
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return createErrorResponse('Must be a YouTube channel URL', 400)
    }

    let channelId: string
    try {
      channelId = await resolveChannelId(url)
    } catch (err) {
      if (err instanceof Error) {
        const status = (err as Error & { status?: number }).status
        if (status === 403) return createErrorResponse(err.message, 403)
        if (status === 503) return createErrorResponse(err.message, 503)
        return createErrorResponse(err.message, 404)
      }
      return createErrorResponse('Channel not found', 404)
    }

    // Fetch channel data with 1-hour cache via unstable_cache
    const { channelInfo, rawVideos } = await getCachedChannelData(channelId)

    // Compute all metrics server-side
    const { videos, metrics } = computeAllMetrics(rawVideos, channelInfo)

    // Strip uploadsPlaylistId from the response (internal use only)
    const { uploadsPlaylistId: _, ...channel } = channelInfo

    return NextResponse.json({ channel, videos, metrics })
  })
}
