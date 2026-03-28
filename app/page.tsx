'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RecentChannels } from '@/components/channel/RecentChannels'
import { HeroBackground } from '@/components/layout/HeroBackground'
import { VidMetricsLogo } from '@/components/layout/VidMetricsLogo'

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('error') === 'auth_failed') {
      toast.error('Sign in failed. Please try again.')
    }
  }, [searchParams])

  async function handleAnalyze() {
    setError('')
    if (!url.trim()) {
      setError('Please enter a YouTube channel URL')
      return
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`)
    } catch {
      setError("That doesn't look like a YouTube channel URL")
      return
    }

    if (!parsedUrl.hostname.includes('youtube.com') && !parsedUrl.hostname.includes('youtu.be')) {
      setError("That doesn't look like a YouTube channel URL")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/channel?url=${encodeURIComponent(parsedUrl.toString())}`)
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
        <div className="flex w-full flex-col items-center gap-4">
          <VidMetricsLogo className="size-11" />

          <h1
            className="w-full text-4xl font-semibold tracking-tight sm:text-5xl max-w-2xl"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Know what your competitors are doing on YouTube
          </h1>

          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Paste any channel URL. Get instant performance intelligence.
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
              placeholder="https://youtube.com/@channel"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setError('')
              }}
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
            style={{
              background: 'var(--accent)',
              color: '#ffffff',
            }}
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
          <p className="mt-3 text-sm" style={{ color: 'var(--red-text)' }}>
            {error}
          </p>
        )}

        <RecentChannels />
      </div>
    </div>
  )
}
