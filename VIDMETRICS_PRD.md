# VidMetrics — Full Project Requirements Document
> Paste this entire file into Claude Code to start the build.

---

## Project Overview

Build **VidMetrics** — a production-ready YouTube competitor analytics SaaS tool. A user pastes a YouTube channel URL and instantly sees deep performance analytics: which videos are winning, why they're winning, how the channel is trending over time, and what opportunities exist to compete against them.

This is a demo-ready MVP that must look and feel like a funded product. It will be presented to a client Monday morning.

---

## Branding

**Product name:** VidMetrics

**Tagline:** *"YouTube intelligence for creators and agencies"*

**Logo:** Text-only wordmark for now — "Vid" in regular weight followed by "Metrics" in medium weight, rendered in the primary text color. A custom SVG icon will be added separately by the developer later. Do not generate or attempt to create an icon — leave a clearly labelled `{/* SVG ICON PLACEHOLDER */}` comment in the Nav component where the icon will slot in to the left of the wordmark. The icon slot should be 28×28px.

**Wordmark implementation in Nav:**
```tsx
<div className="flex items-center gap-2">
  {/* SVG ICON PLACEHOLDER — 28x28px icon goes here */}
  <span className="font-body text-base">
    <span className="font-normal">Vid</span>
    <span className="font-medium">Metrics</span>
  </span>
</div>
```

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts (direct — not the shadcn chart wrapper)
- **Icons**: Lucide React
- **Date handling**: date-fns
- **AI insights**: Anthropic API (`@anthropic-ai/sdk`)
- **Deployment**: Vercel
- **Language**: TypeScript throughout

**Install commands (run in order):**
```bash
npx create-next-app@latest vidmetrics --typescript --tailwind --app --eslint
cd vidmetrics

# Core dependencies
npm install recharts lucide-react date-fns @anthropic-ai/sdk lz-string next-themes
npm install @tanstack/react-table

# Backend dependencies
npm install zod @upstash/redis @upstash/ratelimit

# Initialise shadcn — when prompted: New York style, Zinc base color, CSS variables yes
npx shadcn@latest init

# Add all required shadcn components
npx shadcn@latest add sidebar
npx shadcn@latest add card
npx shadcn@latest add button
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add breadcrumb
npx shadcn@latest add separator
npx shadcn@latest add sheet
npx shadcn@latest add dialog
npx shadcn@latest add drawer
npx shadcn@latest add tooltip
npx shadcn@latest add skeleton
npx shadcn@latest add tabs
npx shadcn@latest add scroll-area
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add table
npx shadcn@latest add dropdown-menu
npx shadcn@latest add popover
npx shadcn@latest add progress
npx shadcn@latest add sonner
npx shadcn@latest add collapsible
npx shadcn@latest add toggle
npx shadcn@latest add toggle-group
npx shadcn@latest add pagination
npx shadcn@latest add chart
```

---

## Environment Variables

Create `.env.local` (never commit) and `.env.example` (commit with placeholder values) both containing:

```env
YOUTUBE_API_KEY=your_youtube_data_api_v3_key
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_APP_URL=https://your-vercel-url.vercel.app
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

Get your keys:
- YouTube API key: console.cloud.google.com → new project → enable YouTube Data API v3 → Credentials → Create API Key
- Anthropic API key: console.anthropic.com
- Upstash: upstash.com → create Redis database → copy REST URL and token (free tier: 10,000 commands/day)

---

## Design System & Visual Direction

### Aesthetic & Style Reference

Clean, modern SaaS dashboard — light theme by default, dark mode as a toggle. The reference aesthetic is enterprise analytics products: white card surfaces on a light gray-purple app background, confident left sidebar, data that has room to breathe. Think Nexus.io, Linear, and similar tools.

**Strict rules — never violate these:**
- No box shadows anywhere. Cards are defined by their border, not elevation. The reference images achieve depth through background color contrast (card white vs app gray), not shadows.
- No gradient backgrounds. No glassmorphism. No animated gradient effects.
- No heavy borders — always `1px`, never `2px` except on the active sidebar item left accent.
- No bold weight changes on interactive hover — use background color change only.
- Every screen must look like it belongs in a real enterprise SaaS product, not a developer prototype.

### Color Palette

Define all of these in `app/globals.css` as CSS custom properties. Tailwind must reference these via `var()` — do not hardcode hex values in component files.

```css
:root {
  /* App surfaces */
  --bg-app:            #f4f4f8;   /* page background */
  --bg-card:           #ffffff;   /* all card surfaces */
  --bg-elevated:       #ffffff;   /* modals, popovers, sheets */
  --bg-sidebar:        #ffffff;   /* sidebar background */

  /* Borders — no shadows, borders define separation */
  --border:            #e4e4ed;   /* default card and component border */
  --border-subtle:     #f0f0f6;   /* inner dividers, subtle separators */
  --border-strong:     #d0d0e0;   /* input focus, emphasis borders */

  /* Text */
  --text-primary:      #0f0f1a;
  --text-secondary:    #6b6b8a;
  --text-muted:        #a0a0b8;

  /* Accent — indigo */
  --accent:            #6366f1;
  --accent-hover:      #4f46e5;
  --accent-subtle:     #eef2ff;
  --accent-text:       #4338ca;

  /* Semantic colors */
  --green:             #22c55e;
  --green-subtle:      #f0fdf4;
  --green-text:        #15803d;
  --red:               #ef4444;
  --red-subtle:        #fef2f2;
  --red-text:          #dc2626;
  --amber:             #f59e0b;
  --amber-subtle:      #fffbeb;
  --amber-text:        #b45309;

  /* Chart series */
  --chart-1:           #6366f1;   /* indigo — primary series */
  --chart-2:           #22c55e;   /* green — positive/secondary */
  --chart-3:           #f59e0b;   /* amber — warning/third */
  --chart-4:           #ec4899;   /* pink — fourth series */

  /* Sidebar */
  --sidebar-width:            240px;
  --sidebar-active-bg:        #eef2ff;
  --sidebar-active-text:      #4338ca;
  --sidebar-active-border:    #6366f1;

  /* Spacing base unit: 4px — all spacing in multiples of 4 */
}

/* Dark mode */
[data-theme="dark"] {
  --bg-app:            #0a0a0f;
  --bg-card:           #16161f;
  --bg-elevated:       #1c1c28;
  --bg-sidebar:        #111118;
  --border:            #2a2a3a;
  --border-subtle:     #1e1e2a;
  --border-strong:     #3a3a4a;
  --text-primary:      #f0f0f8;
  --text-secondary:    #8888aa;
  --text-muted:        #55556a;
  --accent-subtle:     #6366f118;
  --accent-text:       #818cf8;
  --green-subtle:      #22c55e12;
  --green-text:        #4ade80;
  --red-subtle:        #ef444412;
  --red-text:          #f87171;
  --amber-subtle:      #f59e0b12;
  --amber-text:        #fbbf24;
  --sidebar-active-bg: #6366f115;
  --sidebar-active-text: #818cf8;
  --sidebar-active-border: #6366f1;
}
```

### Typography

Import both fonts in `app/layout.tsx` using `next/font/google`:

```tsx
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700']
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600']
})

// Apply both variables to the html element
// <html className={`${jakarta.variable} ${inter.variable}`}>
```

Add to `globals.css`:
```css
:root {
  --font-display: 'Plus Jakarta Sans', sans-serif;
  --font-body:    'Inter', sans-serif;
}

body {
  font-family: var(--font-body);
  background-color: var(--bg-app);
  color: var(--text-primary);
}
```

**Typography rules:**
- Large metric numbers (the big stats): `font-display`, weight 700, `font-variant-numeric: tabular-nums`
- Section headings and card titles: `font-display`, weight 600
- All other UI text, labels, descriptions, table content: `font-body`, weight 400–500
- All numbers in tables and metric cards: `font-variant-numeric: tabular-nums` always
- Never use weight 800 or 900

### Layout & Spacing

- Base unit: 4px. All padding, margin, and gap values must be multiples of 4.
- Sidebar: fixed left, `var(--sidebar-width)` = 240px, full viewport height, `var(--bg-sidebar)` background, `1px solid var(--border)` right border.
- Main content area: `margin-left: 240px`, max-width 1280px within the content area, 32px horizontal padding.
- Card border radius: `border-radius: 12px` (use Tailwind `rounded-xl`).
- Inner component border radius: `border-radius: 8px` (use Tailwind `rounded-lg`).

### Sidebar Implementation

Use the shadcn Sidebar system in full — do not build a custom sidebar. The structure is:

**`app/layout.tsx`** — wrap everything in `SidebarProvider`:
```tsx
<SidebarProvider>
  <AppSidebar />
  <SidebarInset>
    <header className="sticky top-0 flex h-14 items-center gap-2 border-b bg-[var(--bg-card)] px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />
      <Breadcrumb>...</Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <ShareButton />
      </div>
    </header>
    <main className="flex flex-1 flex-col gap-6 p-6">
      {children}
    </main>
  </SidebarInset>
</SidebarProvider>
```

**`components/layout/AppSidebar.tsx`** — the sidebar component:
```tsx
<Sidebar variant="sidebar" collapsible="icon">
  <SidebarHeader>
    {/* Logo / wordmark */}
  </SidebarHeader>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>Analytics</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/analysis/...'}>
              <Link href="..."><BarChart2 /><span>Analysis</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* more items */}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>
  <SidebarFooter>
    {/* Theme toggle */}
  </SidebarFooter>
  <SidebarRail />  {/* enables click-to-collapse on the rail */}
</Sidebar>
```

The sidebar nav items for VidMetrics:
- **Analysis** (BarChart2 icon) → `/analysis` — main dashboard
- **Compare** (GitCompare icon) → `/compare` — channel comparison
- **Recent** (Clock icon) → list of recently analyzed channels
- **Reports** (FileText icon) → `/report` — shareable reports

Sidebar CSS variable overrides in `globals.css` (shadcn sidebar uses these):
```css
:root {
  --sidebar-background: var(--bg-sidebar);
  --sidebar-foreground: var(--text-secondary);
  --sidebar-primary: var(--accent);
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: var(--sidebar-active-bg);
  --sidebar-accent-foreground: var(--sidebar-active-text);
  --sidebar-border: var(--border);
  --sidebar-ring: var(--accent);
}
```

### Card Component Rules

All cards use shadcn's `<Card>` component with these overrides — no shadows:

```css
.card, [data-card] {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: none;   /* explicitly no shadow */
}
```

The visual separation between the app background (`--bg-app` gray-purple) and the card (`--bg-card` white) provides all the depth needed — no shadow required.

### Metric Card Rules

Used for the 4-stat row at the top of the dashboard:

```
┌─────────────────────────────┐
│ Label text          [icon?] │  ← 13px, --text-secondary, font-body
│                             │
│ 245K          ↑ 12%         │  ← number: 28px font-display 700
│                  vs last wk │  ← 12px --text-muted
│ ▁▂▃▄▅▆ (sparkline)         │
└─────────────────────────────┘
```

Trend badge: small pill with colored background — green for positive, red for negative:
```tsx
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
  style={{ background: 'var(--green-subtle)', color: 'var(--green-text)' }}>
  <TrendingUp size={10} /> 12%
</span>
```

### Chart Rules

Use the shadcn chart system (`ChartContainer`, `ChartTooltip`, `ChartTooltipContent`) with Recharts primitives inside. This is the correct modern pattern — shadcn's chart system wraps Recharts without locking you in, handles theming via the `chartConfig` object, and provides consistently styled tooltips.

```tsx
// Every chart follows this pattern:
import { Bar, BarChart, Line, LineChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const chartConfig = {
  views: { label: 'Views', color: 'var(--chart-1)' },
  engagement: { label: 'Engagement', color: 'var(--chart-2)' },
}

<ChartContainer config={chartConfig} className="min-h-[300px] w-full">
  <BarChart data={data}>
    ...
  </BarChart>
</ChartContainer>
```

**Rules for all charts:**
- `ChartContainer` is required for every chart — always set `min-h-[VALUE]` (sparklines: `min-h-[60px]`, main charts: `min-h-[300px]`)
- `ChartTooltip` + `ChartTooltipContent` for all tooltips — no custom tooltip components
- **Bar charts**: `fill="var(--chart-1)"` default; tier-color overrides via `Cell` component
- **Line charts**: `stroke="var(--chart-1)"`, `strokeWidth={2}`, no dots unless on hover
- **Area charts**: `<linearGradient>` fill from series color at 20% opacity to 0% at bottom
- **All charts**: `<CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />` — horizontal grid lines only
- **Axis labels**: 12px, `fill="var(--text-muted)"`, font-body
- Charts must respond to theme changes — always reference colors via `chartConfig` or CSS variables, never hardcoded hex
- All chart wrapper components must be `'use client'`

### shadcn Component Usage — Complete Mapping

Use shadcn components for all interactive UI. Never build a custom version of something shadcn already provides. Below is the authoritative mapping of every UI need in VidMetrics to the correct shadcn component.

**Layout & Navigation**

| UI element | shadcn component | Notes |
|---|---|---|
| App sidebar | `Sidebar`, `SidebarProvider`, `SidebarInset`, `SidebarHeader`, `SidebarFooter`, `SidebarContent`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupContent`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarMenuSkeleton`, `SidebarTrigger`, `SidebarRail` | Use the full shadcn Sidebar system. Wrap `layout.tsx` in `<SidebarProvider>`. `SidebarInset` wraps the main content area. `SidebarRail` enables click-to-collapse. |
| Top breadcrumb | `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator` | Sits in the sticky header inside `SidebarInset`, paired with `SidebarTrigger` and a vertical `Separator` |
| Page sections | `Separator` | Horizontal dividers between dashboard sections |
| Scrollable areas | `ScrollArea` | Wrap the video table and any overflow content |

**Data Display**

| UI element | shadcn component | Notes |
|---|---|---|
| All cards | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | Every metric card, insight card, chart card uses this |
| Video table | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` + `@tanstack/react-table` | Use the shadcn Data Table pattern with TanStack Table for sort, filter, pagination |
| Status labels / tier badges | `Badge` | Hot, Rising, Average, Underperforming tiers; above/below benchmark indicators |
| Channel avatar | `Avatar`, `AvatarImage`, `AvatarFallback` | Channel thumbnail with initials fallback |
| Tab switcher (time filters) | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | "All time / Last 30d / Last 90d" toggle |
| Loading states | `Skeleton` | Every async section — match exact dimensions of loaded content |
| Progress indicators | `Progress` | Performance bars in the VideoDeepDive panel (this video vs channel avg) |
| Pagination | `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationNext`, `PaginationPrevious`, `PaginationEllipsis` | Video table pagination |

**Charts**

| UI element | shadcn component | Notes |
|---|---|---|
| All charts | `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent` | Use shadcn's chart system which wraps Recharts without locking you in. Configure via `chartConfig` object. Use `var(--chart-1)` etc. for colors. |

**Overlays & Panels**

| UI element | shadcn component | Notes |
|---|---|---|
| VideoDeepDive panel (desktop) | `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription` | `side="right"`, full height |
| VideoDeepDive panel (mobile) | `Drawer`, `DrawerContent`, `DrawerHeader`, `DrawerTitle` | Bottom sheet on mobile — detect with `useIsMobile()` from the shadcn sidebar utils |
| Channel comparison modal | `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription` | Full comparison panel |
| Hover tips everywhere | `Tooltip`, `TooltipProvider`, `TooltipTrigger`, `TooltipContent` | Benchmark tooltip ("based on category averages"), truncated title tooltip, copy handle tooltip |
| Thumbnail preview | `Popover`, `PopoverTrigger`, `PopoverContent` | Video thumbnail on title hover in table |
| Row actions menu | `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator` | Per-row "..." menu in video table (open in YouTube, copy link, etc.) |

**Forms & Controls**

| UI element | shadcn component | Notes |
|---|---|---|
| Channel URL input | `Input` | Main search input on home page and sidebar |
| Sort/filter dropdowns | `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` | Sort by, time period filter |
| Dark/light toggle | `Toggle` or shadcn's `Switch` | Theme toggle in sidebar footer or top nav |
| Time period toggle group | `ToggleGroup`, `ToggleGroupItem` | "All / 30d / 90d" — alternative to Tabs if inline with filters |

**Feedback & Notifications**

| UI element | shadcn component | Notes |
|---|---|---|
| Toast notifications | `Sonner` | "Link copied", "Export started", "Analysis failed — retry". Use `toast()` from sonner. Add `<Toaster />` to root layout. |
| Collapsible sections | `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` | "How is this calculated?" expandable in MomentumScore card |

**Critical implementation notes:**

- Wrap the entire app in `<SidebarProvider>` inside `layout.tsx`, not inside individual pages.
- Add `<Toaster />` from sonner once to `layout.tsx` — not per page.
- `useIsMobile()` is exported from `@/components/ui/sidebar` — use it to switch between Sheet (desktop) and Drawer (mobile) for VideoDeepDive.
- All shadcn components must have their default box-shadows removed via CSS override in `globals.css` — the design uses zero shadows.
- Override shadcn's default border colors to use `var(--border)` consistently.
- `ChartContainer` requires `min-h-[VALUE]` class — sparklines: `min-h-[60px]`, main charts: `min-h-[300px]`.
- Always use `ChartTooltip` and `ChartTooltipContent` from `@/components/ui/chart` — never build custom tooltip components.

---

### Micro-interactions & Motion

This is an analytics product — motion must serve the data, not decorate it. Every interaction below has a clear functional purpose. Nothing here is decorative. Do not add any animations beyond what is listed.

**Global animation rules:**
- All transitions: `duration-150` or `duration-200` only. Never exceed 300ms except for the count-up.
- No looping animations anywhere except the skeleton pulse.
- No page transition animations.
- No scroll-triggered animations.
- Respect `prefers-reduced-motion` — wrap all custom animations in a check and disable them if the user has reduced motion enabled:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

**Interaction 1 — Metric card count-up on first load**

When the 4 metric cards first receive their data (skeleton → content), all numeric values animate from `0` to their final value over `600ms` with an `easeOut` curve. This is the most effective "data arrived" signal in any analytics UI — it draws the eye to the numbers.

Implement using a custom `useCountUp` hook:

```typescript
// lib/hooks/useCountUp.ts
export function useCountUp(target: number, duration = 600, enabled = true) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!enabled) { setValue(target); return }
    let start: number
    const step = (timestamp: number) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      // easeOut cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
      else setValue(target)
    }
    requestAnimationFrame(step)
  }, [target, duration, enabled])

  return value
}
```

Apply to: all 4 metric cards, MomentumScore widget, and the upload consistency stdDev display. The `enabled` flag should be `false` during SSR and on re-renders — only run once on initial data load. Format the animated number identically to the final formatted value (e.g. if final is "1.2M", animate the raw number and format each frame).

---

**Interaction 2 — Sidebar collapse state persisted via cookie**

The shadcn `SidebarProvider` accepts a `defaultOpen` prop. Read the sidebar state from a cookie on the server and pass it as `defaultOpen` so the sidebar remembers its collapsed/expanded state across page loads with zero flash.

```tsx
// app/layout.tsx
import { cookies } from 'next/headers'

export default async function Layout({ children }) {
  const cookieStore = await cookies()
  const sidebarOpen = cookieStore.get('sidebar:state')?.value !== 'false'

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      ...
    </SidebarProvider>
  )
}
```

The shadcn sidebar already writes the `sidebar:state` cookie automatically via `SidebarRail` — you only need to read it on the server side for the initial render.

---

**Interaction 3 — Sort column arrow flip**

When the user clicks a table column header to change sort direction, the sort arrow icon rotates 180° with a `150ms ease` CSS transition instead of snapping. Implemented with a single Tailwind class:

```tsx
<ArrowUp
  size={14}
  className={cn(
    "transition-transform duration-150",
    sortDirection === 'desc' && "rotate-180"
  )}
/>
```

No additional logic needed — Tailwind handles the animation when the class is toggled.

---

**Interaction 4 — Skeleton → content fade-in**

When any async section transitions from skeleton to real content, fade the content in over `200ms`. Without this, content pops in abruptly. With it, data feels like it arrives rather than snaps in.

Add a reusable wrapper to `globals.css`:

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.fade-in {
  animation: fadeIn 200ms ease-out forwards;
}
```

Apply `className="fade-in"` to the outermost element of every component that replaces a skeleton on data load: `ChannelHeader`, `MetricCard`, `VideoTable`, `AIInsightsPanel`, `NicheBenchmark`, `ContentGapDetector`, `MomentumScore`.

---

**Interaction 5 — Trend badge single pulse on mount**

When a green `↑` or red `↓` trend badge first appears on a metric card, it plays a single subtle scale pulse (`scale(1) → scale(1.06) → scale(1)`, 300ms, `ease-in-out`, runs once only). This draws attention to the most important signal on the card without being distracting.

```css
@keyframes badgePulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.06); }
  100% { transform: scale(1); }
}

