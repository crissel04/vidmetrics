'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
import type { RecentChannel } from '@/lib/types'

const STORAGE_KEY = 'vidmetrics_recent'
const MAX_RECENT = 5

export function RecentSidebarGroup() {
  const [channels, setChannels] = useState<RecentChannel[]>([])
  const [mounted, setMounted] = useState(false)
  const { addTab } = useChannelTabs()

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setChannels(JSON.parse(stored))
      } catch {
        setChannels([])
      }
    }
  }, [])

  if (!mounted) return null

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Recent</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {channels.length === 0 ? (
            <SidebarMenuItem>
              <span
                className="px-2 py-1.5 text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                No recent analyses
              </span>
            </SidebarMenuItem>
          ) : (
            channels.slice(0, MAX_RECENT).map((ch) => (
              <SidebarMenuItem key={ch.channelId}>
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
                      <span className="truncate max-w-[20ch]">{ch.title}</span>
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
