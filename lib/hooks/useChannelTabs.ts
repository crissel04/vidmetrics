'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'vidmetrics_tabs'
const MAX_TABS = 5

export interface ChannelTab {
  channelId: string
  title: string
  handle: string
  thumbnailUrl: string
}

export function useChannelTabs() {
  const [tabs, setTabs] = useState<ChannelTab[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setTabs(JSON.parse(stored))
      } catch {
        setTabs([])
      }
    }
  }, [])

  const persist = useCallback((next: ChannelTab[]) => {
    setTabs(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const addTab = useCallback((tab: ChannelTab) => {
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.channelId !== tab.channelId)
      const next = [tab, ...filtered].slice(0, MAX_TABS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const removeTab = useCallback((channelId: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.channelId !== channelId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clearTabs = useCallback(() => {
    persist([])
  }, [persist])

  return { tabs, addTab, removeTab, clearTabs }
}
