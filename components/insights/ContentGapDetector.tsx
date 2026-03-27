'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { AIInsights } from '@/lib/types'

interface ContentGapDetectorProps {
  insights: AIInsights | null
  loading: boolean
}

export function ContentGapDetector({ insights, loading }: ContentGapDetectorProps) {
  const [copied, setCopied] = useState(false)

  if (loading) {
    return (
      <div
        className="rounded-xl bg-[var(--bg-card)] p-6"
        style={{ border: '1px solid var(--green)' }}
      >
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
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

  return (
    <div
      className="rounded-xl bg-[var(--bg-card)] p-6 fade-in"
      style={{ border: '1px solid var(--green)' }}
    >
      <h3
        className="text-sm font-semibold mb-1"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Content Gaps
      </h3>
      <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
        Opportunities your competitor hasn&apos;t covered
      </p>

      <div className="space-y-4">
        {insights.gapOpportunities.map((gap, i) => (
          <div key={i} className="flex gap-3">
            <span
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
              style={{ background: 'var(--green-subtle)', color: 'var(--green-text)' }}
            >
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {gap}
            </p>
          </div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="mt-4 gap-1.5 text-xs"
        style={{ color: 'var(--green-text)' }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied!' : 'Use these as content briefs'}
      </Button>
    </div>
  )
}
