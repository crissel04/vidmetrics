import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler, createErrorResponse } from '@/lib/api'
import { insightsBodySchema } from '@/lib/schemas'
import { getCachedInsights, setCachedInsights } from '@/lib/cache'
import { formatNumber } from '@/lib/utils'

const anthropic = new Anthropic()

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await request.json()
    const parsed = insightsBodySchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(
        parsed.error.issues.map(e => e.message).join(', '),
        400
      )
    }

    const { channelId, channelTitle, subscriberCount, videos, metrics } = parsed.data

    // 1. Check Redis cache first — return immediately if cached
    const cached = await getCachedInsights(channelId)
    if (cached) {
      return NextResponse.json({ insights: cached })
    }

    // 2. Build prompt
    const prompt = buildInsightsPrompt({ channelTitle, subscriberCount, videos, metrics })

    // 3. Stream from Anthropic
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullText = ''

          const response = anthropic.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
          })

          for await (const event of response) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              fullText += event.delta.text
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }

          // After stream completes, parse and cache the full JSON
          try {
            const insights = JSON.parse(fullText)
            await setCachedInsights(channelId, insights)
          } catch {
            // JSON parse failed — stream ended but wasn't valid JSON
            // Client handles this gracefully with retry
          }

          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  })
}

function buildInsightsPrompt({ channelTitle, subscriberCount, videos, metrics }: {
  channelTitle: string
  subscriberCount: number
  videos: { id: string; title: string; viewCount: number; engagementRate: number; daysLive: number; duration: string }[]
  metrics: { avgViews: number; avgEngagementRate: number; momentumScore: number; momentumLabel: string; uploadFrequency: string }
}): string {
  return `You are a YouTube content strategy analyst. Analyze this channel's performance data and provide specific, actionable insights.

Channel: ${channelTitle}
Subscribers: ${formatNumber(subscriberCount)}
Upload frequency: ${metrics.uploadFrequency}
Avg views/video: ${formatNumber(metrics.avgViews)}
Avg engagement rate: ${metrics.avgEngagementRate.toFixed(2)}%
Momentum score: ${metrics.momentumScore}/100 (${metrics.momentumLabel})

Top 20 videos by views:
${videos.slice(0, 20).map(v =>
  `- "${v.title}" | ${formatNumber(v.viewCount)} views | ${v.engagementRate.toFixed(2)}% engagement | ${v.daysLive}d ago | ${v.duration}`
).join('\n')}

Respond with ONLY a valid JSON object — no markdown fences, no explanation, no preamble:
{
  "whatIsWorking": "2-3 sentences on what content formula is driving their success. Be specific.",
  "uploadPattern": "Specific observation about when and how often they post, and what timing correlates with performance.",
  "titleFormula": "The specific pattern in their high-performing titles. Quote actual title examples.",
  "gapOpportunity": "2-3 specific content angles their audience likely wants that this channel has not covered. Be specific and actionable.",
  "gapOpportunities": [
    "Specific gap 1 — topic/format with reasoning",
    "Specific gap 2 — topic/format with reasoning",
    "Specific gap 3 — topic/format with reasoning"
  ]
}`
}
