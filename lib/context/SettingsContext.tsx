'use client'

import {
  createContext, useContext, useState, useEffect,
  useCallback, type ReactNode,
} from 'react'
import type { TimePeriod } from '@/lib/context/TimePeriodContext'

export interface AppSettings {
  defaultTimePeriod: TimePeriod
  videosToFetch: 50 | 100 | 200
  theme: 'light' | 'dark' | 'system'
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultTimePeriod: 'all',
  videosToFetch: 200,
  theme: 'system',
}

interface SettingsContextValue {
  settings: AppSettings
  updateSetting: <K extends keyof AppSettings>(
    key: K, value: AppSettings[K]
  ) => void
  resetSettings: () => void
  clearAllData: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)
const STORAGE_KEY = 'vidmetrics_settings'

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) })
      }
    } catch {
      setSettings(DEFAULT_SETTINGS)
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {}
  }, [settings, loaded])

  const updateSetting = useCallback(<K extends keyof AppSettings>(
    key: K, value: AppSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS))
    } catch {}
  }, [])

  const clearAllData = useCallback(() => {
    const keysToRemove = [
      'vidmetrics_tabs',
      'vidmetrics_recent',
      'vidmetrics_watchlist',
      'vidmetrics_reports',
      'vidmetrics_settings',
      'sidebar:state',
    ]
    keysToRemove.forEach(key => {
      try { localStorage.removeItem(key) } catch {}
    })
    window.location.href = '/'
  }, [])

  return (
    <SettingsContext.Provider value={{
      settings, updateSetting, resetSettings, clearAllData,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
