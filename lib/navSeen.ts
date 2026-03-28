const KEYS = {
  watchlist: 'vidmetrics_nav_seen_watchlist_at',
  comparisons: 'vidmetrics_nav_seen_comparisons_at',
  reports: 'vidmetrics_nav_seen_reports_at',
} as const

export type NavSeenSection = keyof typeof KEYS

export function getNavSeenAt(section: NavSeenSection): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(KEYS[section])
  } catch {
    return null
  }
}

export function setNavSeenAt(section: NavSeenSection, at: string = new Date().toISOString()): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEYS[section], at)
    window.dispatchEvent(new Event('vidmetrics_nav_seen'))
  } catch {
    // ignore
  }
}
