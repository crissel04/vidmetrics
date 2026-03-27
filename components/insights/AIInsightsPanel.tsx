'use client'

import { useEffect, useState, useCallback } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { AIInsights, ChannelInfo, Video, ChannelMetrics } from '@/lib/types'

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

export function AIInsightsPanel({ channel, videos, metrics, onInsightsLoaded }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [partial, setPartial] = useState<Partial<AIInsights>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | false>(false)

  const fetchInsights = useCallback(async () => {
    setLoading(true)
    setError(false)
    setPartial({})

    try {
      const payload = {
        channelId: channel.id,
        channelTitle: channel.title,
        subscriberCount: channel.subscriberCount,
        videos: videos.slice(0, 20).map(v => ({
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
        setInsights(data.insights)
        onInsightsLoaded?.(data.insights)
        setLoading(false)
        return
      }

      // Streaming response
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
        // Strip markdown fences if present
        let cleanText = accumulated.trim()
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
        }
        const parsed: AIInsights = JSON.parse(cleanText)
        setInsights(parsed)
        onInsightsLoaded?.(parsed)
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
  }, [channel, videos, metrics, onInsightsLoaded])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  const sections = [
    { key: 'whatIsWorking' as const, label: "What's Working" },
    { key: 'uploadPattern' as const, label: 'Upload Pattern' },
    { key: 'titleFormula' as const, label: 'Title Formula' },
    { key: 'gapOpportunity' as const, label: 'Gap Opportunity' },
  ]

  const data = insights ?? partial

  return (
    <div
      className="rounded-xl bg-[var(--bg-card)] p-6 fade-in"
      style={{ border: '1px solid var(--accent)', borderColor: 'var(--accent)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} style={{ color: 'var(--accent)' }} />
        <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          AI Analysis
        </h3>
      </div>

      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {error}
          </p>
          <Button variant="outline" size="sm" onClick={fetchInsights} className="gap-1.5">
            <RefreshCw size={14} />
            Retry
          </Button>
        </div>
      )}

      {!error && (
        <div className="space-y-4">
          {sections.map((section) => {
            const value = data[section.key]
            if (!value && !loading) return null
            return (
              <div key={section.key} className="fade-in">
                <p
                  className="text-xs font-medium uppercase tracking-wide mb-1"
                  style={{ color: 'var(--accent-text)' }}
                >
                  {section.label}
                </p>
                {value ? (
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {value}
                  </p>
                ) : (
                  <Skeleton className="h-12 w-full" />
                )}
              </div>
            )
          })}
        </div>
      )}

      {insights && (
        <p className="text-xs mt-4 text-right" style={{ color: 'var(--text-muted)' }}>
          Powered by Claude
        </p>
      )}
    </div>
  )
}
