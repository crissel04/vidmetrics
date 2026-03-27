'use client'

import {
  createContext, useContext, useState, useEffect,
  useCallback, type ReactNode,
} from 'react'

export interface WatchlistEntry {
  channelId: string
  channelTitle: string
  handle: string
  thumbnailUrl: string
  subscriberCount: number
  category: string
  addedAt: string
  lastAnalyzedAt?: string
  lastMomentumScore?: number
  lastMomentumLabel?: string
}

interface WatchlistContextValue {
  watchlist: WatchlistEntry[]
  addToWatchlist: (entry: WatchlistEntry) => void
  removeFromWatchlist: (channelId: string) => void
  isWatchlisted: (channelId: string) => boolean
  updateLastAnalyzed: (channelId: string, momentumScore: number, momentumLabel: string) => void
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null)
const STORAGE_KEY = 'vidmetrics_watchlist'

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setWatchlist(JSON.parse(stored))
    } catch {
      setWatchlist([])
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist))
    } catch {
      // localStorage full or unavailable — degrade gracefully
    }
  }, [watchlist, loaded])

  const addToWatchlist = useCallback((entry: WatchlistEntry) => {
    setWatchlist(prev => {
      if (prev.find(w => w.channelId === entry.channelId)) return prev
      return [...prev, { ...entry, addedAt: new Date().toISOString() }]
    })
  }, [])

  const removeFromWatchlist = useCallback((channelId: string) => {
    setWatchlist(prev => prev.filter(w => w.channelId !== channelId))
  }, [])

  const isWatchlisted = useCallback((channelId: string) => {
    return watchlist.some(w => w.channelId === channelId)
  }, [watchlist])

  const updateLastAnalyzed = useCallback((
    channelId: string,
    momentumScore: number,
    momentumLabel: string
  ) => {
    setWatchlist(prev => prev.map(w =>
      w.channelId === channelId
        ? {
            ...w,
            lastAnalyzedAt: new Date().toISOString(),
            lastMomentumScore: momentumScore,
            lastMomentumLabel: momentumLabel,
          }
        : w
    ))
  }, [])

  return (
    <WatchlistContext.Provider value={{
      watchlist,
      addToWatchlist,
      removeFromWatchlist,
      isWatchlisted,
      updateLastAnalyzed,
    }}>
      {children}
    </WatchlistContext.Provider>
  )
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext)
  if (!ctx) throw new Error('useWatchlist must be used inside WatchlistProvider')
  return ctx
}
