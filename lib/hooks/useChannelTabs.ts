'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'vidmetrics_tabs'
export const MAX_TABS = 8
const SYNC_EVENT = 'vidmetrics_tabs_sync'

export interface ChannelTab {
  type: 'channel'
  id: string
  channelId: string
  title: string
  handle: string
  thumbnailUrl: string
}

export interface ComparisonTab {
  type: 'comparison'
  id: string
  name: string
  channels: {
    channelId: string
    title: string
    handle: string
    thumbnailUrl: string
  }[]
}

export type Tab = ChannelTab | ComparisonTab

// Migrate legacy tabs (no `type` field) to the new format
function migrateTabs(raw: unknown[]): Tab[] {
  return raw.map((item: unknown) => {
    const t = item as Record<string, unknown>
    if (t.type === 'channel' || t.type === 'comparison') return t as unknown as Tab
    // Legacy ChannelTab without type/id
    return {
      type: 'channel' as const,
      id: t.channelId as string,
      channelId: t.channelId as string,
      title: t.title as string,
      handle: t.handle as string,
      thumbnailUrl: t.thumbnailUrl as string,
    }
  })
}

function readTabs(): Tab[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return migrateTabs(JSON.parse(stored))
  } catch {
    return []
  }
}

function writeTabs(tabs: Tab[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs))
  } catch {
    // localStorage full or unavailable
  }
  window.dispatchEvent(new Event(SYNC_EVENT))
}

export function useChannelTabs() {
  const [tabs, setTabs] = useState<Tab[]>([])

  useEffect(() => {
    setTabs(readTabs())

    const handleSync = () => setTabs(readTabs())
    window.addEventListener(SYNC_EVENT, handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

  const channelTabs = tabs.filter((t): t is ChannelTab => t.type === 'channel')
  const comparisonTabs = tabs.filter((t): t is ComparisonTab => t.type === 'comparison')

  const addTab = useCallback((tab: Omit<ChannelTab, 'type' | 'id'>) => {
    const prev = readTabs()
    const existing = prev.find(t => t.type === 'channel' && t.id === tab.channelId)
    if (existing) {
      const updated = prev.map(t =>
        t.type === 'channel' && t.id === tab.channelId
          ? { ...t, ...tab, type: 'channel' as const, id: tab.channelId }
          : t
      )
      writeTabs(updated)
      return
    }
    let next = [...prev, { ...tab, type: 'channel' as const, id: tab.channelId }]
    // If over total limit, remove the oldest tab
    while (next.length > MAX_TABS) {
      next.splice(0, 1)
    }
    writeTabs(next)
  }, [])

  const addComparisonTab = useCallback((tab: Omit<ComparisonTab, 'type'>) => {
    const prev = readTabs()
    // Don't add duplicates
    if (prev.find(t => t.id === tab.id)) return
    let next = [...prev, { ...tab, type: 'comparison' as const }]
    // If over total limit, remove the oldest tab
    while (next.length > MAX_TABS) {
      next.splice(0, 1)
    }
    writeTabs(next)
  }, [])

  const updateComparisonTab = useCallback((id: string, update: Partial<Pick<ComparisonTab, 'name' | 'channels'>>) => {
    const prev = readTabs()
    const next = prev.map(t => {
      if (t.id === id && t.type === 'comparison') return { ...t, ...update }
      return t
    })
    writeTabs(next)
  }, [])

  const removeTab = useCallback((id: string) => {
    const prev = readTabs()
    writeTabs(prev.filter(t => t.id !== id))
  }, [])

  const reorderTabs = useCallback((newOrder: Tab[]) => {
    writeTabs(newOrder)
  }, [])

  const clearTabs = useCallback(() => {
    writeTabs([])
  }, [])

  return {
    tabs,
    channelTabs,
    comparisonTabs,
    addTab,
    addComparisonTab,
    updateComparisonTab,
    removeTab,
    reorderTabs,
    clearTabs,
  }
}
