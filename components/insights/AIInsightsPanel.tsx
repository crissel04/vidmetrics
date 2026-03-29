'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { RefreshCw, TrendingUp, CalendarDays, Heading2, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { AIInsights, ChannelInfo, Video, ChannelMetrics } from '@/lib/types'

// Module-level cache: persists across component mounts within the same browser session.
// Prevents re-fetching AI insights when switching back to a previously loaded channel tab.
const aiInsightsSessionCache = new Map<string, AIInsights>()

interface AIInsightsPanelProps {
  channel: ChannelInfo
  videos: Video[]
  metrics: ChannelMetrics
  onInsightsLoaded?: (insights: AIInsights) => void
}

/**
 * Parse partial JSON to reveal sections as they stream in.
 */
function parsePartialInsights(text: string): Partial<AIInsights> {
  const partial: Partial<AIInsights> = {}
  const fields = ['whatIsWorking', 'uploadPattern', 'titleFormula', 'gapOpportunity'] as const
  for (const field of fields) {
    const match = text.match(new RegExp(`"${field}":\\s*"((?:[^"\\\\]|\\\\.)*?)(?:"|$)`))
    if (match?.[1]) partial[field] = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
  }
  return partial
}

const SECTIONS = [
  {
    key: 'whatIsWorking' as const,
    label: "What's working",
    Icon: TrendingUp,
  },
  {
    key: 'uploadPattern' as const,
    label: 'Upload pattern',
    Icon: CalendarDays,
  },
  {
    key: 'titleFormula' as const,
    label: 'Title formula',
    Icon: Heading2,
  },
  {
    key: 'gapOpportunity' as const,
    label: 'Gap opportunity',
    Icon: Lightbulb,
  },
]

export function AIInsightsPanel({ channel, videos, metrics, onInsightsLoaded }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [partial, setPartial] = useState<Partial<AIInsights>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | false>(false)

  // Stable ref so the callback never appears in fetchInsights's dep array.
  // Without this, an inline arrow in the parent creates a new reference every render,
  // which recreates fetchInsights, which re-triggers useEffect → infinite fetch loop.
  const onInsightsLoadedRef = useRef(onInsightsLoaded)
  onInsightsLoadedRef.current = onInsightsLoaded

  const fetchInsights = useCallback(async (isManualRetry = false) => {
    // Serve from session cache on tab revisit (not on manual retry)
    if (!isManualRetry) {
      const cached = aiInsightsSessionCache.get(channel.id)
      if (cached) {
        setInsights(cached)
        onInsightsLoadedRef.current?.(cached)
        return
      }
    }

    setLoading(true)
    setError(false)
    setPartial({})

    try {
      const payload = {
        channelId: channel.id,
        channelTitle: channel.title,
        subscriberCount: channel.subscriberCount,
        videos: videos.slice(0, 30).map(v => ({
          id: v.id,
          title: v.title,
          viewCount: v.viewCount,
          engagementRate: v.engagementRate,
          daysLive: v.daysLive,
          duration: v.duration,
        })),
        metrics: {
          avgViews: metrics.avgViews,
          avgEngagementRate: metrics.avgEngagementRate,
          momentumScore: metrics.momentumScore,
          momentumLabel: metrics.momentumLabel,
          uploadFrequency: metrics.uploadFrequency,
        },
      }

      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ error: 'Analysis unavailable' }))
        if (response.status === 429) {
          setError(errBody.error || 'Rate limit reached — try again in an hour')
        } else if (response.status === 503) {
          setError(errBody.error || 'AI service not configured')
        } else {
          setError(errBody.error || 'Analysis unavailable')
        }
        setLoading(false)
        return
      }

      const contentType = response.headers.get('content-type') ?? ''
      if (contentType.includes('application/json')) {
        const data = await response.json()
        aiInsightsSessionCache.set(channel.id, data.insights)
        setInsights(data.insights)
        onInsightsLoadedRef.current?.(data.insights)
        setLoading(false)
        return
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      if (!reader) {
        setError('No response stream available')
        setLoading(false)
        return
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        setPartial(parsePartialInsights(accumulated))
      }

      try {
        let cleanText = accumulated.trim()
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
        }
        const parsed: AIInsights = JSON.parse(cleanText)
        aiInsightsSessionCache.set(channel.id, parsed)
        setInsights(parsed)
        onInsightsLoadedRef.current?.(parsed)
      } catch (err) {
        console.error('[AIInsightsPanel] JSON parse failed:', err)
        console.error('[AIInsightsPanel] Raw text:', accumulated.slice(0, 200))
        setError('Failed to parse AI response')
      }
      setLoading(false)
    } catch {
      setError('Network error — please try again')
      setLoading(false)
    }
  // Only channel.id in deps — channel object, videos, and metrics don't need to
  // trigger a re-fetch since they're tied to the same channelId.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  const data = insights ?? partial

  return (
    <div className="fade-in flex flex-col gap-4">
      {error && !loading && (
        <Card
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
          className="shadow-none gap-0 py-0"
        >
          <CardContent className="flex flex-col items-center gap-3 px-4 py-6">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {error}
            </p>
            <Button variant="outline" size="sm" onClick={() => fetchInsights(true)} className="gap-1.5">
              <RefreshCw size={14} />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!error && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SECTIONS.map(({ key, label, Icon }) => {
              const value = data[key]
              return (
                <Card
                  key={key}
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
                  className="shadow-none gap-0 py-0"
                >
                  <CardContent className="px-4 py-4 sm:px-5">
                    <div
                      className="mb-2.5 flex items-center gap-2.5 border-b border-dashed pb-2.5"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                        style={{
                          background: 'var(--accent-subtle)',
                          color: 'var(--accent-text)',
                        }}
                        aria-hidden
                      >
                        <Icon size={16} strokeWidth={2} />
                      </span>
                      <h3
                        className="min-w-0 text-sm font-semibold leading-tight"
                        style={{
                          fontFamily: 'var(--font-display)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {label}
                      </h3>
                    </div>
                    {value ? (
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {value}
                      </p>
                    ) : (
                      <Skeleton className="h-[4.5rem] w-full rounded-md" />
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