.badge-pulse {
  animation: badgePulse 300ms ease-in-out forwards;
  /* forwards means it stops at scale(1) — never loops */
}
```

Apply `className="badge-pulse"` to trend badge elements only. Never use `infinite` here.

---

**Interaction 6 — Sidebar nav active item transition**

When the user navigates between pages, the active background highlight on the sidebar nav item transitions with `duration-150` rather than jumping. This is handled by adding `transition-colors duration-150` to `SidebarMenuButton` in the shadcn component override:

```css
/* Override in globals.css */
[data-sidebar="menu-button"] {
  transition-property: color, background-color;
  transition-duration: 150ms;
  transition-timing-function: ease;
}
```

The shadcn sidebar already applies `isActive` styling — this just ensures the transition between states is smooth rather than instant.

---

**Interaction 7 — VideoDeepDive and Drawer — use shadcn defaults**

The shadcn `Sheet` slides in from the right by default. The shadcn `Drawer` slides up from the bottom by default. Do not override or disable these default animations — they are already correct for the product. Simply ensure no `duration-0` or `transition-none` overrides are applied to these components.

---

## Backend Architecture

### Decision: Route Handlers over Server Actions

VidMetrics uses **Route Handlers** (`app/api/*/route.ts`) for all backend logic, not Server Actions. The reasoning:

- All backend calls involve external APIs (YouTube, Anthropic) — Route Handlers are the correct tool for external service proxying
- The shareable report link and comparison features are consumed by client components that need standard `fetch()` calls
- Rate limiting and caching middleware is cleanest to implement at the Route Handler level
- Server Actions are ideal for form mutations tied to RSC rendering — not what VidMetrics needs

This is the pattern recommended by Vercel's own 2025 guide for this type of application.

---

### Zod Validation

Every Route Handler that accepts input must validate it with Zod before processing. Never trust query params or request bodies directly.

Create a shared validation utility in `lib/api.ts`:

```typescript
// lib/api.ts
import { z, ZodSchema } from 'zod'
import { NextResponse } from 'next/server'

export function createErrorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export function validateQuery<T extends ZodSchema>(
  params: URLSearchParams,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse } {
  const raw = Object.fromEntries(params.entries())
  const result = schema.safeParse(raw)
  if (!result.success) {
    return {
      success: false,
      response: createErrorResponse(
        result.error.errors.map(e => e.message).join(', '),
        400
      )
    }
  }
  return { success: true, data: result.data }
}

// Standard error handler — wrap all route handlers in this
export async function withErrorHandler(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler()
  } catch (err) {
    console.error('[API Error]', err)
    if (err instanceof Error) {
      return createErrorResponse(err.message, 500)
    }
    return createErrorResponse('An unexpected error occurred', 500)
  }
}
```

**Zod schemas** — define in `lib/schemas.ts`:

```typescript
import { z } from 'zod'

export const channelQuerySchema = z.object({
  url: z.string().url('Must be a valid URL').includes('youtube.com', {
    message: 'Must be a YouTube channel URL'
  })
})

export const insightsBodySchema = z.object({
  channelId: z.string().min(1),          // used as Redis cache key
  channelTitle: z.string().min(1),
  subscriberCount: z.number().min(0),    // needed for prompt — lives on ChannelInfo, not ChannelMetrics
  videos: z.array(z.object({
    id: z.string(),
    title: z.string(),
    viewCount: z.number(),
    engagementRate: z.number(),
    daysLive: z.number(),
    duration: z.string(),
  })).min(1).max(50),
  metrics: z.object({
    avgViews: z.number(),
    avgEngagementRate: z.number(),
    momentumScore: z.number(),
    momentumLabel: z.string(),
    uploadFrequency: z.string(),
  })
})

export const compareBodySchema = z.object({
  channelAUrl: z.string().url(),
  channelBUrl: z.string().url(),
})
```

---

### Caching Strategy

**Layer 1 — Next.js built-in cache** (free, no setup)

Use `next/cache` `unstable_cache` for wrapping YouTube API calls. The channel ID must be included in the cache key array — this is the unique identifier per cached entry. The `tags` array is for targeted revalidation only:

```typescript
// lib/youtube.ts
import { unstable_cache } from 'next/cache'

// IMPORTANT: channelId must be in the key array (second arg), not just in tags.
// The key array is what makes each channel's data a separate cache entry.
export function getCachedChannelData(channelId: string) {
  return unstable_cache(
    async () => {
      // ... YouTube API calls using channelId
      const channel = await fetchChannelInfo(channelId)
      const videos = await fetchChannelVideos(channelId)
      return { channel, videos }
    },
    [`channel-data-${channelId}`],  // unique key per channel
    {
      revalidate: 3600,             // 1 hour TTL
      tags: [`channel-${channelId}`]
    }
  )()
}
```

**Layer 2 — Upstash Redis** (for AI insights caching — expensive calls)

AI insights calls cost time and money. Cache them for 24 hours per channel:

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function getCachedInsights(channelId: string) {
  return redis.get<AIInsights>(`insights:${channelId}`)
}

export async function setCachedInsights(channelId: string, insights: AIInsights) {
  // Cache for 24 hours (86400 seconds)
  return redis.setex(`insights:${channelId}`, 86400, JSON.stringify(insights))
}
```

**What gets cached and for how long:**

| Data | Cache layer | TTL | Rationale |
|------|-------------|-----|-----------|
| Channel info + video list | Next.js `unstable_cache` | 1 hour | YouTube quota protection |
| AI insights | Upstash Redis | 24 hours | Expensive Anthropic call |
| Comparison data | Next.js `unstable_cache` | 1 hour | Two channel fetches |
| Niche benchmarks | Static import | Forever | Hardcoded in `lib/benchmarks.ts` |

---

### Rate Limiting

Protect the YouTube API quota (10,000 units/day) and prevent AI cost abuse. Implement rate limiting in `middleware.ts` at the edge — before requests hit your route handlers.

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Channel analysis: 20 requests per hour per IP
const channelRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  prefix: 'ratelimit:channel',
})

// AI insights: 10 requests per hour per IP (more expensive)
const insightsRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'ratelimit:insights',
})

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const path = request.nextUrl.pathname

  if (path.startsWith('/api/channel')) {
    const { success } = await channelRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before analyzing another channel.' },
        { status: 429 }
      )
    }
  }

  if (path.startsWith('/api/insights')) {
    const { success } = await insightsRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'AI analysis rate limit reached. Try again in an hour.' },
        { status: 429 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/channel/:path*', '/api/insights/:path*', '/api/compare/:path*']
}
```

---

### Route Handler Specifications

**`GET /api/channel?url=<youtube_url>`**

```typescript
// Validation → URL parsing → channel ID resolution → 
// parallel fetch of channel info + video list → 
// compute all metrics server-side → return combined response

// Response shape:
{
  channel: ChannelInfo
  videos: Video[]
  metrics: ChannelMetrics  // includes momentum score, consistency, benchmarks
}

// Error responses:
// 400 — invalid URL format
// 404 — channel not found
// 403 — channel is private
// 429 — rate limit exceeded (from middleware)
// 500 — YouTube API error (with human-readable message)
// 503 — YouTube API quota exceeded
```

**`POST /api/insights`**

```typescript
// Body: { channelTitle, videos, metrics }
// 1. Check Redis cache for channelId — return cached if exists
// 2. Build structured prompt with channel data
// 3. Call Anthropic claude-sonnet-4-20250514
// 4. Parse JSON response → validate shape with Zod
// 5. Store in Redis with 24h TTL
// 6. Return insights

// Response shape:
{
  insights: AIInsights  // whatIsWorking, uploadPattern, titleFormula, 
                        // gapOpportunity, gapOpportunities[]
}

// Error responses:
// 400 — invalid request body
// 429 — rate limit exceeded
// 500 — Anthropic API error
// Returns null insights gracefully — client shows retry button
```

**`POST /api/compare`**

```typescript
// Body: { channelAUrl, channelBUrl }
// Validate both URLs with Zod
// Fetch both channels in parallel with Promise.all()
// Generate AI comparison summary (short — 2-3 sentences only)
// Return combined data

// Response shape:
{
  channelA: { channel: ChannelInfo, videos: Video[], metrics: ChannelMetrics }
  channelB: { channel: ChannelInfo, videos: Video[], metrics: ChannelMetrics }
  aiSummary: string
}
```

---

### Standard Response Format

All route handlers return consistent JSON shapes. Never return bare strings or unstructured errors.

```typescript
// Success
{ data: T }  // or flat object for simple responses like { channel, videos, metrics }

// Error
{ error: string }  // human-readable, safe to show in UI

// HTTP status codes used:
// 200 — success
// 400 — bad request (invalid input)
// 404 — resource not found  
// 429 — rate limited
// 500 — server/API error
// 503 — upstream service unavailable (YouTube quota)
```

---

### Security Checklist

- All API keys in env vars, never in client code or `NEXT_PUBLIC_` prefixed
- YouTube API key: server-side only — accessed exclusively in `/api/` routes
- Anthropic API key: server-side only — same
- Upstash credentials: server-side only
- All inputs validated with Zod before any processing
- Rate limiting at the edge via Upstash before route handlers execute
- `next/headers` `cookies()` used server-side only for sidebar state
- No sensitive data in shareable report URLs (only public YouTube data)

---

### next.config.js — Image Domains (required, not optional)

`next/image` blocks external image sources by default. Without this config, YouTube thumbnails and channel avatars will throw a runtime error and render as broken images. This must be set before any component that uses `next/image` with YouTube URLs.

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',        // video thumbnails (maxresdefault, hqdefault)
      },
      {
        protocol: 'https',
        hostname: 'yt3.googleusercontent.com', // channel avatars
      },
    ],
  },
}

module.exports = nextConfig
```

This belongs in `next.config.js` at the project root. It must be committed as part of Step 1 — if it's missing, every thumbnail and avatar will be broken and no image-related component will work during development or production.

---

### Streaming AI Insights Response

Instead of waiting 2–5 seconds for the full Anthropic response before rendering anything, stream the AI insights as they arrive. The panel fills in section by section, word by word — the same pattern as ChatGPT. In a live demo this is dramatically more impressive than a spinner followed by a sudden reveal.

**How it works:** The `/api/insights` route uses the Anthropic SDK's streaming API and returns a `ReadableStream`. The client reads the stream chunk by chunk and updates the UI progressively.

**`/api/insights/route.ts` — streaming implementation:**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler, createErrorResponse } from '@/lib/api'
import { insightsBodySchema } from '@/lib/schemas'
import { getCachedInsights, setCachedInsights } from '@/lib/cache'

const anthropic = new Anthropic()

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await request.json()
    const parsed = insightsBodySchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(
        parsed.error.errors.map(e => e.message).join(', '),
        400
      )
    }

    const { channelId, channelTitle, subscriberCount, videos, metrics } = parsed.data

    // 1. Check Redis cache first — return immediately if cached
    const cached = await getCachedInsights(channelId)
    if (cached) {
      return NextResponse.json({ insights: cached })
    }

    // 2. Build prompt
    const prompt = buildInsightsPrompt({ channelTitle, subscriberCount, videos, metrics })

    // 3. Stream from Anthropic
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullText = ''

          const response = await anthropic.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
          })

          for await (const chunk of response) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              fullText += chunk.delta.text
              controller.enqueue(encoder.encode(chunk.delta.text))
            }
          }

          // After stream completes, parse and cache the full JSON
          try {
            const insights = JSON.parse(fullText)
            await setCachedInsights(channelId, insights)
          } catch {
            // JSON parse failed — stream ended but wasn't valid JSON
            // Client handles this gracefully with retry
          }

          controller.close()
        } catch (err) {
          controller.error(err)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  })
}
```

**`components/insights/AIInsightsPanel.tsx` — streaming client:**

```typescript
'use client'

// Fetch with streaming — reads chunks as they arrive
async function fetchInsightsStream(
  payload: InsightsPayload,
  onChunk: (text: string) => void,
  onDone: (insights: AIInsights) => void,
  onError: () => void
) {
  try {
    const response = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) { onError(); return }

    // Non-streaming cached response — parse directly
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const data = await response.json()
      onDone(data.insights)
      return
    }

    // Streaming response — read chunks
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let accumulated = ''

    if (!reader) { onError(); return }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      accumulated += chunk
      onChunk(accumulated)
    }

    // Full text received — parse JSON
    try {
      const insights: AIInsights = JSON.parse(accumulated)
      onDone(insights)
    } catch {
      onError()
    }
  } catch {
    onError()
  }
}
```

**UI behaviour during streaming:**

- While streaming: show each insight section as soon as its JSON key appears in the accumulated text. Use a simple check: if `accumulated.includes('"whatIsWorking"')` then start rendering that section. Each section fades in as it becomes available.
- Skeleton placeholders stay visible for sections not yet received.
- The "Powered by Claude" attribution only appears after `onDone` fires.
- If streaming fails mid-way: show what was received plus a "Retry" button for the rest.
- Cached responses (from Redis) return as regular JSON and render instantly — the client handles both paths.

**Streaming section reveal logic (simplified):**

```typescript
// Parse partial JSON to reveal sections as they stream in
function parsePartialInsights(text: string): Partial<AIInsights> {
  const partial: Partial<AIInsights> = {}
  const fields = ['whatIsWorking', 'uploadPattern', 'titleFormula', 'gapOpportunity'] as const
  for (const field of fields) {
    const match = text.match(new RegExp(`"${field}":\\s*"((?:[^"\\\\]|\\\\.)*?)(?:"|$)`))
    if (match?.[1]) partial[field] = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
  }
  return partial
}
```

Call `parsePartialInsights(accumulated)` inside `onChunk` to progressively reveal sections. Each section renders as soon as it has enough text to be meaningful.

---

```
/app
  page.tsx                        → Home / channel input
  layout.tsx                      → Root layout, ThemeProvider, SidebarProvider
  globals.css                     → CSS variables, animations, shadcn overrides
  /analysis/[channelId]/
    page.tsx                      → Main analysis dashboard
  /report/
    page.tsx                      → Shareable read-only report
  /api/
    /channel/
      route.ts                    → GET — YouTube data + metrics (cached)
    /insights/
      route.ts                    → POST — Anthropic AI insights (Redis cached)
    /compare/
      route.ts                    → POST — dual channel comparison

middleware.ts                     → Edge rate limiting via Upstash

/components
  /ui/
    CopyHandleButton.tsx
  /layout/
    AppSidebar.tsx                → shadcn Sidebar implementation
    ThemeToggle.tsx               → next-themes toggle button
  /channel/
    ChannelInput.tsx              → URL input + validation
    ChannelHeader.tsx             → Avatar, name, stats, share + compare buttons
    RecentChannels.tsx            → localStorage recent history
  /videos/
    VideoTable.tsx                → TanStack Table + shadcn Table
    VideoRow.tsx                  → Single row with popover trigger
    VideoFilters.tsx              → Sort, filter, search controls
    ThumbnailPopover.tsx          → shadcn Popover with YouTube thumbnail
    VideoDeepDive.tsx             → shadcn Sheet (desktop) / Drawer (mobile)
  /charts/
    ViewsChart.tsx                → ChartContainer + BarChart
    EngagementChart.tsx           → ChartContainer + LineChart
    HeatmapGrid.tsx               → CSS grid heatmap
    MomentumSparkline.tsx         → ChartContainer + AreaChart (mini)
  /insights/
    AIInsightsPanel.tsx           → 4-section AI output card
    MomentumScore.tsx             → Score widget + consistency dot grid
    TrendingBadge.tsx             → Hot / Rising / Average / Underperforming
    TopTakeaways.tsx              → 3 computed insight bullets
    NicheBenchmark.tsx            → Category benchmark comparison card
    ContentGapDetector.tsx        → 3 AI gap opportunities + copy button
  /compare/
    ComparePanel.tsx              → Head-to-head metrics table
    CompareChart.tsx              → Overlapping bar chart
  /report/
    ShareButton.tsx               → Encode + copy to clipboard

/lib
  youtube.ts                      → YouTube API client + getCachedChannelData
  metrics.ts                      → All calculations + computeUploadConsistency
  benchmarks.ts                   → Static niche benchmark lookup table
  utils.ts                        → formatNumber, formatDate, formatDuration, exportToCSV
  shareLink.ts                    → lz-string encode/decode for report URLs
  types.ts                        → All TypeScript interfaces
  api.ts                          → createErrorResponse, validateQuery, withErrorHandler
  schemas.ts                      → All Zod validation schemas
  cache.ts                        → Upstash Redis helpers
  /hooks/
    useCountUp.ts                 → Animated number count-up
```

---

## Feature Specifications

### FEATURE 1 — Channel URL Input (Home Page)

**Page: `/`**

Design a striking landing page with:
- Large centered headline: "Know what your competitors are doing on YouTube"
- Subheadline: "Paste any channel URL. Get instant performance intelligence."
- A single large input field accepting any YouTube channel URL format
- "Analyze Channel" button with loading state
- Below the input: 3 example use case chips ("Track competitors", "Find content gaps", "Benchmark performance")
- Subtle animated background (CSS only — slow moving gradient or grid pattern)

**URL parsing** — handle all YouTube channel URL formats:
```
https://www.youtube.com/channel/UCxxxxxx
https://www.youtube.com/@handle
https://www.youtube.com/c/channelname
https://www.youtube.com/user/username
```

Extract the channel ID or handle, then resolve to a canonical channel ID via the YouTube API before redirecting to `/analysis/[channelId]`.

**Validation**: Show inline error for invalid URLs. Error messages must be human-readable:
- "That doesn't look like a YouTube channel URL"
- "This channel appears to be private or unavailable"
- "Channel not found — double-check the URL"

---

### FEATURE 2 — YouTube API Integration

**File: `/lib/youtube.ts`**

All API calls are server-side only (API key never exposed client-side). The base URL for all calls is `https://www.googleapis.com/youtube/v3`.

---

**Critical quota facts — read before writing any API call:**

| Method | Cost | Notes |
|---|---|---|
| `channels.list` | 1 unit | Channel info, resolve handles |
| `playlistItems.list` | 1 unit per page | Get video IDs from uploads playlist |
| `videos.list` | 1 unit per request | Up to 50 IDs per request |
| `search.list` | **100 units** | Never use this for VidMetrics — far too expensive |

One full channel analysis costs approximately **3–4 units** total. With the 10,000 unit/day quota, VidMetrics can handle ~2,500 full analyses per day before caching kicks in. With 1-hour caching, this is more than sufficient for a demo.

---

**Step 1 — Resolve URL to channel ID**

Handle all four YouTube URL formats:

```typescript
// URL format → resolution method → quota cost
// /channel/UCxxxxxx  → extract directly, no API call → 0 units
// /@handle           → channels.list?forHandle=handle → 1 unit
// /c/customname      → channels.list?forHandle=customname → 1 unit (try forHandle first)
// /user/username     → channels.list?forUsername=username → 1 unit

export async function resolveChannelId(url: string): Promise<string> {
  const parsed = new URL(url)
  const path = parsed.pathname

  // Direct channel ID — no API call needed
  const channelMatch = path.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/)
  if (channelMatch) return channelMatch[1]

  // Handle (@handle or /c/name or /user/name)
  const handleMatch = path.match(/\/@([^/]+)/)
  const customMatch = path.match(/\/c\/([^/]+)/)
  const userMatch = path.match(/\/user\/([^/]+)/)

  const handle = handleMatch?.[1] ?? customMatch?.[1]
  const username = userMatch?.[1]

  const BASE = 'https://www.googleapis.com/youtube/v3'
  const KEY = process.env.YOUTUBE_API_KEY

  if (handle) {
    // forHandle is the correct modern parameter for @handles and /c/ URLs
    const res = await fetch(
      `${BASE}/channels?part=id&forHandle=${encodeURIComponent(handle)}&key=${KEY}`
    )
    const data = await res.json()
    if (!data.items?.[0]) throw new Error('Channel not found')
    return data.items[0].id
  }

  if (username) {
    const res = await fetch(
      `${BASE}/channels?part=id&forUsername=${encodeURIComponent(username)}&key=${KEY}`
    )
    const data = await res.json()
    if (!data.items?.[0]) throw new Error('Channel not found')
    return data.items[0].id
  }

  throw new Error('Could not parse YouTube channel URL')
}
```

**Important**: Never use `search.list` to resolve channel URLs — it costs 100 units per call. `channels.list` with `forHandle` costs 1 unit.

---

**Step 2 — Fetch channel info**

One API call fetches everything needed: channel metadata, statistics, topic categories, and the uploads playlist ID. All in one request, 1 unit:

```typescript
export async function fetchChannelInfo(channelId: string): Promise<ChannelInfo & { uploadsPlaylistId: string }> {
  const BASE = 'https://www.googleapis.com/youtube/v3'
  const KEY = process.env.YOUTUBE_API_KEY

  const res = await fetch(
    `${BASE}/channels?part=snippet,statistics,contentDetails,topicDetails&id=${channelId}&key=${KEY}`
  )
  const data = await res.json()

  if (!data.items?.[0]) throw new Error('Channel not found')

  const ch = data.items[0]
  const stats = ch.statistics

  // topicCategories are Wikipedia URLs — extract the category name from the URL
  // e.g. "https://en.wikipedia.org/wiki/Technology" → "technology"
  const topicUrls: string[] = ch.topicDetails?.topicCategories ?? []
  const category = extractCategory(topicUrls)

  return {
    id: ch.id,
    title: ch.snippet.title,
    handle: ch.snippet.customUrl ?? '',   // e.g. "@channelname" — may be empty for old channels
    description: ch.snippet.description ?? '',
    thumbnailUrl: ch.snippet.thumbnails?.high?.url ?? ch.snippet.thumbnails?.default?.url ?? '',
    subscriberCount: parseInt(stats.subscriberCount ?? '0', 10),  // API returns strings
    hiddenSubscriberCount: stats.hiddenSubscriberCount ?? false,
    videoCount: parseInt(stats.videoCount ?? '0', 10),
    viewCount: parseInt(stats.viewCount ?? '0', 10),
    publishedAt: ch.snippet.publishedAt,
    country: ch.snippet.country,
    category,
    uploadsPlaylistId: ch.contentDetails.relatedPlaylists.uploads,  // needed for step 3
  }
}

function extractCategory(topicUrls: string[]): string {
  // topicCategories are Wikipedia URLs like:
  // "https://en.wikipedia.org/wiki/Technology"
  // "https://en.wikipedia.org/wiki/Video_game_culture"
  const urlToCategory: Record<string, string> = {
    'Technology': 'tech',
    'Video_game_culture': 'gaming',
    'Music': 'music',
    'Entertainment': 'lifestyle',
    'Sports': 'sports',
    'Film': 'lifestyle',
    'Lifestyle_(sociology)': 'lifestyle',
    'Food': 'food',
    'Travel': 'travel',
    'Health': 'fitness',
    'Finance': 'finance',
    'News': 'news',
    'Education': 'education',
    'Comedy': 'comedy',
    'Beauty': 'beauty',
    'Fashion': 'beauty',
  }
  for (const url of topicUrls) {
    const slug = url.split('/wiki/').pop() ?? ''
    for (const [key, cat] of Object.entries(urlToCategory)) {
      if (slug.includes(key)) return cat
    }
  }
  return 'default'
}
```

**Key facts about statistics fields:**
- All statistics (`viewCount`, `subscriberCount`, `videoCount`) are returned as **strings**, not numbers — always `parseInt(value, 10)`
- `hiddenSubscriberCount: true` means the channel has hidden their subscriber count — handle gracefully in the UI
- `subscriberCount` is rounded to 3 significant figures by YouTube (e.g., 1,230,000 not 1,234,567)
- `customUrl` may be empty for older channels that haven't set a handle — default to empty string

---

**Step 3 — Fetch video IDs from uploads playlist**

**Do not use `search.list`** (100 units). Use the uploads playlist instead.

**Shortcut**: The uploads playlist ID is always the channel ID with `UC` replaced by `UU`. This means you already have it from Step 2 (`ch.contentDetails.relatedPlaylists.uploads`), or you can derive it without an API call:

```typescript
// Derive without API call — always accurate:
const uploadsPlaylistId = channelId.replace(/^UC/, 'UU')

// Or use the value from channels.list contentDetails (same thing, just official)
```

Fetch up to 50 most recent video IDs (1 unit per page of 50):

```typescript
export async function fetchVideoIds(uploadsPlaylistId: string, maxResults = 50): Promise<string[]> {
  const BASE = 'https://www.googleapis.com/youtube/v3'
  const KEY = process.env.YOUTUBE_API_KEY

  // Only fetch snippet part for the minimal data needed (video ID)
  // Use fields param to reduce response size
  const res = await fetch(
    `${BASE}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}` +
    `&maxResults=${Math.min(maxResults, 50)}&fields=items(contentDetails/videoId),nextPageToken&key=${KEY}`
  )
  const data = await res.json()

  return (data.items ?? []).map(
    (item: any) => item.contentDetails.videoId
  )
}
```

---

**Step 4 — Fetch full video details in one batch**

With up to 50 video IDs, one `videos.list` call fetches everything — 1 unit total regardless of how many IDs (up to 50):

```typescript
export async function fetchVideoDetails(videoIds: string[]): Promise<RawVideo[]> {
  if (videoIds.length === 0) return []

  const BASE = 'https://www.googleapis.com/youtube/v3'
  const KEY = process.env.YOUTUBE_API_KEY

  // Batch all IDs — max 50 per request, costs 1 unit regardless of count
  const res = await fetch(
    `${BASE}/videos?part=snippet,statistics,contentDetails` +
    `&id=${videoIds.join(',')}&key=${KEY}`
  )
  const data = await res.json()

  return (data.items ?? []).map((v: any) => ({
    id: v.id,
    title: v.snippet.title,
    thumbnailUrl: v.snippet.thumbnails?.maxres?.url
      ?? v.snippet.thumbnails?.high?.url
      ?? v.snippet.thumbnails?.medium?.url
      ?? '',
    publishedAt: v.snippet.publishedAt,
    duration: v.contentDetails.duration,     // ISO 8601 e.g. "PT4M30S"
    viewCount: parseInt(v.statistics.viewCount ?? '0', 10),
    likeCount: parseInt(v.statistics.likeCount ?? '0', 10),   // may be missing if hidden
    commentCount: parseInt(v.statistics.commentCount ?? '0', 10), // may be missing if disabled
  }))
}
```

**Important**: `likeCount` and `commentCount` can be **absent** from the statistics object (not just zero) if the creator has hidden them. Always use `?? '0'` or `?? 0` as the default.

---

**Combined function — the main entry point used by `/api/channel`:**

```typescript
export async function fetchFullChannelData(channelId: string) {
  // 1. Channel info + uploads playlist ID: 1 unit
  const channelInfo = await fetchChannelInfo(channelId)

  // 2. Video IDs from uploads playlist: 1 unit
  const videoIds = await fetchVideoIds(channelInfo.uploadsPlaylistId, 50)

  // 3. Full video details (all 50 in one call): 1 unit
  const rawVideos = await fetchVideoDetails(videoIds)

  return { channelInfo, rawVideos }
}
// Total quota cost per full analysis: ~3 units
```

---

**API Route: `/api/channel/route.ts`**

See the Backend Architecture section for the full specification of this route, including Zod validation, error handling, and caching. Summary:

```typescript
// GET /api/channel?url=<youtube_url>
// 1. Validate URL with channelQuerySchema (Zod)
// 2. resolveChannelId(url) — 0 or 1 unit
// 3. getCachedChannelData(channelId) — check unstable_cache first
// 4. If not cached: fetchFullChannelData(channelId) — ~2 units
// 5. computeAllMetrics(rawVideos, channelInfo)
// 6. Return: { channel: ChannelInfo, videos: Video[], metrics: ChannelMetrics }
```

**Error mapping from YouTube API errors:**
```typescript
// data.error.code → HTTP status to return
// 404 → channel not found ("We couldn't find this channel")
// 403 with reason "forbidden" → private channel
// 403 with reason "quotaExceeded" → 503 to client ("YouTube API limit reached")
// network error → 500
```
**Types** (`/lib/types.ts`):

```typescript
// Note: YouTube API returns all statistics as strings — always parseInt() them server-side
// before storing. By the time types reach the client, they are already numbers.

interface ChannelInfo {
  id: string
  title: string
  handle: string              // snippet.customUrl — may be empty for old channels
  description: string
  thumbnailUrl: string
  subscriberCount: number     // rounded to 3 significant figures by YouTube
  hiddenSubscriberCount: boolean
  videoCount: number
  viewCount: number
  publishedAt: string
  country?: string
  category: string            // derived from topicCategories Wikipedia URLs
}

// Raw shape direct from YouTube API before metric computation
interface RawVideo {
  id: string
  title: string
  thumbnailUrl: string
  publishedAt: string
  duration: string            // ISO 8601 e.g. "PT4M30S"
  viewCount: number
  likeCount: number           // 0 if creator has hidden likes
  commentCount: number        // 0 if creator has disabled comments
}

// Computed — stored, displayed, and sent to clients
interface Video extends RawVideo {
  engagementRate: number      // (likeCount + commentCount) / viewCount * 100
  performanceTier: 'hot' | 'rising' | 'average' | 'underperforming'
  daysLive: number
  viewsPerDay: number
  durationSeconds: number     // parsed from ISO 8601, used for duration comparisons
}

interface ChannelMetrics {
  avgViews: number
  avgEngagementRate: number
  avgViewsPerDay: number
  medianViews: number
  uploadFrequency: string        // e.g. "3x / week"
  bestDayOfWeek: string
  bestTimeOfDay: string
  momentumScore: number          // 0–100
  momentumLabel: 'Accelerating' | 'Stable' | 'Slowing' | 'Dormant'
  totalViewsLast30d: number
  totalViewsPrev30d: number
  viewsGrowthPct: number
  uploadConsistency: {           // added by computeUploadConsistency()
    score: 'very-consistent' | 'somewhat-consistent' | 'irregular' | 'insufficient-data'
    label: string
    detail: string
    stdDevDays: number
  }
  category: string               // mapped from YouTube topicDetails, used for benchmarks
}
```

**API Route: `/api/channel/route.ts`**

See the Backend Architecture section for the full specification of this route, including Zod validation, error handling, and caching. Summary:

```typescript
// GET /api/channel?url=<youtube_url>
// Validates URL with channelQuerySchema
// Resolves channel ID → fetches info + videos in parallel
// Computes all metrics server-side
// Cached 1 hour via unstable_cache
// Returns: { channel: ChannelInfo, videos: Video[], metrics: ChannelMetrics }
```

---

### FEATURE 3 — Metric Calculations

**File: `/lib/metrics.ts`**

Implement all of these precisely:

**Engagement Rate**
```typescript
engagementRate = ((likeCount + commentCount) / viewCount) * 100
// Round to 2 decimal places
```

**Performance Tier** (relative to channel's own average)
```typescript
// Compare each video's views to channel median:
'hot'             → viewCount > channelMedian * 1.5
'rising'          → publishedAt < 14 days ago AND viewCount > channelMedian * 0.8
'average'         → between 50% and 150% of median
'underperforming' → viewCount < channelMedian * 0.5
```

**Momentum Score** (0–100 integer)
```typescript
// Component 1 (40 pts): Views growth
// Compare total views last 30d vs prior 30d
viewsGrowthComponent = clamp((last30d / prev30d - 1) * 100, -40, 40) + 40
// normalised to 0–40 range

// Component 2 (30 pts): Upload frequency consistency
// Count videos last 30d vs prior 30d
uploadComponent = clamp((last30dCount / max(prev30dCount, 1)) * 15, 0, 30)

// Component 3 (30 pts): Engagement trend
// Compare avg engagement rate last 10 videos vs prior 10
engagementComponent = clamp((recentEngagement / historicEngagement - 1) * 100, -30, 30) + 30
// normalised to 0–30 range

momentumScore = round(viewsGrowthComponent + uploadComponent + engagementComponent)
```

**Momentum Label**
```
80–100: Accelerating
50–79:  Stable
25–49:  Slowing
0–24:   Dormant
```

**Best Posting Day/Time** — from `publishedAt` timestamps of top-performing videos:
```typescript
// Group top 25% videos by day of week → find modal day
// Group by hour of day → find modal hour
// Return e.g. "Tuesdays at 2pm UTC"
```

**Upload Frequency**
```typescript
// Count videos in last 90 days → divide by 13 weeks
// Format: "3x / week", "2x / week", "1x / week", "~2x / month"
```

**Views Per Day** (normalizes for video age)
```typescript
viewsPerDay = viewCount / max(daysLive, 1)
```

---

### FEATURE 4 — Main Analysis Dashboard

**Page: `/analysis/[channelId]/page.tsx`**

This is the core of the product. Layout:

#### 4a. Channel Header
Full-width card at top:
- Channel avatar (large, rounded)
- Channel name + handle
- Subscriber count, total videos, total views (formatted: 1.2M, 45.3K)
- "Analyzed just now" timestamp
- Country flag if available
- Share button (top right) → triggers shareable link generation
- "Compare Channel" button → opens compare panel

#### 4b. Metrics Row
4 metric cards in a row:
1. **Avg Views / Video** — with % change vs prior period (green/red arrow)
2. **Avg Engagement Rate** — with channel benchmark comparison
3. **Upload Frequency** — e.g. "3x / week"
4. **Views Last 30 Days** — with growth % badge

#### 4c. Momentum Score Widget
Prominent card (full width or half width):
- Large number (0–100) with animated count-up on load
- Color coded: green (Accelerating), blue (Stable), amber (Slowing), red (Dormant)
- Label: "Accelerating / Stable / Slowing / Dormant"
- Brief explanation: "Views up 34% vs prior 30 days. Upload pace steady."
- Mini sparkline of the score trend (use last 6 months of data to compute rolling score)

#### 4d. Charts Section (2-column grid)
**Left: Views Over Time**
- Bar chart, last 20 videos chronologically (x-axis = publish date)
- Bar color = performance tier (hot=green, rising=blue, average=gray, underperforming=red)
- Hover tooltip: title, views, publish date, tier badge

**Right: Engagement Rate Trend**
- Line chart, same videos
- Reference line at channel average
- Hover tooltip: title, engagement rate, vs channel avg

#### 4e. Publishing Heatmap
Full-width card:
- 7 rows (Mon–Sun) × 24 columns (hours)
- Each cell colored by average views of videos published at that day/hour
- Color scale: light gray → indigo (more views = more saturated)
- Title: "Best times to post (based on top performing videos)"
- Below: "Best performing slot: Tuesdays at 2pm UTC"

#### 4f. AI Insights Panel
Full-width card with purple/indigo accent border:
- Header: "AI Analysis" with a subtle sparkle icon
- Loading state: skeleton with "Analyzing content patterns..." text
- Once loaded, display 4 structured insight sections:

  **What's working** — 2–3 sentences on their content formula
  
  **Upload pattern** — specific timing and frequency observations
  
  **Title formula** — pattern detected across high-performing titles
  
  **Gap opportunity** — 2–3 specific content angles they haven't covered that their audience likely wants

- Small "Powered by Claude" attribution in bottom right

#### 4g. Video Table
Full-width card:

**Filter/Sort bar:**
- Time filter toggle: "All time" | "Last 30 days" | "Last 90 days"
- Sort dropdown: Views | Engagement Rate | Views/Day | Date Published | Comments
- Sort direction toggle (asc/desc)
- Search input (filter by title keyword)

**Table columns:**
| # | Thumbnail | Title | Published | Views | Likes | Comments | Eng. Rate | Views/Day | Tier |
|---|-----------|-------|-----------|-------|-------|----------|-----------|-----------|------|

- Thumbnail: 80×45px, rounded corners, lazy loaded
- Title: truncated at 60 chars with tooltip on hover showing full title
- All number columns right-aligned, formatted (1.2M, 45.3K)
- Eng. Rate: color coded (>5% green, 2–5% neutral, <2% red)
- Tier: badge component (🔥 Hot, 📈 Rising, — Average, ↓ Underperforming)
- Each row clickable → opens YouTube video in new tab
- Alternating subtle row backgrounds
- Sticky header

**Pagination**: 20 rows per page, with page controls

#### 4h. Export Button
Fixed bottom-right floating button:
- "Export CSV" → downloads all video data as CSV
- CSV columns: title, url, publishedAt, views, likes, comments, engagementRate, viewsPerDay, tier

---

### FEATURE 5 — AI Insights API Route

**File: `/api/insights/route.ts`**

```typescript
// POST /api/insights
// Body: { channelId: string, channelTitle: string, subscriberCount: number, videos: Video[], metrics: ChannelMetrics }
// Returns: { insights: AIInsights }
```

Build the prompt carefully. Send to `claude-sonnet-4-20250514`:

```typescript
const prompt = `You are a YouTube content strategy analyst. Analyze this channel's performance data and provide specific, actionable insights.

Channel: ${channelTitle}
Subscribers: ${formatNum(subscriberCount)}
Upload frequency: ${metrics.uploadFrequency}
Avg views/video: ${formatNum(metrics.avgViews)}
Avg engagement rate: ${metrics.avgEngagementRate.toFixed(2)}%
Momentum score: ${metrics.momentumScore}/100 (${metrics.momentumLabel})

Top 20 videos by views:
${videos.slice(0,20).map(v =>
  `- "${v.title}" | ${formatNum(v.viewCount)} views | ${v.engagementRate.toFixed(2)}% engagement | ${v.daysLive}d ago | ${v.duration}`
).join('\n')}

Respond with ONLY a valid JSON object — no markdown fences, no explanation, no preamble:
{
  "whatIsWorking": "2-3 sentences on what content formula is driving their success. Be specific.",
  "uploadPattern": "Specific observation about when and how often they post, and what timing correlates with performance.",
  "titleFormula": "The specific pattern in their high-performing titles. Quote actual title examples.",
  "gapOpportunity": "2-3 specific content angles their audience likely wants that this channel has not covered. Be specific and actionable.",
  "gapOpportunities": [
    "Specific gap 1 — topic/format with reasoning",
    "Specific gap 2 — topic/format with reasoning",
    "Specific gap 3 — topic/format with reasoning"
  ]
}`
```

Parse the JSON response and return as `AIInsights` type. Handle errors gracefully — if AI call fails, return null and hide the panel with a retry button.

**Type:**
```typescript
interface AIInsights {
  whatIsWorking: string
  uploadPattern: string
  titleFormula: string
  gapOpportunity: string       // single paragraph summary
  gapOpportunities: string[]  // array of 3 specific actionable gaps (for ContentGapDetector)
}
```

---

### FEATURE 6 — Channel Comparison

**Trigger**: "Compare Channel" button in the channel header opens a side panel or modal.

**UI**: Secondary channel input (same URL parsing as main input). While loading, show skeleton. Once loaded, show a split comparison view:

#### Compare Panel Layout
Two columns, one per channel:

**Row 1: Channel overview** — avatar, name, subscribers side by side

**Row 2: Key metrics table**
| Metric | Channel A | Channel B | Winner |
|--------|-----------|-----------|--------|
| Avg Views/Video | 245K | 89K | A ✓ |
| Engagement Rate | 4.2% | 6.8% | B ✓ |
| Upload Frequency | 3x/week | 1x/week | A ✓ |
| Momentum Score | 72 | 88 | B ✓ |
| Subscribers | 1.2M | 340K | A ✓ |

Winner cells highlighted in green.

**Row 3: Overlapping bar chart** — Views comparison for last 10 videos (grouped bars, Channel A vs B by date)

**Row 4: Head-to-head insight** — Single AI-generated paragraph summarizing who is winning and why, what each channel does better.

**API Route: `/api/compare/route.ts`**
```typescript
// POST /api/compare
// Body: { channelAUrl: string, channelBUrl: string }
// Validated with compareBodySchema from lib/schemas.ts
// Returns: { channelA: FullChannelData, channelB: FullChannelData, aiSummary: string }
// where FullChannelData = { channel: ChannelInfo, videos: Video[], metrics: ChannelMetrics }
```

---

### FEATURE 7 — Shareable Report Link

**File: `/lib/shareLink.ts`**

When the user clicks "Share Report":
1. Serialize the current report data (channel info + metrics + videos + insights) to JSON
2. Compress with `LZString` from the `lz-string` package (already installed)
3. Base64 encode
4. Append as `?data=<encoded>` query param to `/report`
5. Copy the full URL to clipboard
6. Show a toast: "Report link copied to clipboard"

**Report Page: `/report/page.tsx`**
- Reads `?data=` param, decodes, renders a clean read-only version of the dashboard
- No input fields, no compare button, no edit controls
- Header: "VidMetrics Report" + channel name + "Generated [date]"
- Footer: "Powered by VidMetrics — vidmetrics.vercel.app"
- If data param is missing or invalid: show a friendly error page
- All charts and insights render identically to the main dashboard

---

### FEATURE 8 — Publishing Heatmap

**Component: `/components/charts/HeatmapGrid.tsx`**

Pure CSS + data-driven, no extra library needed.

```tsx
// Props: videos: Video[]
// Compute: for each (dayOfWeek, hourOfDay) bucket, 
//          find average views of videos published in that slot

// Render: 7 rows × 24 cols CSS grid
// Cell size: ~22px × 22px
// Color: interpolate between --bg-elevated (0 views) and --accent (max views)
// Hover: tooltip showing "Avg 245K views | 3 videos published here"
// Row labels: Mon Tue Wed Thu Fri Sat Sun
// Col labels: 12am 3am 6am 9am 12pm 3pm 6pm 9pm
```

---

### FEATURE 9 — Trending Badges

**Component: `/components/insights/TrendingBadge.tsx`**

```tsx
type TrendingBadge = {
  tier: 'hot' | 'rising' | 'average' | 'underperforming'
}

// hot:             red/orange pill, "Hot"
// rising:          blue pill, "Rising"  
// average:         gray, no badge (just dash)
// underperforming: subtle red, "Low"
```

---

### FEATURE 10 — Dark/Light Mode Toggle

Use `next-themes` (already installed).

Configure `ThemeProvider` in `app/layout.tsx` with `attribute="data-theme"` so it matches the CSS variable selectors:

```tsx
// app/layout.tsx
import { ThemeProvider } from 'next-themes'

export default async function Layout({ children }) {
  const cookieStore = await cookies()
  const sidebarOpen = cookieStore.get('sidebar:state')?.value !== 'false'

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem>
          <SidebarProvider defaultOpen={sidebarOpen}>
            {children}
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

The `attribute="data-theme"` is critical — it makes next-themes write `data-theme="dark"` to the `<html>` element, which matches the `[data-theme="dark"]` CSS selector in `globals.css`. Without this, the dark mode CSS variables will never activate.

- Toggle button in sidebar footer (moon/sun Lucide icon, use `useTheme()` from next-themes)
- System preference respected on first load via `enableSystem`
- Persisted in localStorage automatically by next-themes
- `suppressHydrationWarning` on `<html>` is required — next-themes sets the attribute client-side after hydration

---

### FEATURE 11 — Recently Analyzed Channels (localStorage)

**Component: `/components/channel/RecentChannels.tsx`**

Every time a channel analysis completes successfully, save a record to `localStorage` under the key `vidmetrics_recent`:

```typescript
interface RecentChannel {
  channelId: string
  title: string
  handle: string
  thumbnailUrl: string
  subscriberCount: number
  analyzedAt: string   // ISO timestamp
}
// Store max 5 most recent. New entries prepend; trim to 5.
```

**Home page** — below the input field, if `localStorage` has any recent entries, render a "Recent" row:
- Section label: "Recent analyses"
- Each entry: channel avatar (24px) + channel name + handle + "→" link to `/analysis/[channelId]`
- Clicking re-runs the full analysis (navigates to the URL, data re-fetches)
- Small "×" button on each entry to remove it from history
- Entire section hidden if localStorage is empty
- Fade-in animation on mount (avoid hydration flash with `useEffect` + mounted state)

**Implementation note**: All localStorage access must be wrapped in `useEffect` — never read localStorage during SSR or you'll get a hydration mismatch.

---

### FEATURE 12 — Video Thumbnail Preview on Hover

**Component: `/components/videos/ThumbnailPopover.tsx`**

In the `VideoRow` component, wrap the video title text with a shadcn `Popover` trigger. Use `Popover`, `PopoverTrigger`, and `PopoverContent` from `@/components/ui/popover` — do not build custom CSS positioning.

On hover (desktop) or tap (mobile):
- Show the video's `maxresdefault` thumbnail in the popover content
  - URL pattern: `https://i.ytimg.com/vi/{videoId}/maxresdefault.jpg`
  - Use `next/image` with `onError` fallback to `hqdefault.jpg`
- Popover dimensions: 320×180px (16:9), `rounded-lg`
- No shadow (consistent with design rules — `box-shadow: none` override on `PopoverContent`)
- Show video duration badge overlaid bottom-right of the thumbnail (same style as YouTube)
- `PopoverContent` handles viewport overflow automatically — no custom clamping needed

```tsx
// In VideoRow, the title cell becomes:
<Popover>
  <PopoverTrigger asChild>
    <span className="truncate hover:text-accent transition-colors cursor-pointer">
      {video.title}
    </span>
  </PopoverTrigger>
  <PopoverContent side="right" className="w-[320px] p-0 shadow-none border border-[var(--border)]">
    <div className="relative aspect-video">
      <Image
        src={`https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`}
        alt={video.title}
        fill
        className="object-cover rounded-lg"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 
            `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`
        }}
      />
      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
        {video.duration}
      </span>
    </div>
  </PopoverContent>
</Popover>
```

---

### FEATURE 13 — Top 3 Takeaways Card

**Component: `/components/insights/TopTakeaways.tsx`**

A card that renders immediately with channel data (no AI call, no loading state). Place it directly above the AI Insights Panel.

Compute and display exactly 3 takeaways from the video data. Use this logic:

```typescript
// Takeaway 1: Top video outperformance ratio
const topVideo = videos[0] // sorted by views
const ratio = topVideo.viewCount / metrics.avgViews
// → "Their top video outperformed their channel average by {ratio}×"

// Takeaway 2: Duration vs performance correlation
// Group videos into <8min and ≥8min, compare avg views
const short = videos.filter(v => parseDurationSeconds(v.duration) < 480)
const long  = videos.filter(v => parseDurationSeconds(v.duration) >= 480)
const shortAvg = avg(short.map(v => v.viewCount))
const longAvg  = avg(long.map(v => v.viewCount))
const winner = shortAvg > longAvg ? 'Short' : 'Long'
const multiplier = (Math.max(shortAvg, longAvg) / Math.min(shortAvg, longAvg)).toFixed(1)
// → "Short videos (<8 min) average {multiplier}× more views on this channel"
// OR "Long videos (8+ min) average {multiplier}× more views on this channel"
// If fewer than 3 videos in either bucket, skip this takeaway and use fallback below

// Takeaway 3: Upload pace change
const last30Count = videos.filter(v => daysAgo(v.publishedAt) <= 30).length
const prev30Count = videos.filter(v => daysAgo(v.publishedAt) > 30 && daysAgo(v.publishedAt) <= 60).length
const pctChange = ((last30Count - prev30Count) / Math.max(prev30Count, 1)) * 100
const direction = pctChange >= 0 ? 'more' : 'fewer'
// → "Posted {Math.abs(pctChange).toFixed(0)}% {direction} videos in the last 30 days vs prior period"

// Fallback takeaway (if duration split isn't viable):
// Best engagement rate video
const bestEngagement = [...videos].sort((a,b) => b.engagementRate - a.engagementRate)[0]
// → ""{truncate(bestEngagement.title, 40)}" has the highest engagement at {bestEngagement.engagementRate}%"
```

**UI design:**
- Card title: "Key Takeaways" with a small lightning bolt icon
- 3 rows, each with: a subtle numbered badge (1, 2, 3) in accent color + the takeaway sentence
- No loading state — renders synchronously from already-loaded video data
- Clean, compact — this card should be fast to scan in a demo

---

### FEATURE 14 — Duration vs Performance Insight Line

**Location**: Below the two charts (ViewsChart + EngagementChart), as a single full-width insight banner — not a card, just a slim highlighted row.

```typescript
// Same computation as Takeaway 2 above
// Render as a single sentence with an icon:
```

```tsx
<div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--accent-subtle)] border border-[var(--border)]">
  <BarChart2 size={16} className="text-accent shrink-0" />
  <p className="text-sm text-secondary">
    <span className="text-primary font-medium">Duration insight: </span>
    Short videos (&lt;8 min) average <span className="text-accent font-medium">2.3×</span> more views on this channel.
    Consider this when planning content to compete.
  </p>
</div>
```

- Only render if there are ≥3 videos in each duration bucket (short and long)
- If not enough data: render nothing (don't show "insufficient data" — just hide)
- The multiplier and direction are computed live from the video data
- Recomputes automatically when the time filter changes (last 30d / 90d / all time)

---

### FEATURE 15 — Copy Channel Handle Button

**Location**: In `ChannelHeader.tsx`, immediately after the channel handle text (`@channelname`).

```tsx
<div className="flex items-center gap-1.5">
  <span className="text-secondary text-sm">@{channel.handle}</span>
  <CopyHandleButton handle={channel.handle} />
</div>
```

**Component: `/components/ui/CopyHandleButton.tsx`**

```tsx
'use client'
// On click:
// 1. Copy "@{handle}" to clipboard via navigator.clipboard.writeText()
// 2. Icon switches from Copy to Check for 2000ms, then reverts
// 3. No toast needed — the icon change is sufficient feedback

// Implementation:
const [copied, setCopied] = useState(false)
const handleCopy = async () => {
  await navigator.clipboard.writeText(`@${handle}`)
  setCopied(true)
  setTimeout(() => setCopied(false), 2000)
}

// Render: small icon button, no label
// Icon: <Copy size={14} /> or <Check size={14} className="text-green" />
// Style: text-muted hover:text-primary transition-colors, no border, no background
// Tooltip on hover: "Copy handle"
```

---

### FEATURE 16 — Video Deep Dive Panel

**Trigger**: Clicking any row in the video table opens a slide-in side panel (not a new page). The table stays visible behind it.

**Component: `/components/videos/VideoDeepDive.tsx`**

This panel answers "why did this video work?" — the question every analyst asks immediately after seeing which videos performed well.

**Panel layout (full height, ~480px wide, slides in from right):**

```
[Thumbnail — full width 16:9]
[Title — full, not truncated]
[Published date · Duration · Views/day since publish]
```

**Section 1 — Performance vs channel average**
A mini horizontal bar comparison:
```
This video:    ████████████████  245K views
Channel avg:   ████████          98K views
               → 2.5× above average
```
Also show: engagement rate vs channel avg, comments vs channel avg. Each with a green/red indicator.

**Section 2 — Views/day curve**
A small Recharts AreaChart showing estimated views accumulation over time. Since YouTube API only returns total views (not a time series), model this as:
- Day 1–3: viral window — assume 60% of views come in first 72 hours for Hot tier videos, 30% for Average tier
- Day 4–30: decay curve — exponential decay from peak
- Day 30+: long tail — flat low baseline

Label the chart: "Estimated view velocity (modelled)" so it's honest about being a model, not real data. Analysts understand this. It's still more useful than nothing.

**Section 3 — Content signals**
Computed from the video's own data — no extra API call:
```
Title length:     52 characters  (channel avg: 61)
Has number:       Yes — "10 Ways to..."
Has question:     No
Duration bucket:  Short-form (<8 min)
Upload day:       Tuesday  (their best performing day)
Upload hour:      2pm UTC  (within their peak window)
```
These signals are what a content strategist copies into their brief. Surface them explicitly.

**Section 4 — Performance one-liner** (computed client-side — no AI call, no waiting)

Generate a single sentence from the video's own data and the `contentSignals` object already computed in Section 3. No API call, no latency, works even if AI insights haven't loaded yet.

```typescript
function buildPerformanceSentence(video: Video, signals: ContentSignals, metrics: ChannelMetrics): string {
  const parts: string[] = []

  // Outperformance ratio
  const ratio = (video.viewCount / Math.max(metrics.avgViews, 1)).toFixed(1)
  if (parseFloat(ratio) > 1.2) {
    parts.push(`Outperformed the channel average by ${ratio}×`)
  } else if (parseFloat(ratio) < 0.8) {
    parts.push(`Underperformed the channel average by ${ratio}×`)
  }

  // What made it distinctive
  const strengths: string[] = []
  if (signals.hasNumber) strengths.push('numbered title')
  if (signals.hasQuestion) strengths.push('question-format title')
  if (signals.durationBucket === 'short') strengths.push('short-form format')
  if (signals.durationBucket === 'long') strengths.push('long-form format')
  if (signals.isOptimalDay) strengths.push(`posted on their strongest day (${signals.uploadDayName})`)

  if (strengths.length > 0) {
    parts.push(`driven by ${strengths.slice(0, 2).join(' and ')}`)
  }

  return parts.join(' — ') + '.'
}

// Example output:
// "Outperformed the channel average by 2.4× — numbered title and posted on their strongest day (Tuesday)."
// "Underperformed the channel average by 0.6× — long-form format."
```

This is more reliable than an AI call: always available, always consistent, renders instantly.


**Close button**: X in top right. Pressing Escape also closes. Clicking outside the panel closes it.

**TypeScript addition to `Video` interface:**
```typescript
interface VideoDeepDive extends Video {
  estimatedVelocityCurve: { day: number; views: number }[]
  contentSignals: {
    titleLength: number
    hasNumber: boolean
    hasQuestion: boolean
    durationBucket: 'short' | 'long'
    uploadDayName: string
    uploadHour: number
    isOptimalDay: boolean
    isOptimalHour: boolean
  }
}
```

Compute `contentSignals` client-side from existing video data — no extra API call needed. Compute `estimatedVelocityCurve` client-side using the modelling logic above.

---

### FEATURE 17 — Niche Benchmark Comparison

**Component: `/components/insights/NicheBenchmark.tsx`**

**Location**: Inline within the 4-metric cards row — add a 5th card, or replace the upload frequency card's subtitle with a benchmark indicator. Alternatively render as a slim full-width banner directly below the 4 metric cards.

**How it works**: The YouTube API returns `topicDetails.topicCategories` and `snippet.defaultLanguage` for channels. Use the category to look up a static benchmark table. No extra API call needed.

**Static benchmark table** (hardcode in `lib/benchmarks.ts`):

```typescript
export const NICHE_BENCHMARKS: Record<string, {
  label: string
  avgEngagementRate: number
  avgViewsPerVideo: number
  avgUploadFrequency: string
}> = {
  'gaming':      { label: 'Gaming',      avgEngagementRate: 4.2, avgViewsPerVideo: 180000, avgUploadFrequency: '4x/week' },
  'music':       { label: 'Music',       avgEngagementRate: 3.1, avgViewsPerVideo: 320000, avgUploadFrequency: '2x/week' },
  'news':        { label: 'News',        avgEngagementRate: 1.8, avgViewsPerVideo: 95000,  avgUploadFrequency: '7x/week' },
  'education':   { label: 'Education',   avgEngagementRate: 5.1, avgViewsPerVideo: 120000, avgUploadFrequency: '2x/week' },
  'tech':        { label: 'Tech',        avgEngagementRate: 3.4, avgViewsPerVideo: 210000, avgUploadFrequency: '3x/week' },
  'finance':     { label: 'Finance',     avgEngagementRate: 2.1, avgViewsPerVideo: 85000,  avgUploadFrequency: '3x/week' },
  'lifestyle':   { label: 'Lifestyle',   avgEngagementRate: 3.8, avgViewsPerVideo: 150000, avgUploadFrequency: '3x/week' },
  'fitness':     { label: 'Fitness',     avgEngagementRate: 4.5, avgViewsPerVideo: 95000,  avgUploadFrequency: '4x/week' },
  'food':        { label: 'Food',        avgEngagementRate: 4.0, avgViewsPerVideo: 130000, avgUploadFrequency: '2x/week' },
  'travel':      { label: 'Travel',      avgEngagementRate: 3.6, avgViewsPerVideo: 175000, avgUploadFrequency: '2x/week' },
  'comedy':      { label: 'Comedy',      avgEngagementRate: 4.8, avgViewsPerVideo: 290000, avgUploadFrequency: '2x/week' },
  'beauty':      { label: 'Beauty',      avgEngagementRate: 3.9, avgViewsPerVideo: 110000, avgUploadFrequency: '3x/week' },
  'sports':      { label: 'Sports',      avgEngagementRate: 2.9, avgViewsPerVideo: 220000, avgUploadFrequency: '5x/week' },
  'default':     { label: 'YouTube avg', avgEngagementRate: 3.2, avgViewsPerVideo: 140000, avgUploadFrequency: '2x/week' },
}
```

**UI — the benchmark card/banner shows:**

```
Niche: Tech Reviews
─────────────────────────────────────────────
                  This channel    Tech avg
Engagement rate:  4.8%  ↑         3.4%
Views/video:      245K  ↑         210K
Upload frequency: 3x/wk  =        3x/wk
─────────────────────────────────────────────
Outperforming their niche on 2 of 3 key metrics
```

- Green arrow (↑) = above niche average, red arrow (↓) = below, dash (=) = within 10%
- Bottom summary sentence is computed from how many metrics they beat
- If category can't be determined from the API, fall back to 'default' YouTube averages
- Add a tooltip: "Benchmarks based on category averages across YouTube. Used for directional comparison only."

**Add to `ChannelInfo` type:**
```typescript
category: string    // mapped from YouTube topicDetails
```

---

### FEATURE 18 — Content Gap Detector

**Component: `/components/insights/ContentGapDetector.tsx`**

**Location**: A dedicated card on the dashboard, placed between the AI Insights panel and the video table. Give it a teal/green accent border to visually separate it from the AI insights card above.

**What it does**: Identifies specific content angles the competitor hasn't covered that their audience clearly wants. This is the feature a content team takes directly into their editorial planning meeting.

**How it works** — two-step process using existing data:

Step 1: Extract topics from the top 20 video titles using a pattern-matching approach (no extra API call):
```typescript
// Simple NLP: split titles into noun phrases, remove common words
// Group by semantic similarity (just keyword overlap at MVP level)
// Find the top 5 recurring topic clusters
// e.g. "how to", "best X for", "X vs Y", "review", "tutorial"
```

Step 2: Feed title topics + channel description + category into the existing AI insights call. Add a `gapOpportunities` field to the prompt:

```typescript
// Add to the existing /api/insights prompt:
`Also identify 3 specific content gaps — topics or formats 
this channel's audience likely wants based on their viewing patterns, 
but that the channel has NOT covered in their last 50 videos.
Be specific: not "tutorials" but "beginner Python tutorials under 10 minutes".
Return as gapOpportunities: string[] in the JSON.`
```

**UI display:**

```
Content gaps  [teal accent border]
─────────────────────────────────────────────
Opportunities your competitor hasn't covered:

① "Step-by-step setup guides" — their audience 
  asks "how do I set this up?" in comments repeatedly, 
  but they only cover reviews, not tutorials.

② "Budget alternatives" — high engagement on 
  comparison videos but no content targeting 
  the sub-$100 segment their viewers ask about.

③ "Common mistakes" format — performs 3× above 
  average in their category but absent from 
  this channel's library.

  → Use these as content briefs
```

- "Use these as content briefs" is a button that copies all 3 gaps to clipboard as formatted text
- Each gap has a subtle numbered badge
- Loading state: skeleton while AI insights load (shares the same loading state as AIInsightsPanel)
- If AI call fails: hide the card entirely, don't show an error

**TypeScript addition to `AIInsights` interface:**
```typescript
interface AIInsights {
  whatIsWorking: string
  uploadPattern: string
  titleFormula: string
  gapOpportunity: string
  gapOpportunities: string[]   // NEW — array of 3 specific gaps
}
```

---

### FEATURE 19 — Upload Consistency Score

**Component**: Add to the existing `MomentumScore.tsx` card as a secondary metric below the main score, OR render as a standalone small card next to the momentum score card.

**Calculation** (implement in `lib/metrics.ts`):

```typescript
function computeUploadConsistency(videos: Video[]): {
  score: 'very-consistent' | 'somewhat-consistent' | 'irregular' | 'insufficient-data'
  label: string
  detail: string
  stdDevDays: number
} {
  // Sort videos by publishedAt ascending
  const sorted = [...videos].sort((a, b) => 
    new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  )
  
  // Need at least 6 videos to compute meaningful consistency
  if (sorted.length < 6) return { 
    score: 'insufficient-data', 
    label: 'Not enough data',
    detail: 'Need at least 6 videos',
    stdDevDays: 0
  }
  
  // Compute gaps between consecutive uploads in days
  const gaps: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i].publishedAt).getTime() - 
                  new Date(sorted[i-1].publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    gaps.push(diff)
  }
  
  // Standard deviation of gaps
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length
  const variance = gaps.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / gaps.length
  const stdDev = Math.sqrt(variance)
  
  // Classify
  if (stdDev <= 1.5) return {
    score: 'very-consistent',
    label: 'Very consistent',
    detail: `Posts within ${stdDev.toFixed(1)} days of their usual schedule`,
    stdDevDays: stdDev
  }
  if (stdDev <= 4) return {
    score: 'somewhat-consistent', 
    label: 'Somewhat consistent',
    detail: `Schedule varies by ±${stdDev.toFixed(0)} days`,
    stdDevDays: stdDev
  }
  return {
    score: 'irregular',
    label: 'Irregular',
    detail: 'No predictable posting pattern detected',
    stdDevDays: stdDev
  }
}
```

**Add to `ChannelMetrics` interface:**
```typescript
uploadConsistency: {
  score: 'very-consistent' | 'somewhat-consistent' | 'irregular' | 'insufficient-data'
  label: string
  detail: string
  stdDevDays: number
}
```

**UI display** (compact, inside or beside MomentumScore card):

```
Upload consistency
──────────────────
  Very consistent
  Posts within 1.2 days of usual schedule

  [green dot] Mon  [green dot] Thu
  [faint dots for other days — showing their typical pattern]
```

- "Very consistent" → green label
- "Somewhat consistent" → amber label
- "Irregular" → red label
- "Insufficient data" → gray label, hidden detail
- Below the label: a small 7-day dot grid (Mon–Sun) where dots are filled-in green on their most common upload days (computed from publishedAt timestamps), faint on days they rarely post
- This dot grid is pure CSS, no chart library needed

**Why this matters**: Consistency is a key factor in YouTube algorithm favour and subscriber retention. A competitor with irregular uploads is more vulnerable to being overtaken. This tells a media company exactly that.

---

## Page-Level Specifications

### Home Page (`/`)
- Full viewport height
- Centered content: headline → subheadline → input → CTA chips
- Subtle animated background (slow CSS grid or gradient animation, no JS)
- Recent analyses section (if localStorage has history): "Recent: [channel name] — View Report →"
- Nav: "VidMetrics" wordmark top left, GitHub icon top right

### Analysis Dashboard (`/analysis/[channelId]`)
- Fixed top nav: logo + channel name (once loaded) + theme toggle + Share button
- Main content: scrollable single column, max-width 1280px, centered
- All sections load progressively — channel header first, then metrics, then charts, then AI insights last
- Sticky "Back to search" breadcrumb

### Report Page (`/report`)
- Minimal nav: logo + "Generated [date]"
- Same layout as dashboard but read-only
- Print-friendly (add `@media print` styles)
- Open Graph meta tags so it looks good when shared on Slack/email

---

## Loading & Error States

Every async section must have:

**Loading**: Skeleton cards that match the exact dimensions of the loaded content. Use `animate-pulse` (Tailwind).

**Error states** (per section):
- Channel not found: "We couldn't find this channel. Check the URL and try again."
- Private channel: "This channel appears to be private."  
- API quota exceeded: "YouTube API limit reached. Try again in a few minutes."
- AI insights failure: Show panel with "Analysis unavailable" + retry button (re-fetches just the insights)
- Network error: Generic retry button

**Empty states**:
- No videos in selected time range: Illustration + "No videos published in this period"
- No heatmap data: "Not enough data to show posting patterns"

---

## CSV Export

**File: `/lib/utils.ts` — `exportToCSV(videos: Video[], channelTitle: string)`**

Client-side only, no library needed:

```typescript
const headers = ['Title', 'URL', 'Published Date', 'Views', 'Likes', 'Comments', 
                 'Engagement Rate (%)', 'Views Per Day', 'Duration', 'Performance Tier']

const rows = videos.map(v => [
  v.title,
  `https://youtube.com/watch?v=${v.id}`,
  format(new Date(v.publishedAt), 'yyyy-MM-dd'),
  v.viewCount,
  v.likeCount,
  v.commentCount,
  v.engagementRate.toFixed(2),
  v.viewsPerDay.toFixed(0),
  v.duration,
  v.performanceTier
])

// Create Blob, trigger download with filename: `{channelTitle}-vidmetrics-{date}.csv`
```

---

## Number Formatting

All numbers displayed in the UI must use this formatting (implement in `/lib/utils.ts`):

```typescript
formatNumber(n: number): string
// 1234        → "1,234"
// 12345       → "12.3K"
// 1234567     → "1.2M"
// 12345678    → "12.3M"
// 1234567890  → "1.2B"

formatDuration(iso: string): string
// "PT4M30S" → "4:30"
// "PT1H2M3S" → "1:02:03"

formatDate(date: string): string
// Recent: "2 days ago", "3 weeks ago"
// Older: "Mar 15, 2024"
```

---

## Performance Requirements

- Initial page load: < 3s on fast connection
- Channel analysis: < 5s total (stream sections progressively)
- No layout shift after load (reserve space with skeletons)
- Images: use `next/image` with proper sizing
- YouTube thumbnails: lazy loaded
- API responses: YouTube data cached 1 hour via `unstable_cache`; AI insights cached 24 hours via Upstash Redis

---

## Responsive Design

All layouts must work at:
- Mobile: 375px (stack all columns, reduce chart heights)
- Tablet: 768px (2-column metric cards, single chart column)
- Desktop: 1280px+ (full layout)

Specific breakpoints:
- Metric cards: 1-col mobile, 2-col tablet, 4-col desktop
- Charts: full width mobile, 2-col desktop
- Video table: horizontal scroll on mobile with frozen title column
- Compare panel: stacked on mobile, side-by-side on desktop

---

## Project File Structure

```
vidmetrics/
├── app/
│   ├── layout.tsx                  # Root layout, ThemeProvider, SidebarProvider, fonts
│   ├── globals.css                 # CSS variables, keyframes, shadcn overrides
│   ├── page.tsx                    # Home — channel input
│   ├── analysis/[channelId]/
│   │   └── page.tsx                # Main analysis dashboard
│   ├── report/
│   │   └── page.tsx                # Read-only shareable report
│   └── api/
│       ├── channel/route.ts        # GET — YouTube data + metrics
│       ├── insights/route.ts       # POST — Anthropic AI insights (Redis cached)
│       └── compare/route.ts        # POST — dual channel comparison
├── middleware.ts                   # Edge rate limiting via Upstash
├── components/
│   ├── ui/
│   │   └── CopyHandleButton.tsx
│   ├── layout/
│   │   ├── AppSidebar.tsx          # Full shadcn Sidebar implementation
│   │   └── ThemeToggle.tsx
│   ├── channel/
│   │   ├── ChannelInput.tsx
│   │   ├── ChannelHeader.tsx
│   │   └── RecentChannels.tsx
│   ├── charts/
│   │   ├── ViewsChart.tsx
│   │   ├── EngagementChart.tsx
│   │   ├── HeatmapGrid.tsx
│   │   └── MomentumSparkline.tsx
│   ├── insights/
│   │   ├── AIInsightsPanel.tsx
│   │   ├── MomentumScore.tsx
│   │   ├── TrendingBadge.tsx
│   │   ├── TopTakeaways.tsx
│   │   ├── NicheBenchmark.tsx
│   │   └── ContentGapDetector.tsx
│   ├── videos/
│   │   ├── VideoTable.tsx
│   │   ├── VideoRow.tsx
│   │   ├── VideoFilters.tsx
│   │   ├── ThumbnailPopover.tsx
│   │   └── VideoDeepDive.tsx
│   ├── compare/
│   │   ├── ComparePanel.tsx
│   │   └── CompareChart.tsx
│   └── report/
│       └── ShareButton.tsx
├── lib/
│   ├── youtube.ts                  # YouTube API client + getCachedChannelData
│   ├── metrics.ts                  # All calculations + computeUploadConsistency
│   ├── benchmarks.ts               # Static niche benchmark lookup table
│   ├── utils.ts                    # formatNumber, formatDate, formatDuration, exportToCSV
│   ├── shareLink.ts                # lz-string encode/decode
│   ├── types.ts                    # All TypeScript interfaces
│   ├── api.ts                      # createErrorResponse, validateQuery, withErrorHandler
│   ├── schemas.ts                  # All Zod schemas
│   ├── cache.ts                    # Upstash Redis helpers
│   └── hooks/
│       └── useCountUp.ts
├── public/
│   └── favicon.ico
├── .env.local                      # Never commit
├── .env.example                    # Commit with placeholder values
├── next.config.js
├── tailwind.config.js
└── README.md
```

---

## README Requirements

The README must include:
1. Screenshot or GIF of the product
2. One-line description
3. Feature list (bulleted)
4. Setup instructions (clone → env vars → `npm run dev`)
5. How to get YouTube API key (link to Google Cloud Console)
6. How to get Anthropic API key
7. Deploy to Vercel instructions
8. Tech stack badges

---

## Build Order & Git Commit Instructions

**Critical git rules for Claude Code:**
- After completing each step below, you MUST run the exact `git commit` command shown before moving to the next step.
- Never batch multiple steps into one commit.
- Never commit broken code. Each commit must be in a working state (the app runs without crashing, even if incomplete).
- Use exactly the commit message shown — no changes to wording, capitalisation, or punctuation.
- Always run `git add .` immediately before the commit command.
- If a step produces a TypeScript error that blocks compilation, fix it before committing.

**Before opening Claude Code — set up the project folder manually:**

Create the folder and these three files by hand before starting Claude Code:

```bash
mkdir vidmetrics && cd vidmetrics
```

**1. Create `.gitignore`** with exactly these entries:
```
.env.local
.env
node_modules/
.next/
.DS_Store
.claude/skills/
```

**2. Place `CLAUDE.md`** in the project root (the file provided alongside this PRD). It will be committed and pushed — it is intentional and professional.

**3. Place `VIDMETRICS_PRD.md`** (this file) in the project root so Claude Code can read it directly from disk.

**4. Install the shadcn skill** (local only — never pushed):
```bash
mkdir -p .claude/skills/shadcn-ui
curl -L -o skill.zip "https://fastmcp.me/Skills/Download/278"
unzip -o skill.zip -d .claude/skills/shadcn-ui && rm skill.zip
```

Your folder should look like this before starting Claude Code:
```
vidmetrics/
├── .gitignore          ← created manually, includes .claude/skills/
├── CLAUDE.md           ← will be committed and pushed
├── VIDMETRICS_PRD.md   ← will be committed, delete after deployment
└── .claude/
    └── skills/         ← gitignored, never pushed
        └── shadcn-ui/
```

**5. Start Claude Code:**
```bash
claude
```

**6. First message to Claude Code:**
```
Read the file VIDMETRICS_PRD.md in full before taking any action.
Follow the build order exactly — complete each numbered step fully
and commit with the exact git message shown before moving to the
next step. Do not skip steps or combine them. Begin with Step 1 now.
```

Claude Code reads CLAUDE.md automatically on startup. It will then read VIDMETRICS_PRD.md from disk when you send that message. Do not paste the PRD content into the terminal — reference the file.

---

**Git initialisation (Claude Code handles this in Step 1):**
```bash
git init
git branch -M main
```

---

**Step 1 — Project init and dependencies**
Run `create-next-app`, install all npm packages, initialise shadcn (New York style, Zinc base color, CSS variables yes), add all shadcn components, configure `next.config.js` with YouTube image remote patterns. Note: `.gitignore`, `CLAUDE.md`, and `VIDMETRICS_PRD.md` already exist in the folder — do not overwrite `.gitignore`. Create `.env.example` with all five keys. Then initialise git and make the first commit:
```bash
git init
git branch -M main
git add .
git commit -m "chore: init Next.js 14 with TypeScript, Tailwind, shadcn, and all dependencies"
```

---

**Step 2 — Design system**
Write `app/globals.css` in full: all CSS custom properties (light and dark mode), shadcn variable overrides (sidebar, card shadow removal), `@keyframes fadeIn` and `badgePulse`, `.fade-in` and `.badge-pulse` utility classes, `prefers-reduced-motion` override, base `body` styles. Import Plus Jakarta Sans and Inter in `app/layout.tsx` using `next/font/google` and apply both variables to the `<html>` element.
```bash
git add .
git commit -m "chore: configure design system, CSS variables, fonts, and animation keyframes"
```

---

**Step 3 — Layout shell and sidebar**
Build `app/layout.tsx` fully: `ThemeProvider` (with `attribute="data-theme"`), `SidebarProvider` with server-side cookie read for `defaultOpen`, `SidebarInset` with sticky header containing `SidebarTrigger`, `Breadcrumb`, `ThemeToggle`, and `ShareButton` placeholder. Build `components/layout/AppSidebar.tsx` completely: `Sidebar` with `collapsible="icon"`, `SidebarRail`, `SidebarHeader` with wordmark and SVG icon placeholder, `SidebarContent` with all four nav groups (Analysis, Compare, Recent, Reports), `SidebarFooter` with `ThemeToggle`. Build `components/layout/ThemeToggle.tsx`. Add `<Toaster />` from sonner to layout.
```bash
git add .
git commit -m "feat: build layout shell with AppSidebar, ThemeProvider, and sticky header"
```

---

**Step 4 — Backend utilities**
Create `lib/hooks/useCountUp.ts` with the `requestAnimationFrame` count-up hook. Create `lib/api.ts` with `createErrorResponse`, `validateQuery`, and `withErrorHandler`. Create `lib/schemas.ts` with all Zod schemas (`channelQuerySchema`, `insightsBodySchema`, `compareBodySchema`). Create `lib/cache.ts` with Upstash Redis client, `getCachedInsights`, and `setCachedInsights`.
```bash
git add .
git commit -m "feat: add backend utilities, Zod schemas, and Redis cache helpers"
```

---

**Step 5 — Rate limiting middleware**
Write `middleware.ts` at the project root with Upstash `Ratelimit` for `/api/channel` (20 req/hour/IP) and `/api/insights` (10 req/hour/IP). Export the correct `config.matcher` to target only API paths. Test locally that the middleware compiles without errors.
```bash
git add .
git commit -m "feat: add edge rate limiting middleware via Upstash"
```

---

**Step 6 — TypeScript types**
Write all interfaces in `lib/types.ts`: `ChannelInfo` (with `hiddenSubscriberCount` and `category`), `RawVideo`, `Video` (extends `RawVideo` with computed fields including `durationSeconds`), `ChannelMetrics` (with `uploadConsistency` and `category`), `AIInsights` (with `gapOpportunities: string[]`), `RecentChannel`, `VideoDeepDive`.
```bash
git add .
git commit -m "feat: define all TypeScript interfaces in lib/types.ts"
```

---

**Step 7 — YouTube API client**
Write `lib/youtube.ts` with JSDoc on every exported function: `resolveChannelId` (all 4 URL formats, uses `forHandle`, never `search.list`), `fetchChannelInfo` (single `channels.list` call with `snippet,statistics,contentDetails,topicDetails`, parses all stats from strings to numbers), `fetchVideoIds` (uses uploads playlist via `playlistItems.list`), `fetchVideoDetails` (batches all IDs into one `videos.list` call, handles absent `likeCount`/`commentCount`), `fetchFullChannelData` (combines all three, ~3 quota units), `extractCategory` (parses Wikipedia URLs from `topicCategories`).
```bash
git add .
git commit -m "feat: build YouTube API client with quota-efficient 3-step fetch pattern"
```

---

**Step 8 — Metric calculations**
Write `lib/metrics.ts` with JSDoc on every function: `computeEngagementRate`, `computePerformanceTier`, `computeMomentumScore` (3-component formula), `computeUploadFrequency`, `computeBestPostingTime`, `computeViewsPerDay`, `computeUploadConsistency` (standard deviation of upload gaps, returns label + stdDevDays + 7-day dot data).
```bash
git add .
git commit -m "feat: implement all metric calculations including momentum score and upload consistency"
```

---

**Step 9 — Utility functions**
Write `lib/utils.ts` with `formatNumber` (1.2M, 45.3K), `formatDuration` (ISO 8601 → readable), `formatDate` (relative + absolute), `exportToCSV`, `parseDurationSeconds`. Write `lib/shareLink.ts` with `encodeReportData` and `decodeReportData` using lz-string. Write `lib/benchmarks.ts` with the full 13-category niche lookup table.
```bash
git add .
git commit -m "feat: add utility functions, share link encoding, and niche benchmark table"
```

---

**Step 10 — Channel API route**
Write `app/api/channel/route.ts`: validate URL with `channelQuerySchema`, resolve channel ID, wrap fetch in `getCachedChannelData` using `unstable_cache` (1-hour TTL, unique key per channelId), compute all metrics server-side, return `{ channel, videos, metrics }`. Map YouTube API error codes to correct HTTP statuses (404, 403, 503). Wrap in `withErrorHandler`.
```bash
git add .
git commit -m "feat: create /api/channel route with caching, validation, and error mapping"
```

---

**Step 11 — Home page**
Build `app/page.tsx`: large headline, subheadline, `Input` + "Analyze Channel" button with loading state, 3 use-case chips, CSS-only animated background (slow grid or gradient, no JS), `RecentChannels` placeholder (empty div for now). Handle client-side URL parsing and redirect to `/analysis/[channelId]`. Show inline validation errors using shadcn form patterns.
```bash
git add .
git commit -m "feat: build home page with channel URL input, animated background, and validation"
```

---

**Step 12 — Analysis dashboard page**
Build `app/analysis/[channelId]/page.tsx` as a Server Component that calls `/api/channel`. Set up the full page layout with `Suspense` boundaries for each section: channel header, metrics row, charts, insights, video table. Each section renders its skeleton while data loads. Wire the `Share` and `Compare` buttons in the sticky header. This page is the skeleton that all subsequent component steps will slot into.
```bash
git add .
git commit -m "feat: build analysis dashboard page with Suspense boundaries and data fetching"
```

---

**Step 13 — Channel header and metric cards**
Build `components/channel/ChannelHeader.tsx`: `Avatar`/`AvatarFallback`, channel name, handle, formatted stats, country flag, share + compare buttons, skeleton state, `fade-in` class on data load. Build `components/ui/MetricCard.tsx`: metric label, large number using `useCountUp`, trend badge with `badge-pulse` animation, sparkline slot. Wire the 4-card metrics row into the dashboard page.
```bash
git add .
git commit -m "feat: build ChannelHeader and MetricCard with count-up animation and trend badges"
```

---

**Step 14 — Video table with trending badges**
Build `components/videos/VideoTable.tsx` using TanStack Table + shadcn `Table`. Build `VideoRow.tsx`, `VideoFilters.tsx` (sort dropdown, time period `Tabs`, search `Input`). Build `TrendingBadge.tsx` and wire into `VideoRow`. Implement sort, filter, search, 20-row pagination using shadcn `Pagination`. All numbers formatted via `formatNumber`. Sticky header, alternating row backgrounds.
```bash
git add .
git commit -m "feat: build video table with sort, filter, search, pagination, and trending badges"
```

---

**Step 15 — Charts**
Build `components/charts/ViewsChart.tsx` (shadcn `ChartContainer` + Recharts `BarChart`, tier-colour `Cell` overrides, `ChartTooltip`). Build `components/charts/EngagementChart.tsx` (`LineChart` with reference line at channel average). Build `components/charts/MomentumSparkline.tsx` (mini `AreaChart` with gradient fill). All wrapped in `'use client'`. Wire into dashboard page.
```bash
git add .
git commit -m "feat: build ViewsChart, EngagementChart, and MomentumSparkline with shadcn charts"
```

---

**Step 16 — Heatmap**
Build `components/charts/HeatmapGrid.tsx` as a pure CSS 7×24 grid. Compute `(dayOfWeek, hour)` bucket averages from video `publishedAt` timestamps. Interpolate cell colour between `--bg-elevated` (0 views) and `--accent` (max views). Hover tooltip using shadcn `Tooltip`. Row labels Mon–Sun, column labels at 12am/3am/6am/9am/12pm/3pm/6pm/9pm. Best slot summary text below.
```bash
git add .
git commit -m "feat: build publishing heatmap with CSS grid and colour-scaled cells"
```

---

**Step 17 — Momentum score and upload consistency**
Build `components/insights/MomentumScore.tsx`: large animated count-up number, colour-coded label (green/blue/amber/red), explanatory sentence, `MomentumSparkline`. Add the upload consistency display below: label, stdDevDays detail text, 7-day dot grid (filled dots on frequent upload days, faint on others). Wire into dashboard page.
```bash
git add .
git commit -m "feat: build MomentumScore widget with count-up and upload consistency dot grid"
```

---

**Step 18 — AI insights API route**
Write `app/api/insights/route.ts` with streaming implementation: validate body with `insightsBodySchema`, check Redis cache (`getCachedInsights`) — return plain JSON if hit. If miss: call `anthropic.messages.stream`, return `ReadableStream` (`text/plain`), parse and cache full JSON after stream completes. Include `buildInsightsPrompt` helper. Wrap in `withErrorHandler`.
```bash
git add .
git commit -m "feat: create /api/insights route with streaming Anthropic response and Redis caching"
```

---

**Step 19 — AI insights panel and content gap detector**
Build `components/insights/AIInsightsPanel.tsx` with `fetchInsightsStream` client, `parsePartialInsights` for progressive section reveal, skeleton placeholders for unreceived sections, retry button, "Powered by Claude" attribution. Build `components/insights/ContentGapDetector.tsx` with 3 gap opportunities and "copy as briefs" clipboard button. Wire both into dashboard page.
```bash
git add .
git commit -m "feat: build AIInsightsPanel with streaming reveal and ContentGapDetector"
```

---

**Step 20 — Computed insights: takeaways, duration banner, niche benchmark**
Build `components/insights/TopTakeaways.tsx` (3 computed bullets, no loading state). Add the duration vs performance insight banner below the charts section (only renders if ≥3 videos in each bucket). Build `components/insights/NicheBenchmark.tsx` using `lib/benchmarks.ts` — three-metric comparison table with above/below/equal indicators and tooltip. Wire all three into dashboard page.
```bash
git add .
git commit -m "feat: add TopTakeaways, duration insight banner, and NicheBenchmark card"
```

---

**Step 21 — CSV export**
Wire `exportToCSV` from `lib/utils.ts` to a fixed floating `Button` (bottom-right of dashboard). File triggers download as `{channelTitle}-vidmetrics-{date}.csv`. Fire a `toast()` from sonner on download start.
```bash
git add .
git commit -m "feat: implement CSV export with floating button and sonner toast"
```

---

**Step 22 — Shareable report link**
Build `components/report/ShareButton.tsx`: encode current report data with `encodeReportData`, copy URL to clipboard, fire `toast("Report link copied")`. Build `app/report/page.tsx` as read-only view: decode `?data=` param, render channel info + metrics + charts identically to dashboard but with no inputs or action buttons. Show friendly error if param missing or invalid. Add OG meta tags.
```bash
git add .
git commit -m "feat: build shareable report link with lz-string encoding and read-only report page"
```

---

**Step 23 — Channel comparison**
Write `app/api/compare/route.ts`: validate `compareBodySchema`, fetch both channels in `Promise.all`, generate AI summary (2–3 sentences, non-streaming), return `{ channelA, channelB, aiSummary }`. Build `components/compare/ComparePanel.tsx` and `CompareChart.tsx`: head-to-head metrics table with winner highlighting, overlapping grouped bar chart. Open via shadcn `Dialog` triggered by "Compare Channel" button in `ChannelHeader`.
```bash
git add .
git commit -m "feat: build channel comparison with API route, metrics table, and overlapping chart"
```

---

**Step 24 — Video deep dive panel**
Build `components/videos/VideoDeepDive.tsx`: shadcn `Sheet` on desktop (`side="right"`), shadcn `Drawer` on mobile (detect via `useIsMobile()`). Sections: thumbnail + title header, performance vs channel average `Progress` bars, estimated velocity `AreaChart` (modelled, clearly labelled), content signals grid, computed performance one-liner using `buildPerformanceSentence` (no AI call — derived from `contentSignals` and channel metrics). Escape key + outside-click + X button close. Wire row click in `VideoRow`.
```bash
git add .
git commit -m "feat: build VideoDeepDive slide-in panel with Sheet/Drawer and velocity curve"
```

---

**Step 25 — Thumbnail popover and copy handle button**
Build `components/videos/ThumbnailPopover.tsx` using shadcn `Popover` with `next/image` thumbnail, duration badge overlay, `shadow-none` override. Build `components/ui/CopyHandleButton.tsx` with Copy → Check icon swap (2s timeout) and tooltip. Wire both: popover into `VideoRow` title cell, copy button into `ChannelHeader` next to handle text.
```bash
git add .
git commit -m "feat: add thumbnail popover on title hover and copy handle button"
```

---

**Step 26 — Recent channels and demo seeding**
Build `components/channel/RecentChannels.tsx`: read/write `vidmetrics_recent` from localStorage (max 5, `useEffect` only, no SSR), channel avatar + name + handle + link, × remove button, fade-in on mount. Wire into home page below input. On first visit (no existing localStorage key), pre-populate with MrBeast, MKBHD, and Veritasium channel data so the demo starts with content.
```bash
git add .
git commit -m "feat: add RecentChannels with localStorage persistence and demo pre-seeding"
```

---

**Step 27 — Dark/light mode wiring**
Wire `next-themes` (already installed): confirm `ThemeProvider` has `attribute="data-theme"` and `suppressHydrationWarning` on `<html>`. Verify `ThemeToggle` uses `useTheme()`. Test every card, chart, heatmap, sidebar, and modal in both themes — fix any hardcoded colours. Ensure shadcn chart `chartConfig` colours resolve correctly via CSS variables in dark mode.
```bash
git add .
git commit -m "feat: wire dark/light mode and verify all components adapt correctly"
```

---

**Step 28 — Responsive polish**
Go through every page and component at 375px, 768px, and 1280px. Metric cards: 1-col mobile, 2-col tablet, 4-col desktop. Charts: full width on mobile. Video table: `ScrollArea` horizontal scroll on mobile with frozen title column. `VideoDeepDive`: `Sheet` on desktop, `Drawer` bottom sheet on mobile. `ComparePanel`: stacked on mobile, side-by-side on desktop. Home page: input full width on mobile.
```bash
git add .
git commit -m "style: responsive polish for mobile (375px) and tablet (768px)"
```

---

**Step 29 — Skeleton loaders**
Every async section must have a `Skeleton` that matches the exact rendered dimensions of the loaded content. Sections: `ChannelHeader`, `MetricCard` × 4, `ViewsChart`, `EngagementChart`, `HeatmapGrid`, `MomentumScore`, `AIInsightsPanel`, `NicheBenchmark`, `ContentGapDetector`, `VideoTable`. Apply `fade-in` class to the outermost element of each section when content replaces the skeleton.
```bash
git add .
git commit -m "style: add skeleton loaders matching exact content dimensions for all async sections"
```

---

**Step 30 — Error and empty states**
Add all error states: invalid URL, channel not found, private channel, YouTube quota exceeded (503), AI insights failure (retry button), network error (generic retry). Add all empty states: no videos in selected time period, insufficient data for heatmap, insufficient data for consistency score, no niche benchmark category match. All messages human-readable, no raw error codes shown to users.
```bash
git add .
git commit -m "feat: add all error and empty states with human-readable messages"
```

---

**Step 31 — Favicon and Open Graph**
Add `favicon.ico` to `/public`. Add `og:title`, `og:description`, `og:image` (use a placeholder URL for now), and `og:url` meta tags to `app/layout.tsx` via Next.js `metadata` export. Add the same tags to `app/report/page.tsx` dynamically (channel name in og:title). Verify link preview renders in Slack/Discord by checking the meta tags in browser DevTools.
```bash
git add .
git commit -m "chore: add favicon and Open Graph meta tags for link sharing"
```

---

**Step 32 — README**
Write the full README: screenshot placeholder at top, one-line description, complete feature list (all 19 features), setup instructions (clone → `.env.local` → `npm run dev`), how to get YouTube API key (link to Google Cloud Console), how to get Anthropic API key (console.anthropic.com), how to set up Upstash Redis (upstash.com → free tier), deploy to Vercel button, tech stack badges.
```bash
git add .
git commit -m "docs: write README with full setup, feature list, and deployment instructions"
```

---

**Step 33 — Micro-interactions polish**
Verify all 7 micro-interactions from the Design System section are working correctly: count-up on metric cards and momentum score, sidebar cookie persistence across page reloads, sort arrow rotation, skeleton → content fade-in on every section, trend badge single pulse (never looping), sidebar nav active transition, Sheet/Drawer default animations not overridden. Fix any that are missing or broken.
```bash
git add .
git commit -m "style: verify and fix all micro-interactions and animation polish"
```

---

**Step 34 — Final cleanup and documentation**
Remove all `console.log` statements. Fix any remaining TypeScript errors. Ensure every exported function in `lib/` has a JSDoc comment matching the patterns in the Code Documentation Guidelines section. Add the three required `TODO V2` comments (velocity curve, topicCategories mapping, shareable URL length). Run `npm run build` — must pass with zero errors and zero warnings.
```bash
git add .
git commit -m "chore: final cleanup, JSDoc comments, and TODO V2 annotations"
```

---

**Step 35 — Manual testing and fixes**
Run the complete manual test suite from the Testing Instructions section. Fix any failures. If fixes require code changes, make them and commit with a descriptive message explaining what was broken and what was fixed. Do not proceed to push until every test in the Testing Instructions section passes.
```bash
# After all fixes are verified:
git add .
git commit -m "fix: resolve issues found during manual test suite"
```

---

**Step 36 — Bundle and security audit**
```bash
# 1. Check no API keys are in the client bundle (built output)
grep -r "YOUTUBE_API_KEY\|ANTHROPIC_API_KEY\|UPSTASH" .next/static/
# Expected: no output

# 2. Scan committed source files for any real key patterns
# YouTube API keys start with AIza, Anthropic keys start with sk-ant
git log --all -p | grep -E "AIza[a-zA-Z0-9_-]{35}|sk-ant-" | head -5
# Expected: no output

# 3. Confirm .env.example has only placeholders, no real values
cat .env.example
# Every value must be a human-readable placeholder like "your_youtube_data_api_v3_key"
# If any value looks like a real key (long random string), replace it with a placeholder

# 4. Confirm .env.local is not tracked by git
git ls-files | grep ".env.local"
# Expected: no output

# 5. Final build confirmation
npm run build
```
If any of these produce unexpected output, fix it before pushing. For a public repo, a leaked key is a permanent problem — rotate it at the provider before pushing if you ever find one in git history.
```bash
git add .
git commit -m "chore: final build verified, bundle audit passed, no secrets in client"
```

---

**Step 37 — Push to GitHub**
Only push after steps 34–36 are all complete and clean. Before pushing, decide if you want to remove `VIDMETRICS_PRD.md` from the repo — it's a working document and doesn't need to ship with the product. CLAUDE.md stays.
```bash
# Optional: remove the PRD from the repo (keep the file locally if you want)
git rm VIDMETRICS_PRD.md
git commit -m "chore: remove PRD working document before publishing"

# Connect to GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/vidmetrics.git
git push -u origin main
```


---

---

## Testing Instructions

Claude Code must run the following tests after completing the steps listed. Tests are manual (no Jest or test framework needed — the product is a demo MVP and a full test suite is out of scope). However, each core feature must be verified to actually work before committing it.

---

### After Step 10 — Channel API route

Run these in the terminal with the dev server running (`npm run dev`):

```bash
# Test 1: valid channel by @handle
curl "http://localhost:3000/api/channel?url=https://www.youtube.com/@mkbhd"
# Expected: 200 JSON with channel, videos array (non-empty), metrics object

# Test 2: valid channel by /channel/UC... ID
curl "http://localhost:3000/api/channel?url=https://www.youtube.com/channel/UCBcRF18a7Qf58cCRy5xuWwQ"
# Expected: 200 JSON with data

# Test 3: invalid URL
curl "http://localhost:3000/api/channel?url=https://google.com"
# Expected: 400 { error: "Must be a YouTube channel URL" }

# Test 4: missing URL param
curl "http://localhost:3000/api/channel"
# Expected: 400 { error: "..." }

# Test 5: private or non-existent channel
curl "http://localhost:3000/api/channel?url=https://www.youtube.com/@thischanneldoesnotexist99999"
# Expected: 404 { error: "Channel not found..." }
```

Verify the response shape matches the TypeScript interfaces exactly. Check that:
- All `viewCount`, `subscriberCount`, `likeCount` values are **numbers** (not strings)
- `videos` array has up to 50 items
- Each video has `engagementRate`, `performanceTier`, `daysLive`, `viewsPerDay`, `durationSeconds`
- `metrics` object includes `momentumScore`, `uploadConsistency`, `category`

---

### After Step 18 — AI insights API route

```bash
# Test 1: valid POST with minimal payload
curl -X POST "http://localhost:3000/api/insights" \
  -H "Content-Type: application/json" \
  -d '{"channelId":"UCBcRF18a7Qf58cCRy5xuWwQ","channelTitle":"MKBHD","subscriberCount":18000000,"videos":[{"id":"abc","title":"Test","viewCount":100000,"engagementRate":4.2,"daysLive":30,"duration":"PT8M"}],"metrics":{"avgViews":100000,"avgEngagementRate":4.2,"momentumScore":72,"momentumLabel":"Stable","uploadFrequency":"2x / week"}}'
# Expected: streaming response (text/plain) OR JSON { insights: {...} } if cached
# Verify response contains whatIsWorking, uploadPattern, titleFormula, gapOpportunity, gapOpportunities[]

# Test 2: malformed body
curl -X POST "http://localhost:3000/api/insights" \
  -H "Content-Type: application/json" \
  -d '{"channelTitle":"test"}'
# Expected: 400 { error: "..." }

# Test 3: caching — run test 1 twice, second response should be instant JSON
```

---

### After Step 23 — Channel comparison API route

```bash
curl -X POST "http://localhost:3000/api/compare" \
  -H "Content-Type: application/json" \
  -d '{"channelAUrl":"https://www.youtube.com/@mkbhd","channelBUrl":"https://www.youtube.com/@veritasium"}'
# Expected: 200 with channelA, channelB, aiSummary
# Verify both channels returned with full metrics
# Should take ~3-6s (two parallel fetches + AI call)
```

---

### After Step 22 — Shareable report link

Test the encode → decode round-trip manually in the browser:

1. Analyse a channel in the UI
2. Click Share — copy the URL to clipboard
3. Open a new private/incognito browser tab
4. Paste the URL — verify the report page renders identically with correct channel name, metrics, and videos
5. Verify there is no "Analyze" button or any interactive input on the report page

---

### After Step 28 — Responsive polish

Open browser DevTools → toggle device mode → test at these exact widths:
- **375px** (iPhone SE): sidebar should be collapsed/hidden, all cards stack vertically, table scrolls horizontally
- **768px** (iPad): metric cards in 2-col grid, charts full width
- **1280px** (desktop): full layout

Also test with keyboard navigation: Tab through the page, verify focus rings are visible and logical.

---

### After Step 36 — Final build verification

```bash
# TypeScript — must pass with zero errors
npm run build

# Check bundle for exposed secrets (should return nothing)
grep -r "YOUTUBE_API_KEY\|ANTHROPIC_API_KEY\|UPSTASH" .next/static/

# Verify all YouTube URL formats resolve correctly
# Test each in the browser UI:
# https://www.youtube.com/@mkbhd
# https://www.youtube.com/channel/UCBcRF18a7Qf58cCRy5xuWwQ
# https://www.youtube.com/c/mkbhd
# https://www.youtube.com/user/marquesbrownlee
```

---

### Metric calculation verification

After fetching a real channel (e.g. `@veritasium`), verify these calculations manually against the raw data:

```bash
# Pipe the API response to check specific values
curl "http://localhost:3000/api/channel?url=https://www.youtube.com/@veritasium" | python3 -m json.tool | grep -A5 '"metrics"'
```

Spot-check:
- `engagementRate` on any video = `(likeCount + commentCount) / viewCount * 100` — calculate manually for one video and compare
- `momentumScore` is between 0 and 100
- `performanceTier` on the top video should be `"hot"` if its views are >1.5× the channel median
- `uploadConsistency.stdDevDays` should be a positive number

---

## Code Documentation Guidelines

Code comments should explain *why*, not *what*. Claude Code must follow these rules — they are not optional:

**Do document:**
- All exported functions in `lib/` files — one JSDoc comment per function explaining what it does, its parameters, return value, and any important caveats
- All non-obvious logic — especially metric calculations, the momentum score formula, and the YouTube API quirks
- All `// TODO:` comments for known limitations that are acceptable for MVP but would be fixed in V2

**Do not document:**
- Self-explanatory component code (`<Button>`, `<Card>`, simple JSX)
- Obvious variable names or simple `useState` calls
- Things that TypeScript types already explain

---

**Required JSDoc for all `lib/` functions:**

```typescript
/**
 * Resolves any YouTube channel URL format to a canonical channel ID.
 *
 * Handles four URL formats:
 * - /channel/UCxxxxxx — extracted directly, no API call
 * - /@handle — resolved via channels.list?forHandle (1 quota unit)
 * - /c/customname — resolved via channels.list?forHandle (1 quota unit)
 * - /user/username — resolved via channels.list?forUsername (1 quota unit)
 *
 * Never uses search.list (costs 100 units).
 *
 * @throws {Error} If URL format is unrecognised or channel is not found
 */
