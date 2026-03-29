'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, BarChart2, FileText, Bookmark, GitCompare, Settings2 } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { RecentSidebarGroup } from './RecentSidebarGroup'
import { WatchlistSidebarGroup } from './WatchlistSidebarGroup'
import { VidMetricsLogo } from './VidMetricsLogo'
import { SidebarNavBadge } from './SidebarNavBadge'
import { useReportsHistory } from '@/lib/context/ReportsHistoryContext'
import { useWatchlist } from '@/lib/context/WatchlistContext'
import { useSavedComparisons } from '@/lib/context/SavedComparisonsContext'
import { useNavSectionBadges } from '@/hooks/useNavSectionBadges'

const navItems = [
  { title: 'Home', icon: House, href: '/', isActive: (p: string) => p === '/' },
  { title: 'Analytics', icon: BarChart2, href: '/analysis', isActive: (p: string) => p.startsWith('/analysis') },
]

/** Sidebar menu links with count badges: flex row so the label truncates, not the ping. */
const navLinkWithBadgeClass =
  'flex min-w-0 w-full items-center gap-2 [&>svg]:shrink-0'

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'
  const { reports } = useReportsHistory()
  const { watchlist } = useWatchlist()
  const { comparisons } = useSavedComparisons()
  const navBadges = useNavSectionBadges(watchlist, reports, comparisons)

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="box-border flex h-14 min-h-14 shrink-0 flex-col justify-center gap-0 border-b border-[var(--border)] px-2 py-0">
        <div
          className={cn(
            'flex min-h-0 w-full min-w-0 items-center',
            collapsed ? 'justify-start gap-0' : 'justify-between gap-2'
          )}
        >
          <div
            className={cn(
              'min-w-0 shrink overflow-hidden transition-[max-width,opacity] duration-200 ease-linear',
              collapsed ? 'max-w-0 opacity-0' : 'max-w-[min(100%,14rem)] opacity-100'
            )}
          >
            <Link
              href="/"
              className="flex min-w-0 items-center gap-2 cursor-pointer rounded-md outline-none ring-sidebar-ring transition-opacity hover:opacity-90 focus-visible:ring-2"
              aria-label="VidMetrics home"
            >
              <VidMetricsLogo className="block shrink-0" />
              <span className="truncate whitespace-nowrap font-[var(--font-body)] text-base font-medium text-sidebar-foreground">
                VidMetrics
              </span>
            </Link>
          </div>
          <SidebarTrigger
            size={collapsed ? 'icon' : 'icon-sm'}
            className="shrink-0 cursor-pointer [&_svg]:size-4"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={item.isActive(pathname)}
                    render={
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === '/watchlist'}
                  render={
                    <Link href="/watchlist" className={navLinkWithBadgeClass}>
                      <Bookmark size={16} />
                      <span className="min-w-0 flex-1 truncate">Watchlist</span>
                      <SidebarNavBadge count={navBadges.watchlist} />
                    </Link>
                  }
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === '/comparisons'}
                  render={
                    <Link href="/comparisons" className={navLinkWithBadgeClass}>
                      <GitCompare size={16} />
                      <span className="min-w-0 flex-1 truncate">Comparisons</span>
                      <SidebarNavBadge count={navBadges.comparisons} />
                    </Link>
                  }
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname.startsWith('/report')}
                  render={
                    <Link href="/report" className={navLinkWithBadgeClass}>
                      <FileText size={16} />
                      <span className="min-w-0 flex-1 truncate">Reports</span>
                      <SidebarNavBadge count={navBadges.reports} />
                    </Link>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" style={{ background: 'var(--border-subtle)' }} />

        <RecentSidebarGroup />

        {watchlist.length > 0 && (
          <>
            <Separator className="my-2" style={{ background: 'var(--border-subtle)' }} />
            <WatchlistSidebarGroup />
          </>
        )}

        <Separator className="my-2" style={{ background: 'var(--border-subtle)' }} />
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === '/settings'}
              tooltip="Settings"
              render={
                <Link href="/settings">
                  <Settings2 size={16} />
                  <span>Settings</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
