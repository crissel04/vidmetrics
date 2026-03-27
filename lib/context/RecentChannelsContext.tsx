'use client'

import {
  createContext, useContext, useState, useEffect,
  useCallback, type ReactNode,
} from 'react'
import type { RecentChannel } from '@/lib/types'

interface RecentChannelsContextValue {
  recents: RecentChannel[]
  addRecent: (channel: RecentChannel) => void
  removeRecent: (channelId: string) => void
}

const RecentChannelsContext = createContext<RecentChannelsContextValue | null>(null)

const STORAGE_KEY = 'vidmetrics_recent'
const MAX_RECENTS = 5

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

export function RecentChannelsProvider({ children }: { children: ReactNode }) {
  const [recents, setRecents] = useState<RecentChannel[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: RecentChannel[] = JSON.parse(stored)
        const sorted = parsed.sort(
          (a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
        )
        setRecents(sorted)
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_CHANNELS))
        setRecents(DEMO_CHANNELS)
      }
    } catch {
      setRecents([])
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recents))
  }, [recents, loaded])

  const addRecent = useCallback((channel: RecentChannel) => {
    setRecents(prev => {
      const filtered = prev.filter(r => r.channelId !== channel.channelId)
      return [
        { ...channel, analyzedAt: new Date().toISOString() },
        ...filtered,
      ].slice(0, MAX_RECENTS)
    })
  }, [])

  const removeRecent = useCallback((channelId: string) => {
    setRecents(prev => prev.filter(r => r.channelId !== channelId))
  }, [])

  return (
    <RecentChannelsContext.Provider value={{ recents, addRecent, removeRecent }}>
      {children}
    </RecentChannelsContext.Provider>
  )
}

export function useRecentChannels() {
  const ctx = useContext(RecentChannelsContext)
  if (!ctx) throw new Error('useRecentChannels must be used inside RecentChannelsProvider')
  return ctx
}
