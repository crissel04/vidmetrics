'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, GitCompare, Clock, FileText } from 'lucide-react'
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

const navItems = [
  { title: 'Analysis', icon: BarChart2, href: '/' },
  { title: 'Compare', icon: GitCompare, href: '/compare' },
  { title: 'Recent', icon: Clock, href: '/recent' },
  { title: 'Reports', icon: FileText, href: '/report' },
]

export function AppSidebar() {
  const pathname = usePathname()

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
                    isActive={
                      item.href === '/'
                        ? pathname === '/' || pathname.startsWith('/analysis')
                        : pathname.startsWith(item.href)
                    }
                    render={
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <ThemeToggle />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
