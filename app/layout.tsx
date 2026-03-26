import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
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
          <TooltipProvider>
            <SidebarProvider defaultOpen={sidebarOpen}>
              <AppSidebar />
              <SidebarInset>
                <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-card)] px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="h-4" />
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbPage>VidMetrics</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                  <div className="ml-auto flex items-center gap-2">
                    <ThemeToggle />
                  </div>
                </header>
                <main className="flex flex-1 flex-col gap-6 p-6">
                  {children}
                </main>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
