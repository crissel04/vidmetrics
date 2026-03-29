'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { InsightTimelineRailed } from '@/components/insights/InsightTimelineRailed'
import type { AIInsights } from '@/lib/types'

interface ContentGapDetectorProps {
  insights: AIInsights | null
  loading: boolean
}

export function ContentGapDetector({ insights, loading }: ContentGapDetectorProps) {
  const [copied, setCopied] = useState(false)

  if (loading) {
    return (
      <div className="fade-in px-4 py-2">
        <Skeleton className="mb-3 h-4 w-40" />
        <Skeleton className="mb-2 h-3 w-full max-w-md" />
        <div className="mt-4 space-y-3 pl-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!insights?.gapOpportunities?.length) return null

  const handleCopy = async () => {
    const text = insights.gapOpportunities
      .map((gap, i) => `${i + 1}. ${gap}`)
      .join('\n\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const layoutKey = insights.gapOpportunities.join('\n')

  return (
    <div className="fade-in">
      <InsightTimelineRailed
        layoutKey={layoutKey}
        className="pb-2"
        railConnectTopClass="-top-6"
        title="Content gaps"
        subtitle={"Opportunities your competitor hasn't covered"}
        items={insights.gapOpportunities}
      />
      <div className="mt-4 pl-4 pr-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-1.5 text-xs"
          style={{ borderColor: 'var(--border)' }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Use these as content briefs'}
        </Button>
      </div>
    </div>
  )
}
