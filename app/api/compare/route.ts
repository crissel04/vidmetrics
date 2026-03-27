import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler, createErrorResponse } from '@/lib/api'
import { compareBodySchema } from '@/lib/schemas'
import { resolveChannelId, getCachedChannelData } from '@/lib/youtube'
import { computeAllMetrics } from '@/lib/metrics'
import { formatNumber } from '@/lib/utils'

const anthropic = new Anthropic()

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await request.json()
    const parsed = compareBodySchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(
        parsed.error.issues.map(e => e.message).join(', '),
        400
      )
    }

    const { channelAUrl, channelBUrl } = parsed.data

    // Resolve both channel IDs in parallel
    const [channelAId, channelBId] = await Promise.all([
      resolveChannelId(channelAUrl),
      resolveChannelId(channelBUrl),
    ])

    // Fetch both channels in parallel
    const [dataA, dataB] = await Promise.all([
      getCachedChannelData(channelAId),
      getCachedChannelData(channelBId),
    ])

    const resultA = computeAllMetrics(dataA.rawVideos, dataA.channelInfo)
    const resultB = computeAllMetrics(dataB.rawVideos, dataB.channelInfo)

    const { uploadsPlaylistId: _a, ...channelA } = dataA.channelInfo
    const { uploadsPlaylistId: _b, ...channelB } = dataB.channelInfo

    // Generate AI comparison summary (non-streaming, short)
    let aiSummary = ''
    try {
      const prompt = `Compare these two YouTube channels in 2-3 sentences. Be specific about who is winning and why.

Channel A: ${channelA.title} (${formatNumber(channelA.subscriberCount)} subs, ${formatNumber(resultA.metrics.avgViews)} avg views, ${resultA.metrics.avgEngagementRate.toFixed(2)}% engagement, momentum ${resultA.metrics.momentumScore}/100)
Channel B: ${channelB.title} (${formatNumber(channelB.subscriberCount)} subs, ${formatNumber(resultB.metrics.avgViews)} avg views, ${resultB.metrics.avgEngagementRate.toFixed(2)}% engagement, momentum ${resultB.metrics.momentumScore}/100)

Respond with just the comparison paragraph, no JSON.`

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      })

      if (response.content[0].type === 'text') {
        aiSummary = response.content[0].text
      }
    } catch {
      aiSummary = 'AI comparison unavailable.'
    }

    return NextResponse.json({
      channelA: { channel: channelA, videos: resultA.videos, metrics: resultA.metrics },
      channelB: { channel: channelB, videos: resultB.videos, metrics: resultB.metrics },
      aiSummary,
    })
  })
}
