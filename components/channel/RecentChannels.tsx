'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { X } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import type { RecentChannel } from '@/lib/types'

const STORAGE_KEY = 'vidmetrics_recent'
const MAX_RECENT = 5

const DEMO_CHANNELS: RecentChannel[] = [
  {
    channelId: 'UCX6OQ3DkcsbYNE6H8uQQuVA',
    title: 'MrBeast',
    handle: '@MrBeast',
    thumbnailUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_nkosm-3sSEH9MvkCIvGpb1wG6X0EjNJJwjlA0OYZ1a4w=s88-c-k-c0x00ffffff-no-rj',
    subscriberCount: 348000000,
    analyzedAt: new Date().toISOString(),
  },
  {
    channelId: 'UCBJycsmduvYEL83R_U4JriQ',
    title: 'MKBHD',
    handle: '@mkbhd',
    thumbnailUrl: 'https://yt3.googleusercontent.com/lkH37D712tiyphnu0Id0D5MwwQ7IRuwgQLVD05iMXlDWO-biDl22grY1YFKnhZCpiGN1gVHb=s88-c-k-c0x00ffffff-no-rj',
    subscriberCount: 19800000,
    analyzedAt: new Date().toISOString(),
  },
  {
    channelId: 'UCHnyfMqiRRG1u-2MsSQLbXA',
    title: 'Veritasium',
    handle: '@veritasium',
    thumbnailUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_kKRNOQkSIFBvTkqcskDBaTMEBhRJhbdSNbaN2f9g=s88-c-k-c0x00ffffff-no-rj',
    subscriberCount: 16600000,
    analyzedAt: new Date().toISOString(),
  },
]

export function RecentChannels() {
  const [channels, setChannels] = useState<RecentChannel[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setChannels(JSON.parse(stored))
      } catch {
        setChannels([])
      }
    } else {
      // First visit — seed with demo data
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_CHANNELS))
      setChannels(DEMO_CHANNELS)
    }
  }, [])

  const handleRemove = (channelId: string) => {
    const updated = channels.filter(c => c.channelId !== channelId)
    setChannels(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  if (!mounted || channels.length === 0) return null

  return (
    <div className="w-full max-w-xl mt-6 fade-in">
      <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
        Recent analyses
      </p>
      <div className="flex flex-col gap-2">
        {channels.slice(0, MAX_RECENT).map((ch) => (
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
                handleRemove(ch.channelId)
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

/** Call this from the analysis page to save a channel to recents */
export function addRecentChannel(channel: RecentChannel) {
  if (typeof window === 'undefined') return
  const stored = localStorage.getItem(STORAGE_KEY)
  let channels: RecentChannel[] = []
  if (stored) {
    try { channels = JSON.parse(stored) } catch { /* ignore */ }
  }
  // Remove duplicate, add to front
  channels = [channel, ...channels.filter(c => c.channelId !== channel.channelId)].slice(0, MAX_RECENT)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(channels))
}
