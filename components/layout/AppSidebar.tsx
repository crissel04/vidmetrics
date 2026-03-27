'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, BarChart2, FileText } from 'lucide-react'
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
} from '@/components/ui/sidebar'
import { ThemeToggle } from './ThemeToggle'
import { RecentSidebarGroup } from './RecentSidebarGroup'
import { useReportsHistory } from '@/lib/context/ReportsHistoryContext'

const navItems = [
  { title: 'Home', icon: House, href: '/', isActive: (p: string) => p === '/' },
  { title: 'Analysis', icon: BarChart2, href: '/', isActive: (p: string) => p.startsWith('/analysis') },
  { title: 'Reports', icon: FileText, href: '/report', isActive: (p: string) => p.startsWith('/report') },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { reports } = useReportsHistory()

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          {/* SVG ICON PLACEHOLDER — 28x28px icon goes here */}
          <span className="font-[var(--font-body)] text-base">
            <span className="font-normal">Vid</span>
            <span className="font-medium">Metrics</span>
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={item.isActive(pathname)}
                    render={
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                        {item.title === 'Reports' && reports.length > 0 && (
                          <span
                            className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
                          >
                            {reports.length}
                          </span>
                        )}
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <RecentSidebarGroup />
      </SidebarContent>
      <SidebarFooter className="p-4">
        <ThemeToggle />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
