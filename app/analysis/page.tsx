'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useChannelTabs } from '@/lib/hooks/useChannelTabs'
import { useRecentChannels } from '@/lib/context/RecentChannelsContext'
import { formatNumber } from '@/lib/utils'

export default function AnalysisIndexPage() {
  const { tabs } = useChannelTabs()
  const { recents } = useRecentChannels()
  const router = useRouter()

  // If there are open tabs, redirect to the first one automatically
  useEffect(() => {
    if (tabs.length > 0) {
      router.replace(`/analysis/${tabs[0].channelId}`)
    }
  }, [tabs, router])

  // If redirecting, show nothing (avoids flash)
  if (tabs.length > 0) return null

  // No open tabs — show a helpful empty state
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center fade-in">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: 'var(--bg-app)' }}
      >
        <BarChart2 size={24} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div className="space-y-1">
        <p
          className="font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          No channel open
        </p>
        <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
          Paste a YouTube channel URL to start analyzing, or pick a channel you've analyzed before.
        </p>
      </div>
      <Button
        onClick={() => router.push('/')}
        style={{ background: 'var(--accent)', color: '#ffffff' }}
      >
        Analyze a channel
      </Button>

      {/* Show recent channels as quick picks if available */}
      {recents.length > 0 && (
        <div className="w-full max-w-sm space-y-2">
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Recent
          </p>
          <div className="space-y-1">
            {recents.slice(0, 3).map(channel => (
              <button
                key={channel.channelId}
                onClick={() => router.push(`/analysis/${channel.channelId}`)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left"
                style={{ background: 'transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-app)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={channel.thumbnailUrl} alt={channel.title} />
                  <AvatarFallback
                    style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', fontSize: '11px' }}
                  >
                    {channel.title.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {channel.title}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {channel.handle} · {formatNumber(channel.subscriberCount)} subscribers
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
