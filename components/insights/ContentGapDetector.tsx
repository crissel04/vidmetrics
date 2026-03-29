'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const skCanvas = '!bg-[var(--skeleton-on-canvas)]'
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
      <div className="fade-in relative pl-4 pr-4 pb-2">
        <div
          className="pointer-events-none absolute top-0 bottom-8 left-[26px] w-px -translate-x-1/2 bg-[var(--insight-timeline-rail)]"
          aria-hidden
        />
        <Skeleton className={cn('mb-1 ml-[34px] h-4 w-32 rounded-md', skCanvas)} />
        <Skeleton className={cn('mb-4 ml-[34px] h-3 max-w-md rounded-md', skCanvas)} />
        <ul className="m-0 list-none space-y-5 p-0">
          {[1, 2, 3].map(i => (
            <li key={i} className="flex gap-3.5">
              <div className="flex w-5 shrink-0 justify-center pt-1">
                <Skeleton className={cn('h-2 w-2 shrink-0 rounded-full', skCanvas)} />
              </div>
              <Skeleton className={cn('h-[3.25rem] min-w-0 flex-1 rounded-md', skCanvas)} />
            </li>
          ))}
        </ul>
        <Skeleton className={cn('ml-4 mt-4 h-8 w-52 rounded-md', skCanvas)} />
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
