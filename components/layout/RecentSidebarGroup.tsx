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
import { useRecentChannels } from '@/lib/context/RecentChannelsContext'

export function RecentSidebarGroup() {
  const { recents, removeRecent } = useRecentChannels()
  const { addTab } = useChannelTabs()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Recent</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {recents.length === 0 ? (
            <SidebarMenuItem>
              <span
                className="px-2 py-1.5 text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                No recent analyses
              </span>
            </SidebarMenuItem>
          ) : (
            recents.map((ch) => (
              <SidebarMenuItem key={ch.channelId} className="group">
                <SidebarMenuButton
                  render={
                    <Link
                      href={`/analysis/${ch.channelId}`}
                      onClick={() => {
                        addTab({
                          channelId: ch.channelId,
                          title: ch.title,
                          handle: ch.handle,
                          thumbnailUrl: ch.thumbnailUrl,
                        })
                      }}
                    >
                      <Avatar className="h-4 w-4 shrink-0">
                        <AvatarImage src={ch.thumbnailUrl} alt={ch.title} />
                        <AvatarFallback
                          style={{
                            background: 'var(--accent-subtle)',
                            color: 'var(--accent-text)',
                            fontSize: '6px',
                          }}
                        >
                          {ch.title.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate max-w-[16ch]">{ch.title}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removeRecent(ch.channelId)
                        }}
                        className="shrink-0 ml-auto p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <X size={12} />
                      </button>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            ))
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
