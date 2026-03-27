import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler, createErrorResponse } from '@/lib/api'
import { insightsBodySchema } from '@/lib/schemas'
import { getCachedInsights, setCachedInsights } from '@/lib/cache'
import { formatNumber } from '@/lib/utils'

const anthropic = new Anthropic()

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    // Env var check
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[insights] ANTHROPIC_API_KEY is not set')
      return createErrorResponse('AI service not configured', 503)
    }

    const body = await request.json()
    const parsed = insightsBodySchema.safeParse(body)
    if (!parsed.success) {
      console.error('[insights] Validation failed:', parsed.error.issues)
      return createErrorResponse(
        parsed.error.issues.map(e => e.message).join(', '),
        400
      )
    }

    const { channelId, channelTitle, subscriberCount, videos, metrics } = parsed.data

    // 1. Check Redis cache first
    try {
      const cached = await getCachedInsights(channelId)
      if (cached) {
        return NextResponse.json({ insights: cached })
      }
    } catch (cacheErr) {
      console.error('[insights] Redis cache read failed:', cacheErr)
      // Continue without cache
    }

    // 2. Build prompt
    const prompt = buildInsightsPrompt({ channelTitle, subscriberCount, videos, metrics })

    // 3. Stream from Anthropic
    const encoder = new TextEncoder()
    let fullText = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
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

          // Strip markdown fences if present
          let cleanText = fullText.trim()
          if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
          }

          // Cache the parsed result
          try {
            const insights = JSON.parse(cleanText)
            await setCachedInsights(channelId, insights)
          } catch (parseErr) {
            console.error('[insights] JSON parse failed after stream:', parseErr)
            console.error('[insights] Raw text:', fullText.slice(0, 200))
          }

          controller.close()
        } catch (err) {
          const error = err as { status?: number; message?: string }
          console.error('[insights] Anthropic stream error:', {
            status: error.status,
            message: error.message,
          })
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

Top 30 videos by views:
${videos
  .sort((a, b) => b.viewCount - a.viewCount)
  .slice(0, 30)
  .map(v =>
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
