'use client'

import {
  createContext, useContext, useState, useEffect,
  useCallback, type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/context/AuthContext'

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
  tags: string[]
}

interface WatchlistContextValue {
  watchlist: WatchlistEntry[]
  loading: boolean
  addToWatchlist: (entry: Omit<WatchlistEntry, 'tags'>) => Promise<void>
  removeFromWatchlist: (channelId: string) => Promise<void>
  isWatchlisted: (channelId: string) => boolean
  updateLastAnalyzed: (
    channelId: string,
    momentumScore: number,
    momentumLabel: string
  ) => Promise<void>
  addTag: (channelId: string, tag: string) => Promise<void>
  removeTag: (channelId: string, tag: string) => Promise<void>
  getAllTags: () => string[]
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null)
const LOCAL_KEY = 'vidmetrics_watchlist'

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    setLoading(true)

    if (user) {
      Promise.all([
        supabase
          .from('watchlist')
          .select('*')
          .order('added_at', { ascending: false }),
        supabase
          .from('watchlist_tags')
          .select('channel_id, tag'),
      ]).then(([watchlistResult, tagsResult]) => {
        const tagsByChannel: Record<string, string[]> = {}
        ;(tagsResult.data ?? []).forEach((row: { channel_id: string; tag: string }) => {
          if (!tagsByChannel[row.channel_id]) {
            tagsByChannel[row.channel_id] = []
          }
          tagsByChannel[row.channel_id].push(row.tag)
        })

        setWatchlist(
          (watchlistResult.data ?? []).map((row: Record<string, unknown>) => ({
            channelId: row.channel_id as string,
            channelTitle: row.channel_title as string,
            handle: row.handle as string,
            thumbnailUrl: row.thumbnail_url as string,
            subscriberCount: row.subscriber_count as number,
            category: row.category as string,
            addedAt: row.added_at as string,
            lastAnalyzedAt: (row.last_analyzed_at as string) ?? undefined,
            lastMomentumScore: (row.last_momentum_score as number) ?? undefined,
            lastMomentumLabel: (row.last_momentum_label as string) ?? undefined,
            tags: tagsByChannel[row.channel_id as string] ?? [],
          }))
        )
        setLoading(false)
      })
    } else {
      try {
        const stored = localStorage.getItem(LOCAL_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          // Ensure tags field exists for legacy localStorage entries
          setWatchlist(parsed.map((e: WatchlistEntry) => ({ ...e, tags: e.tags ?? [] })))
        }
      } catch {
        setWatchlist([])
      }
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (!user && !loading) {
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(watchlist))
      } catch {}
    }
  }, [watchlist, user, loading])

  const addToWatchlist = useCallback(async (
    entry: Omit<WatchlistEntry, 'tags'>
  ) => {
    if (watchlist.find(w => w.channelId === entry.channelId)) return
    const newEntry: WatchlistEntry = {
      ...entry,
      addedAt: new Date().toISOString(),
      tags: [],
    }

    if (user) {
      const { error } = await supabase.from('watchlist').upsert({
        user_id: user.id,
        channel_id: entry.channelId,
        channel_title: entry.channelTitle,
        handle: entry.handle,
        thumbnail_url: entry.thumbnailUrl,
        subscriber_count: entry.subscriberCount,
        category: entry.category,
        added_at: newEntry.addedAt,
      }, { onConflict: 'user_id,channel_id' })
      if (error) { console.error(error); return }
    }

    setWatchlist(prev => [newEntry, ...prev])
  }, [watchlist, user, supabase])

  const removeFromWatchlist = useCallback(async (channelId: string) => {
    if (user) {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('channel_id', channelId)
      if (error) { console.error(error); return }
    }
    setWatchlist(prev => prev.filter(w => w.channelId !== channelId))
  }, [user, supabase])

  const isWatchlisted = useCallback((channelId: string) =>
    watchlist.some(w => w.channelId === channelId),
  [watchlist])

  const updateLastAnalyzed = useCallback(async (
    channelId: string,
    momentumScore: number,
    momentumLabel: string
  ) => {
    const now = new Date().toISOString()
    if (user) {
      await supabase.from('watchlist')
        .update({
          last_momentum_score: momentumScore,
          last_momentum_label: momentumLabel,
          last_analyzed_at: now,
        })
        .eq('user_id', user.id)
        .eq('channel_id', channelId)
    }
    setWatchlist(prev => prev.map(w =>
      w.channelId === channelId
        ? { ...w, lastMomentumScore: momentumScore,
            lastMomentumLabel: momentumLabel,
            lastAnalyzedAt: now }
        : w
    ))
  }, [user, supabase])

  const addTag = useCallback(async (channelId: string, tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (!trimmed) return
    const entry = watchlist.find(w => w.channelId === channelId)
    if (!entry || entry.tags.includes(trimmed)) return

    if (user) {
      const { error } = await supabase.from('watchlist_tags').insert({
        user_id: user.id,
        channel_id: channelId,
        tag: trimmed,
      })
      if (error) { console.error(error); return }
    }

    setWatchlist(prev => prev.map(w =>
      w.channelId === channelId
        ? { ...w, tags: [...w.tags, trimmed] }
        : w
    ))
  }, [watchlist, user, supabase])

  const removeTag = useCallback(async (channelId: string, tag: string) => {
    if (user) {
      await supabase.from('watchlist_tags')
        .delete()
        .eq('user_id', user.id)
        .eq('channel_id', channelId)
        .eq('tag', tag)
    }
    setWatchlist(prev => prev.map(w =>
      w.channelId === channelId
        ? { ...w, tags: w.tags.filter(t => t !== tag) }
        : w
    ))
  }, [user, supabase])

  const getAllTags = useCallback(() => {
    const all = watchlist.flatMap(w => w.tags)
    return [...new Set(all)].sort()
  }, [watchlist])

  return (
    <WatchlistContext.Provider value={{
      watchlist, loading,
      addToWatchlist, removeFromWatchlist,
      isWatchlisted, updateLastAnalyzed,
      addTag, removeTag, getAllTags,
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