export async function resolveChannelId(url: string): Promise<string>

/**
 * Fetches all data needed for a full channel analysis in ~3 YouTube API quota units:
 * 1. channels.list (1 unit) — channel info + uploads playlist ID
 * 2. playlistItems.list (1 unit) — up to 50 most recent video IDs
 * 3. videos.list (1 unit) — full stats for all IDs in one batched request
 *
 * Note: YouTube API returns all statistics (viewCount, likeCount, etc.) as strings.
 * This function parses them to numbers before returning.
 * likeCount and commentCount may be absent (not just 0) if hidden by the creator.
 */
export async function fetchFullChannelData(channelId: string)

/**
 * Computes the Momentum Score (0–100) for a channel.
 *
 * Three components:
 * - Views growth (40pts): last 30d vs prior 30d total views
 * - Upload frequency change (30pts): video count last 30d vs prior 30d
 * - Engagement trend (30pts): avg engagement rate last 10 videos vs prior 10
 *
 * Labels: 80–100 = Accelerating, 50–79 = Stable, 25–49 = Slowing, 0–24 = Dormant
 */
export function computeMomentumScore(videos: Video[]): number
```

**Required inline comments for non-obvious logic:**

```typescript
// YouTube API returns subscriber counts rounded to 3 significant figures.
// e.g. 1,234,567 is returned as 1,230,000. Do not display false precision.
const subscriberCount = parseInt(stats.subscriberCount ?? '0', 10)

