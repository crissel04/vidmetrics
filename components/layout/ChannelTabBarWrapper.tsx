'use client'

import { usePathname } from 'next/navigation'
import { useChannelTabs } from '@/lib/hooks/useChannelTabs'
import { ChannelTabBar } from './ChannelTabBar'

export function ChannelTabBarWrapper() {
  const pathname = usePathname()
  const { tabs } = useChannelTabs()

  const isAnalysisRoute = pathname.startsWith('/analysis')
  const hasTabs = tabs.length > 0

  // Always show on analysis pages; on other pages only when tabs exist
  if (!isAnalysisRoute && !hasTabs) return null

  return (
    <div
      className="sticky top-14 z-10 flex w-full min-w-0 items-stretch border-b"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <ChannelTabBar />
    </div>
  )
}
