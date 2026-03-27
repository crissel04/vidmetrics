'use client'

import {
  createContext, useContext, useState, useEffect,
  useCallback, type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/context/AuthContext'

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
  loading: boolean
  addReport: (entry: ReportEntry) => Promise<void>
  removeReport: (channelId: string) => Promise<void>
}

const ReportsHistoryContext = createContext<ReportsHistoryContextValue | null>(null)
const LOCAL_KEY = 'vidmetrics_reports'

export function ReportsHistoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [reports, setReports] = useState<ReportEntry[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    setLoading(true)
    if (user) {
      supabase
        .from('reports')
        .select('*')
        .order('shared_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error) {
            setReports((data ?? []).map((row: Record<string, unknown>) => ({
              channelId: row.channel_id as string,
              channelTitle: row.channel_title as string,
              handle: row.handle as string,
              thumbnailUrl: row.thumbnail_url as string,
              subscriberCount: row.subscriber_count as number,
              sharedAt: row.shared_at as string,
            })))
          }
          setLoading(false)
        })
    } else {
      try {
        const stored = localStorage.getItem(LOCAL_KEY)
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
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (!user && !loading) {
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(reports))
      } catch {}
    }
  }, [reports, user, loading])

  const addReport = useCallback(async (entry: ReportEntry) => {
    const now = new Date().toISOString()
    const newEntry = { ...entry, sharedAt: now }

    if (user) {
      const { error } = await supabase.from('reports').upsert({
        user_id: user.id,
        channel_id: entry.channelId,
        channel_title: entry.channelTitle,
        handle: entry.handle,
        thumbnail_url: entry.thumbnailUrl,
        subscriber_count: entry.subscriberCount,
        shared_at: now,
      }, { onConflict: 'user_id,channel_id' })
      if (error) { console.error(error); return }
    }

    setReports(prev => {
      const filtered = prev.filter(r => r.channelId !== entry.channelId)
      return [newEntry, ...filtered]
    })
  }, [user, supabase])

  const removeReport = useCallback(async (channelId: string) => {
    if (user) {
      await supabase.from('reports')
        .delete()
        .eq('user_id', user.id)
        .eq('channel_id', channelId)
    }
    setReports(prev => prev.filter(r => r.channelId !== channelId))
  }, [user, supabase])

  return (
    <ReportsHistoryContext.Provider value={{
      reports, loading, addReport, removeReport,
    }}>
      {children}
    </ReportsHistoryContext.Provider>
  )
}

export function useReportsHistory() {
  const ctx = useContext(ReportsHistoryContext)
  if (!ctx) throw new Error('useReportsHistory must be used inside ReportsHistoryProvider')
  return ctx
}
