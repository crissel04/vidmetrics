'use client'

import { useMemo, useState, useLayoutEffect, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getNavSeenAt, setNavSeenAt } from '@/lib/navSeen'
import type { WatchlistEntry } from '@/lib/context/WatchlistContext'
import type { ReportEntry } from '@/lib/context/ReportsHistoryContext'
import type { SavedComparison } from '@/lib/context/SavedComparisonsContext'

type SeenTimes = {
  watchlist: string | null
  comparisons: string | null
  reports: string | null
}

function readSeenFromStorage(): SeenTimes {
  return {
    watchlist: getNavSeenAt('watchlist'),
    comparisons: getNavSeenAt('comparisons'),
    reports: getNavSeenAt('reports'),
  }
}

function unseenWatchlist(watchlist: WatchlistEntry[], seenAt: string | null): number {
  if (watchlist.length === 0) return 0
  if (!seenAt) return watchlist.length
  const t = new Date(seenAt).getTime()
  return watchlist.filter((w) => new Date(w.addedAt).getTime() > t).length
}

function unseenReports(reports: ReportEntry[], seenAt: string | null): number {
  if (reports.length === 0) return 0
  if (!seenAt) return reports.length
  const t = new Date(seenAt).getTime()
  return reports.filter((r) => new Date(r.sharedAt).getTime() > t).length
}

function unseenComparisons(comparisons: SavedComparison[], seenAt: string | null): number {
  if (comparisons.length === 0) return 0
  if (!seenAt) return comparisons.length
  const t = new Date(seenAt).getTime()
  return comparisons.filter((c) => new Date(c.createdAt).getTime() > t).length
}

/**
 * Badge counts for items added after the user last visited each section’s page.
 * Visiting /watchlist, /comparisons, or /report* clears the corresponding badge until new data arrives.
 */
export function useNavSectionBadges(
  watchlist: WatchlistEntry[],
  reports: ReportEntry[],
  comparisons: SavedComparison[]
) {
  const pathname = usePathname()
  const [seen, setSeen] = useState<SeenTimes | null>(null)

  useEffect(() => {
    setSeen(readSeenFromStorage())
  }, [])

  useLayoutEffect(() => {
    if (pathname === '/watchlist') {
      setNavSeenAt('watchlist')
      setSeen(readSeenFromStorage())
    } else if (pathname === '/comparisons') {
      setNavSeenAt('comparisons')
      setSeen(readSeenFromStorage())
    } else if (pathname === '/report' || pathname.startsWith('/report/')) {
      setNavSeenAt('reports')
      setSeen(readSeenFromStorage())
    }
  }, [pathname])

  useEffect(() => {
    const sync = () => setSeen(readSeenFromStorage())
    window.addEventListener('vidmetrics_nav_seen', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('vidmetrics_nav_seen', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return useMemo(() => {
    const s = seen ?? { watchlist: null, comparisons: null, reports: null }
    return {
      watchlist: unseenWatchlist(watchlist, s.watchlist),
      reports: unseenReports(reports, s.reports),
      comparisons: unseenComparisons(comparisons, s.comparisons),
    }
  }, [watchlist, reports, comparisons, seen])
}
