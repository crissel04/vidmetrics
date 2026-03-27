'use client'

import {
  createContext, useContext, useState, useEffect,
  useCallback, ReactNode
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/context/AuthContext'

export interface SavedComparison {
  id: string
  name: string
  channelIds: string[]
  channelTitles: string[]
  channelHandles: string[]
  thumbnailUrls: string[]
  createdAt: string
  lastViewedAt?: string
}

interface SavedComparisonsContextValue {
  comparisons: SavedComparison[]
  loading: boolean
  saveComparison: (
    name: string,
    channels: {
      id: string
      title: string
      handle: string
      thumbnailUrl: string
    }[]
  ) => Promise<SavedComparison | null>
  deleteComparison: (id: string) => Promise<void>
  markViewed: (id: string) => Promise<void>
}

const SavedComparisonsContext =
  createContext<SavedComparisonsContextValue | null>(null)

export function SavedComparisonsProvider({
  children
}: { children: ReactNode }) {
  const { user } = useAuth()
  const [comparisons, setComparisons] = useState<SavedComparison[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user) { setComparisons([]); setLoading(false); return }
    setLoading(true)

    supabase
      .from('saved_comparisons')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) {
          setComparisons((data ?? []).map(row => ({
            id: row.id,
            name: row.name,
            channelIds: row.channel_ids,
            channelTitles: row.channel_titles,
            channelHandles: row.channel_handles,
            thumbnailUrls: row.thumbnail_urls,
            createdAt: row.created_at,
            lastViewedAt: row.last_viewed_at ?? undefined,
          })))
        }
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const saveComparison = useCallback(async (
    name: string,
    channels: { id: string; title: string; handle: string; thumbnailUrl: string }[]
  ): Promise<SavedComparison | null> => {
    if (!user) return null

    const { data, error } = await supabase
      .from('saved_comparisons')
      .insert({
        user_id: user.id,
        name: name.trim(),
        channel_ids: channels.map(c => c.id),
        channel_titles: channels.map(c => c.title),
        channel_handles: channels.map(c => c.handle),
        thumbnail_urls: channels.map(c => c.thumbnailUrl),
      })
      .select()
      .single()

    if (error || !data) {
      console.error('Failed to save comparison:', error)
      return null
    }

    const saved: SavedComparison = {
      id: data.id,
      name: data.name,
      channelIds: data.channel_ids,
      channelTitles: data.channel_titles,
      channelHandles: data.channel_handles,
      thumbnailUrls: data.thumbnail_urls,
      createdAt: data.created_at,
    }

    setComparisons(prev => [saved, ...prev])
    return saved
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const deleteComparison = useCallback(async (id: string) => {
    if (!user) return
    await supabase
      .from('saved_comparisons')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    setComparisons(prev => prev.filter(c => c.id !== id))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const markViewed = useCallback(async (id: string) => {
    if (!user) return
    const now = new Date().toISOString()
    await supabase
      .from('saved_comparisons')
      .update({ last_viewed_at: now })
      .eq('id', id)
      .eq('user_id', user.id)
    setComparisons(prev => prev.map(c =>
      c.id === id ? { ...c, lastViewedAt: now } : c
    ))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return (
    <SavedComparisonsContext.Provider value={{
      comparisons, loading,
      saveComparison, deleteComparison, markViewed,
    }}>
      {children}
    </SavedComparisonsContext.Provider>
  )
}

export function useSavedComparisons() {
  const ctx = useContext(SavedComparisonsContext)
  if (!ctx) throw new Error(
    'useSavedComparisons must be used inside SavedComparisonsProvider'
  )
  return ctx
}
