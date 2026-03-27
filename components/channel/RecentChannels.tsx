'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { X } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { useRecentChannels } from '@/lib/context/RecentChannelsContext'
import { useChannelTabs } from '@/lib/hooks/useChannelTabs'

export function RecentChannels() {
  const { recents, removeRecent } = useRecentChannels()
  const { addTab } = useChannelTabs()

  if (recents.length === 0) return null

  return (
    <div className="w-full max-w-xl mt-6 fade-in">
      <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
        Recent analyses
      </p>
      <div className="flex flex-col gap-2">
        {recents.map((ch) => (
          <div
            key={ch.channelId}
            className="flex items-center gap-3 rounded-lg border px-3 py-2 group transition-colors duration-150"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-card)',
            }}
          >
            <Link
              href={`/analysis/${ch.channelId}`}
              className="flex items-center gap-3 flex-1 min-w-0"
              onClick={() => {
                addTab({
                  channelId: ch.channelId,
                  title: ch.title,
                  handle: ch.handle,
                  thumbnailUrl: ch.thumbnailUrl,
                })
              }}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={ch.thumbnailUrl} alt={ch.title} />
                <AvatarFallback style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', fontSize: '10px' }}>
                  {ch.title.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {ch.title}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {ch.handle} · {formatNumber(ch.subscriberCount)} subs
                </p>
              </div>
              <span
                className="text-xs shrink-0"
                style={{ color: 'var(--accent-text)' }}
              >
                View Report →
              </span>
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                removeRecent(ch.channelId)
              }}
              className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
