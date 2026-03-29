import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler, createErrorResponse } from '@/lib/api'
import { compareBodySchema } from '@/lib/schemas'
import { resolveChannelId, getCachedChannelData } from '@/lib/youtube'
import { computeAllMetrics } from '@/lib/metrics'
import { formatNumber } from '@/lib/utils'

const anthropic = new Anthropic()

interface ChannelResult {
  channel: Omit<Parameters<typeof computeAllMetrics>[1], 'uploadsPlaylistId'>
  videos: ReturnType<typeof computeAllMetrics>['videos']
  metrics: ReturnType<typeof computeAllMetrics>['metrics']
}

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

    const { channelAUrl, channelBUrl, channelCUrl, maxVideos = 50 } = parsed.data

    // Resolve channel IDs in parallel
    const urlsToResolve = [channelAUrl, channelBUrl]
    if (channelCUrl) urlsToResolve.push(channelCUrl)

    const channelIds = await Promise.all(urlsToResolve.map(resolveChannelId))

    // Fetch all channels in parallel
    const rawData = await Promise.all(channelIds.map(id => getCachedChannelData(id, maxVideos)))

    const results: ChannelResult[] = rawData.map(d => {
      const result = computeAllMetrics(d.rawVideos, d.channelInfo)
      const { uploadsPlaylistId: _, ...channel } = d.channelInfo
      return { channel, videos: result.videos, metrics: result.metrics }
    })

    // Generate AI comparison — structured JSON
    let aiComparison: {
      whoIsWinning: string
      channelStrengths: Record<string, string>
      gapOpportunity: string
    } = {
      whoIsWinning: '',
      channelStrengths: {},
      gapOpportunity: '',
    }

    try {
      const channelSummaries = results.map((r, i) => {
        const label = String.fromCharCode(65 + i) // A, B, C
        return `Channel ${label}: ${r.channel.title} (${formatNumber(r.channel.subscriberCount)} subs, ${formatNumber(r.metrics.avgViews)} avg views, ${r.metrics.avgEngagementRate.toFixed(2)}% engagement, momentum ${r.metrics.momentumScore}/100 [${r.metrics.momentumLabel}], uploads ${r.metrics.uploadFrequency})`
      }).join('\n')

      const prompt = `Analyze these YouTube channels competitively.

${channelSummaries}

Respond with ONLY valid JSON in this exact format:
{
  "whoIsWinning": "1-2 sentence summary of which channel is winning overall and why",
  "channelStrengths": {
    "${results[0].channel.title}": "1 sentence about this channel's key strength",
    "${results[1].channel.title}": "1 sentence about this channel's key strength"${results[2] ? `,\n    "${results[2].channel.title}": "1 sentence about this channel's key strength"` : ''}
  },
  "gapOpportunity": "1-2 sentences about the biggest opportunity or gap between these channels that a creator could exploit"
}

No markdown, no code blocks, just the JSON object.`

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      })

      if (response.content[0].type === 'text') {
        aiComparison = JSON.parse(response.content[0].text)
      }
    } catch {
      aiComparison = {
        whoIsWinning: 'AI comparison unavailable.',
        channelStrengths: {},
        gapOpportunity: '',
      }
    }

    // Build response with named keys
    const responseData: Record<string, unknown> = {
      channelA: results[0],
      channelB: results[1],
      aiComparison,
    }
    if (results[2]) {
      responseData.channelC = results[2]
    }

    return NextResponse.json(responseData)
  })
}
