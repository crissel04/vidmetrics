'use client'

import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { useChannelCache } from '@/lib/context/ChannelCacheContext'

export function HeaderBreadcrumb() {
  const pathname = usePathname()
  const cache = useChannelCache()

  let label = 'Home'

  if (pathname === '/report') {
    label = 'Reports'
  } else if (pathname === '/watchlist') {
    label = 'Watchlist'
  } else if (pathname === '/comparisons') {
    label = 'Comparisons'
  } else if (pathname === '/settings') {
    label = 'Settings'
  } else if (pathname === '/analysis/compare') {
    label = 'Compare'
  } else if (pathname.startsWith('/analysis/compare/')) {
    label = 'Compare'
  } else if (pathname.startsWith('/analysis/')) {
    const channelId = pathname.split('/')[2]
    const cached = channelId ? cache.get(channelId) : undefined
    label = cached?.channel.title ?? 'Analysis'
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage>{label}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
