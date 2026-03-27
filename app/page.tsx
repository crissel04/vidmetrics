'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, BarChart2, Target, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RecentChannels } from '@/components/channel/RecentChannels'

const chips = [
  { icon: BarChart2, label: 'Track competitors' },
  { icon: Target, label: 'Find content gaps' },
  { icon: TrendingUp, label: 'Benchmark performance' },
]

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleAnalyze() {
    setError('')
    if (!url.trim()) {
      setError('Please enter a YouTube channel URL')
      return
    }

    // Basic URL validation
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
    <div className="flex flex-1 flex-col items-center justify-center px-4 -mt-14 relative overflow-hidden">
      {/* CSS-only subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full text-center gap-6">
        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Know what your competitors are doing on YouTube
        </h1>

        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          Paste any channel URL. Get instant performance intelligence.
        </p>

        <div className="flex w-full gap-3 max-w-xl">
          <div className="relative flex-1">
            <Search
              size={18}
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
              className="pl-10 h-12 text-base"
              style={{
                background: 'var(--bg-card)',
                borderColor: error ? 'var(--red)' : 'var(--border)',
              }}
            />
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={loading}
            className="h-12 px-6 text-base font-medium"
            style={{
              background: 'var(--accent)',
              color: '#ffffff',
            }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Analyze Channel'
            )}
          </Button>
        </div>

        {error && (
          <p className="text-sm" style={{ color: 'var(--red-text)' }}>
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {chips.map((chip) => (
            <div
              key={chip.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
              style={{
                background: 'var(--accent-subtle)',
                color: 'var(--accent-text)',
              }}
            >
              <chip.icon size={14} />
              {chip.label}
            </div>
          ))}
        </div>

        {/* Recent channels */}
        <RecentChannels />
      </div>
    </div>
  )
}
