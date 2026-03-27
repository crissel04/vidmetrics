'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { ComparePanel } from '@/components/compare/ComparePanel'
import type { ChannelInfo } from '@/lib/types'

interface ChannelHeaderProps {
  channel: ChannelInfo
  onShare?: () => void
  shareButton?: React.ReactNode
}

export function ChannelHeader({ channel, onShare, shareButton }: ChannelHeaderProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={channel.thumbnailUrl} alt={channel.title} />
            <AvatarFallback style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}>
              {channel.title.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              {channel.title}
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              {channel.handle && (
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {channel.handle}
                </span>
              )}
              {channel.country && (
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {' '}{channel.country}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <StatPill label="Subscribers" value={formatNumber(channel.subscriberCount)} hidden={channel.hiddenSubscriberCount} />
              <StatPill label="Videos" value={formatNumber(channel.videoCount)} />
              <StatPill label="Total views" value={formatNumber(channel.viewCount)} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {shareButton ? shareButton : onShare && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              className="gap-1.5"
              style={{ borderColor: 'var(--border)' }}
            >
              <Share2 size={14} />
              Share
            </Button>
          )}
          <ComparePanel currentChannel={channel} />
        </div>
      </div>
    </div>
  )
}

function StatPill({ label, value, hidden }: { label: string; value: string; hidden?: boolean }) {
  return (
    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
      <span className="font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {hidden ? 'Hidden' : value}
      </span>{' '}
      {label}
    </span>
  )
}
