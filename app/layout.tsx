import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { HeaderBreadcrumb } from "@/components/layout/HeaderBreadcrumb";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ChannelCacheProvider } from "@/lib/context/ChannelCacheContext";
import { RecentChannelsProvider } from "@/lib/context/RecentChannelsContext";
import { ReportsHistoryProvider } from "@/lib/context/ReportsHistoryContext";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "VidMetrics",
  description: "YouTube intelligence for creators and agencies",
  openGraph: {
    title: "VidMetrics — YouTube Competitor Intelligence",
    description: "Paste any YouTube channel URL. Get instant performance metrics, AI insights, and content gap analysis.",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://vidmetrics.vercel.app",
    siteName: "VidMetrics",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VidMetrics — YouTube Competitor Intelligence",
    description: "Paste any YouTube channel URL. Get instant performance metrics, AI insights, and content gap analysis.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get("sidebar:state")?.value !== "false";

  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem>
          <TooltipProvider delay={300}>
            <SidebarProvider defaultOpen={sidebarOpen}>
              <ChannelCacheProvider>
              <RecentChannelsProvider>
              <ReportsHistoryProvider>
              <AppSidebar />
              <SidebarInset>
                <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-card)] px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex-1 min-w-0">
                    <HeaderBreadcrumb />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ThemeToggle />
                  </div>
                </header>
                <main className="flex flex-1 flex-col gap-6 p-6">
                  {children}
                </main>
              </SidebarInset>
              </ReportsHistoryProvider>
              </RecentChannelsProvider>
              </ChannelCacheProvider>
            </SidebarProvider>
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
