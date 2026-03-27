'use client'

import {
  createContext, useContext, useState, useCallback,
  type ReactNode,
} from 'react'
import { useSettings } from '@/lib/context/SettingsContext'

export type TimePeriod = '30d' | '90d' | '6m' | '1y' | 'all'

interface TimePeriodContextValue {
  period: TimePeriod
  setPeriod: (period: TimePeriod) => void
  filterVideos: <T extends { publishedAt: string }>(videos: T[]) => T[]
  periodLabel: string
}

const TimePeriodContext = createContext<TimePeriodContextValue | null>(null)

function getPeriodCutoff(period: TimePeriod): Date | null {
  if (period === 'all') return null
  const now = new Date()
  switch (period) {
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case '6m': {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 6)
      return d
    }
    case '1y': {
      const d = new Date(now)
      d.setFullYear(d.getFullYear() - 1)
      return d
    }
  }
}

const PERIOD_LABELS: Record<TimePeriod, string> = {
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '6m': 'Last 6 months',
  '1y': 'Last year',
  'all': 'All time',
}

export function TimePeriodProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const [period, setPeriod] = useState<TimePeriod>(settings.defaultTimePeriod)

  const filterVideos = useCallback(<T extends { publishedAt: string }>(videos: T[]): T[] => {
    const cutoff = getPeriodCutoff(period)
    if (!cutoff) return videos
    return videos.filter(v => new Date(v.publishedAt) >= cutoff)
  }, [period])

  return (
    <TimePeriodContext.Provider value={{
      period,
      setPeriod,
      filterVideos,
      periodLabel: PERIOD_LABELS[period],
    }}>
      {children}
    </TimePeriodContext.Provider>
  )
}

export function useTimePeriod() {
  const ctx = useContext(TimePeriodContext)
  if (!ctx) throw new Error('useTimePeriod must be used inside TimePeriodProvider')
  return ctx
}
