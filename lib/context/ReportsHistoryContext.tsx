'use client'

import {
  createContext, useContext, useState, useEffect,
  useCallback, type ReactNode,
} from 'react'

export interface ReportEntry {
  channelId: string
  channelTitle: string
  handle: string
  thumbnailUrl: string
  subscriberCount: number
  sharedAt: string
}

interface ReportsHistoryContextValue {
  reports: ReportEntry[]
  addReport: (entry: ReportEntry) => void
  removeReport: (channelId: string) => void
}

const ReportsHistoryContext = createContext<ReportsHistoryContextValue | null>(null)

const STORAGE_KEY = 'vidmetrics_reports'
const MAX_REPORTS = 10

export function ReportsHistoryProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<ReportEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: ReportEntry[] = JSON.parse(stored)
        setReports(
          parsed.sort((a, b) =>
            new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime()
          )
        )
      }
    } catch {
      setReports([])
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
    } catch {
      // localStorage full or unavailable (private browsing) — degrade gracefully
    }
  }, [reports, loaded])

  const addReport = useCallback((entry: ReportEntry) => {
    setReports(prev => {
      const filtered = prev.filter(r => r.channelId !== entry.channelId)
      return [
        { ...entry, sharedAt: new Date().toISOString() },
        ...filtered,
      ].slice(0, MAX_REPORTS)
    })
  }, [])

  const removeReport = useCallback((channelId: string) => {
    setReports(prev => prev.filter(r => r.channelId !== channelId))
  }, [])

  return (
    <ReportsHistoryContext.Provider value={{ reports, addReport, removeReport }}>
      {children}
    </ReportsHistoryContext.Provider>
  )
}

export function useReportsHistory() {
  const ctx = useContext(ReportsHistoryContext)
  if (!ctx) throw new Error('useReportsHistory must be used inside ReportsHistoryProvider')
  return ctx
}
