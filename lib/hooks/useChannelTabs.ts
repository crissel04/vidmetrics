'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'vidmetrics_tabs'
const MAX_TABS = 5
const SYNC_EVENT = 'vidmetrics_tabs_sync'

export interface ChannelTab {
  channelId: string
  title: string
  handle: string
  thumbnailUrl: string
}

function readTabs(): ChannelTab[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function writeTabs(tabs: ChannelTab[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs))
  // Notify other hook instances in the same tab
  window.dispatchEvent(new Event(SYNC_EVENT))
}

export function useChannelTabs() {
  const [tabs, setTabs] = useState<ChannelTab[]>([])

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

  const addTab = useCallback((tab: ChannelTab) => {
    const prev = readTabs()
    const filtered = prev.filter((t) => t.channelId !== tab.channelId)
    const next = [tab, ...filtered].slice(0, MAX_TABS)
    writeTabs(next)
  }, [])

  const removeTab = useCallback((channelId: string) => {
    const prev = readTabs()
    const next = prev.filter((t) => t.channelId !== channelId)
    writeTabs(next)
  }, [])

  const clearTabs = useCallback(() => {
    writeTabs([])
  }, [])

  return { tabs, addTab, removeTab, clearTabs }
}
