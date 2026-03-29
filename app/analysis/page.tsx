'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useChannelTabs } from '@/lib/hooks/useChannelTabs'
import { RecentChannels } from '@/components/channel/RecentChannels'
import { HeroBackground } from '@/components/layout/HeroBackground'
import { VidMetricsLogo } from '@/components/layout/VidMetricsLogo'
import { normalizeChannelInput } from '@/lib/utils'

export default function AnalysisIndexPage() {
  const { tabs } = useChannelTabs()
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  async function handleAnalyze() {
    setError('')

    let fullUrl: string
    try {
      fullUrl = normalizeChannelInput(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid input')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/channel?url=${encodeURIComponent(fullUrl)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      router.push(`/analysis/${data.channel.id}`)
    } catch {
      setError('Network error — please try again')
      setLoading(false)
    }
  }

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
            Paste a channel URL or @handle to start analyzing.
          </p>
        </div>

        <div className="mt-9 flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-stretch">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <Input
              placeholder="@channel or youtube.com/@channel"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleAnalyze()}
              className="h-11 pl-10 text-base"
              style={{
                background: 'var(--bg-card)',
                borderColor: error ? 'var(--red)' : 'var(--border)',
              }}
            />
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={loading}
            className="h-11 shrink-0 cursor-pointer gap-1.5 border border-white/20 px-4 text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.2)] transition-shadow duration-300 ease-out hover:shadow-[inset_0_2px_14px_rgba(255,255,255,0.18),inset_0_-3px_16px_rgba(0,0,0,0.22)]"
            style={{ background: 'var(--accent)', color: '#ffffff' }}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                Analyze Channel
                <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </>
            )}
          </Button>
        </div>

        {error && (
          <p className="mt-3 text-sm" style={{ color: 'var(--red-text)' }}>{error}</p>
        )}

        <RecentChannels />
      </div>
    </div>
  )
}
