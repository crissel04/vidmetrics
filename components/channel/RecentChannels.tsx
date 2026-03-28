'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { X } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { useRecentChannels } from '@/lib/context/RecentChannelsContext'
import { useChannelTabs } from '@/lib/hooks/useChannelTabs'

const MAX_SHOWN = 3

export function RecentChannels() {
  const { recents, removeRecent } = useRecentChannels()
  const { addTab } = useChannelTabs()

  const shown = recents.slice(0, MAX_SHOWN)

  if (shown.length === 0) return null

  return (
    <div className="fade-in mx-auto mt-12 w-full max-w-sm">
      <p
        className="mb-1.5 text-center text-xs font-medium"
        style={{ color: 'var(--text-muted)' }}
      >
        Recent analyses
      </p>
      <div className="grid grid-cols-3 gap-2">
        {shown.map((ch) => (
          <div
            key={ch.channelId}
            className="group relative aspect-square min-w-0"
          >
            <Link
              href={`/analysis/${ch.channelId}`}
              className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2 text-center transition-[background-color,border-color] duration-150 ease-out hover:border-[color-mix(in_srgb,var(--accent)_22%,var(--border))] hover:bg-[var(--border-subtle)]"
              onClick={() => {
                addTab({
                  channelId: ch.channelId,
                  title: ch.title,
                  handle: ch.handle,
                  thumbnailUrl: ch.thumbnailUrl,
                })
              }}
            >
              <Avatar className="size-10 shrink-0">
                <AvatarImage src={ch.thumbnailUrl} alt="" className="object-cover" />
                <AvatarFallback
                  className="text-xs font-medium"
                  style={{
                    background: 'var(--accent-subtle)',
                    color: 'var(--accent-text)',
                  }}
                >
                  {ch.title.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-h-0 w-full min-w-0 flex-col items-center gap-px px-0.5">
                <p
                  className="line-clamp-2 w-full text-xs font-medium leading-snug"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {ch.title}
                </p>
                <p
                  className="text-[11px] leading-snug tabular-nums sm:text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {formatNumber(ch.subscriberCount)} subs
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                removeRecent(ch.channelId)
              }}
              className="absolute right-0 top-0 z-10 flex size-6 translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] opacity-0 transition-[opacity,background-color,color,border-color,transform] duration-150 ease-out group-hover:opacity-100 hover:border-[color-mix(in_srgb,var(--accent)_22%,var(--border))] hover:bg-[color-mix(in_srgb,var(--accent)_16%,var(--bg-card))] hover:text-[var(--accent-text)] active:scale-95"
              aria-label={`Remove ${ch.title} from recents`}
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