// The uploads playlist ID is always the channel ID with "UC" replaced by "UU".
// We get it from contentDetails.relatedPlaylists.uploads in the API response,
// but it can also be derived without an API call if needed.
const uploadsPlaylistId = ch.contentDetails.relatedPlaylists.uploads

// lz-string compression keeps the URL under browser limits for typical channel datasets.
// For very large channels (50 videos with full metadata), compressed size is ~2-4KB.
// Most browsers support URLs up to 2MB, so this is safe for the current scope.
const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(data))

// Engagement rate formula: (likes + comments) / views * 100
// We use comments in addition to likes because comments require genuine user intent
// and are harder to inflate artificially than likes.
const engagementRate = ((likeCount + commentCount) / Math.max(viewCount, 1)) * 100
```

**Required TODO comments for known MVP limitations:**

```typescript
// TODO V2: Replace modelled velocity curve with real time-series data.
// Currently we model view accumulation based on performance tier (hot/average/etc.)
// because the YouTube API does not expose historical view counts per video.
// A real implementation would snapshot view counts daily via a cron job.

// TODO V2: topicCategories are Wikipedia URLs that may not match our benchmark table.
// Current approach covers the most common categories; unknown channels fall back to 'default'.
// V2 should expand the mapping table or use the YouTube categories API endpoint.

