'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChannelTabs } from '@/lib/hooks/useChannelTabs'
import { RecentChannels } from '@/components/channel/RecentChannels'
import { HeroBackground } from '@/components/layout/HeroBackground'
import { VidMetricsLogo } from '@/components/layout/VidMetricsLogo'

export default function AnalysisIndexPage() {
  const { tabs, channelTabs } = useChannelTabs()
  const router = useRouter()

  useEffect(() => {
    if (tabs.length > 0) {
      const first = tabs[0]
      if (first.type === 'channel') {
        router.replace(`/analysis/${first.channelId}`)
      } else {
        router.replace(`/analysis/compare/${first.id}`)
      }
    }
  }, [tabs, router])

  if (tabs.length > 0) return null

  return (
    <div className="-mt-14 flex w-full flex-1 flex-col items-center justify-center">
      <HeroBackground />

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center px-6 pt-12 text-center">
        <div className="flex w-full flex-col items-center gap-3">
          <VidMetricsLogo className="size-10" />

          <h1
            className="w-full max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            No channel open
          </h1>

          <p className="max-w-lg text-base sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
            Paste a YouTube channel URL to start analyzing, or pick a channel you&apos;ve analyzed before.
          </p>
        </div>

        <div className="mt-9 flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-center">
          <Button
            onClick={() => router.push('/')}
            className="h-11 shrink-0 cursor-pointer gap-1.5 border border-white/20 px-4 text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.2)] transition-shadow duration-300 ease-out hover:shadow-[inset_0_2px_14px_rgba(255,255,255,0.18),inset_0_-3px_16px_rgba(0,0,0,0.22)]"
            style={{
              background: 'var(--accent)',
              color: '#ffffff',
            }}
          >
            Analyze a channel
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </Button>
        </div>

        <RecentChannels />
      </div>
    </div>
  )
}
