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
      }
    } catch {
      setRecents([])
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recents))
    } catch {
      // localStorage full or unavailable (private browsing) — degrade gracefully
    }
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