// TODO V2: The shareable report URL can become very long for channels with 50 videos.
// Current compression is sufficient for the demo. V2 should store reports server-side
// (Supabase or similar) and share a short opaque ID instead.
```

---

### What not to comment

```typescript
// BAD — states the obvious, adds noise
const [isLoading, setIsLoading] = useState(false) // loading state

// BAD — restates the code
return videos.sort((a, b) => b.viewCount - a.viewCount) // sort by views descending

// GOOD — explains a non-obvious decision
// Sort by views descending to ensure performanceTier computation
// sees the highest-viewed video first (used as the "top video" in takeaways)
return videos.sort((a, b) => b.viewCount - a.viewCount)
```

---

## Quality Checklist (before shipping)

- [ ] All five /api/channel curl tests pass (valid handles, valid IDs, invalid URL, missing param, non-existent channel)
- [ ] AI insights POST returns streaming response; second request for same channel returns instant JSON
- [ ] /api/compare returns data for two real channels
- [ ] Shareable link round-trips correctly in a private browser tab
- [ ] No API keys found in .next/static/ bundle scan
- [ ] All exported lib/ functions have JSDoc comments
- [ ] Three required TODO V2 comments are present in the codebase
- [ ] YouTube thumbnails and channel avatars render correctly (next.config.js image domains set)
- [ ] AI insights stream progressively — sections appear one by one, not all at once
- [ ] Cached AI insights (second request for same channel) return instantly as JSON, not streamed
- [ ] Rate limiting middleware fires correctly (test by hitting /api/channel repeatedly)
- [ ] AI insights are cached in Redis — second request for same channel returns instantly
- [ ] All route handlers return consistent { error: string } shape on failures
- [ ] Zod validation rejects malformed URLs with 400 + human-readable message
- [ ] No API keys in client bundle (check browser network tab — none in JS files)
- [ ] middleware.ts only matches /api/ paths — does not run on page routes
- [ ] Metric card numbers count up from 0 on first data load
- [ ] Sidebar collapse state persists across page reloads via cookie
- [ ] Sort arrow rotates smoothly on direction change (not snap)
- [ ] Skeleton → content transitions use fade-in (no abrupt pop)
- [ ] Trend badges play a single pulse on mount, never loop
- [ ] Sidebar nav active state transitions smoothly between items
- [ ] Sheet and Drawer default slide animations are not overridden
- [ ] All animations respect prefers-reduced-motion
- [ ] Recent channels appear on home page and clear correctly
- [ ] Thumbnail popover appears on title hover, doesn't overflow viewport
- [ ] Top takeaways card renders without loading state
- [ ] Duration insight banner only shows when enough data exists
- [ ] Copy handle button switches to check icon for 2s then reverts
- [ ] Niche benchmark card shows correct category and above/below indicators
- [ ] Upload consistency score label and dot grid render correctly
- [ ] VideoDeepDive panel opens on row click, closes on Escape and outside click
- [ ] VideoDeepDive renders as bottom sheet on mobile
- [ ] ContentGapDetector shows 3 specific gaps and "copy as briefs" works
- [ ] All YouTube URL formats parse correctly
- [ ] Works on mobile (375px)
- [ ] Dark mode works everywhere (no hardcoded colors)
- [ ] All error states show (test with invalid URL, no videos, etc.)
- [ ] CSV download works and filename is correct
- [ ] Shareable link round-trips (encode → decode → renders correctly)
- [ ] Charts have proper tooltips
- [ ] AI insights panel shows loading state, then content
- [ ] Numbers formatted correctly (1.2M not 1200000)
- [ ] No console errors in production build
- [ ] `npm run build` passes with no type errors
- [ ] Deployed to Vercel with env vars set
- [ ] Test on Chrome, Safari, Firefox
- [ ] Open Graph preview works for report URL
- [ ] Git log shows 36 clean commits with meaningful messages
- [ ] No `.env.local` or API keys anywhere in the repo
- [ ] `.env.example` is committed with placeholder values

---

## Notes for Claude Code

- `next.config.js` must include `remotePatterns` for `i.ytimg.com` and `yt3.googleusercontent.com` — without this, every `next/image` call with YouTube URLs throws a runtime error.
- The `/api/insights` route streams for fresh requests and returns plain JSON for cached (Redis) responses. The `AIInsightsPanel` client must handle both content types — check `Content-Type` header to decide which path to take.
- After EVERY step, run `git add .` and the exact commit command shown before proceeding. No exceptions.
- Never commit if `npm run build` would fail due to your changes. Fix errors first.
- Never put API keys in any committed file. `.env.local` must stay in `.gitignore`.
- Keep all API keys server-side only. Never use them in client components or expose via `NEXT_PUBLIC_`.
- Use React Server Components where possible (channel data fetching). Client components only where needed (charts, interactive filters, theme toggle, localStorage).
- For Recharts/ChartContainer in RSC environments, wrap chart components in a client boundary with `'use client'`.
- The AI insights call can be slow (2–5s). Always check Redis cache first. Show loading state — never block the whole page on it.
- When computing metrics that require comparing "last 30 days vs prior 30 days", base the cutoff on `new Date()` at request time.
- YouTube API quota: `channels.list`, `playlistItems.list`, and `videos.list` all cost 1 unit per call. `search.list` costs 100 units — NEVER use it. A full channel analysis costs ~3 units total. Fetch up to 50 video IDs via `playlistItems.list` using the uploads playlist, then batch all IDs into a single `videos.list` call.
- All YouTube API statistics fields (`viewCount`, `subscriberCount`, `likeCount`, etc.) are returned as **strings** — always `parseInt(value ?? '0', 10)` before storing or computing.
- `likeCount` and `commentCount` may be completely absent from the `statistics` object if the creator has hidden them — use `?? '0'` defaults, never assume they exist.
- Handle the case where `likeCount` is not returned by YouTube (some channels hide likes) — treat as 0 and note in the UI.
- All Route Handlers must use `validateQuery` or `validateBody` from `lib/api.ts` and be wrapped in `withErrorHandler`.
- `middleware.ts` runs at the edge — keep it lean. Only rate limiting logic goes here, no heavy computation.
- Use `unstable_cache` from `next/cache` for YouTube API calls (1-hour TTL). Use Upstash Redis from `lib/cache.ts` for AI insights (24-hour TTL).
- Do not push to GitHub until step 36 is fully complete, all manual tests pass, and `npm run build` passes cleanly.