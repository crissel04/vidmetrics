'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useChannelTabs } from '@/lib/hooks/useChannelTabs'
import { useWatchlist } from '@/lib/context/WatchlistContext'

export function WatchlistSidebarGroup() {
  const { watchlist, removeFromWatchlist } = useWatchlist()
  const { addTab } = useChannelTabs()

  if (watchlist.length === 0) {
    return null
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Watchlist</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {watchlist.map((ch) => (
            <SidebarMenuItem key={ch.channelId} className="group/watchlist-row">
              <SidebarMenuButton
                render={
                  <Link
                    href={`/analysis/${ch.channelId}`}
                    onClick={() => {
                      addTab({
                        channelId: ch.channelId,
                        title: ch.channelTitle,
                        handle: ch.handle,
                        thumbnailUrl: ch.thumbnailUrl,
                      })
                    }}
                  >
                    <Avatar className="h-4 w-4 shrink-0">
                      <AvatarImage src={ch.thumbnailUrl} alt={ch.channelTitle} />
                      <AvatarFallback
                        style={{
                          background: 'var(--accent-subtle)',
                          color: 'var(--accent-text)',
                          fontSize: '6px',
                        }}
                      >
                        {ch.channelTitle.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-[16ch]">{ch.channelTitle}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        removeFromWatchlist(ch.channelId)
                      }}
                      className="shrink-0 ml-auto cursor-pointer p-0.5 rounded opacity-0 transition-opacity duration-150 group-hover/watchlist-row:opacity-100"
                      style={{ color: 'var(--text-muted)' }}
                      aria-label={`Remove ${ch.channelTitle} from watchlist`}
                    >
                      <X size={12} />
                    </button>
                  </Link>
                }
              />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
