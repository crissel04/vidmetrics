'use client'

import { createContext, useContext, useRef, useCallback, type ReactNode } from 'react'
import type { ChannelInfo, Video, ChannelMetrics } from '@/lib/types'

export interface CachedChannelData {
  channel: ChannelInfo
  videos: Video[]
  metrics: ChannelMetrics
}

interface ChannelCacheContextValue {
  get: (channelId: string) => CachedChannelData | undefined
  set: (channelId: string, data: CachedChannelData) => void
  has: (channelId: string) => boolean
}

const ChannelCacheContext = createContext<ChannelCacheContextValue | null>(null)

export function ChannelCacheProvider({ children }: { children: ReactNode }) {
  const cache = useRef<Map<string, CachedChannelData>>(new Map())

  const get = useCallback((channelId: string) => {
    return cache.current.get(channelId)
  }, [])

  const set = useCallback((channelId: string, data: CachedChannelData) => {
    cache.current.set(channelId, data)
  }, [])

  const has = useCallback((channelId: string) => {
    return cache.current.has(channelId)
  }, [])

  return (
    <ChannelCacheContext.Provider value={{ get, set, has }}>
      {children}
    </ChannelCacheContext.Provider>
  )
}

export function useChannelCache() {
  const ctx = useContext(ChannelCacheContext)
  if (!ctx) throw new Error('useChannelCache must be used inside ChannelCacheProvider')
  return ctx
}
