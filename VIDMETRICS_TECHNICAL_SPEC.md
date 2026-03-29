# VidMetrics — Technical Specification
> Last updated: 2026-03-29
> Status: Production-ready MVP

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Directory Structure](#4-directory-structure)
5. [Design System](#5-design-system)
6. [Backend — API Routes](#6-backend--api-routes)
7. [Backend — YouTube Data Layer](#7-backend--youtube-data-layer)
8. [Backend — AI Insights](#8-backend--ai-insights)
9. [Backend — Caching Strategy](#9-backend--caching-strategy)
10. [Backend — Rate Limiting](#10-backend--rate-limiting)
11. [Backend — Auth (Supabase)](#11-backend--auth-supabase)
12. [Frontend — Pages](#12-frontend--pages)
13. [Frontend — Component Library](#13-frontend--component-library)
14. [Frontend — State Management](#14-frontend--state-management)
15. [Frontend — Channel Tab System](#15-frontend--channel-tab-system)
16. [Metrics Engine](#16-metrics-engine)
17. [Data Types](#17-data-types)
18. [Environment Variables](#18-environment-variables)
19. [Security Model](#19-security-model)
20. [Deployment](#20-deployment)

---

## 1. Product Overview

**VidMetrics** is a YouTube competitor analytics tool. A user pastes a YouTube channel URL (or @handle) and instantly sees deep performance analytics: which videos are winning, why they're winning, how the channel is trending over time, and what content opportunities exist.

**Tagline:** *YouTube intelligence for creators and agencies*

**Core use cases:**
- Analyze any YouTube channel's performance metrics
- Compare 2–3 channels side-by-side with AI-generated competitive analysis
- Track channels over time via a watchlist with momentum scores
- Generate AI-powered content gap analysis and strategy insights
- Export data as CSV for external reporting

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + shadcn/ui (New York style, Zinc base) |
| Charts | Recharts via shadcn `ChartContainer` |
| Icons | Lucide React |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Date handling | date-fns |
| AI | Anthropic SDK (`claude-sonnet-4-20250514`) |
| Auth | Supabase (`@supabase/ssr`) |
| Cache (AI) | Upstash Redis (24hr TTL) |
| Rate limiting | Upstash Ratelimit (sliding window) |
| Cache (YouTube) | Next.js `unstable_cache` (1hr TTL) |
| Validation | Zod |
| Table | TanStack Table v8 |
| Deployment | Vercel |

---

## 3. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     Browser (Client)                      │
│                                                          │
│  React Client Components                                  │
│  ├── Context Providers (7 providers in layout)           │
│  ├── Channel Tab System (localStorage + events)          │
│  ├── In-memory Channel Cache (Map via useRef)            │
│  └── All data fetched via fetch('/api/...')              │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼───────────────────────────────────┐
│                  Next.js Edge (Middleware)                 │
│  ├── Supabase session refresh (every request)            │
│  └── Upstash rate limiting (/api/channel, /api/insights) │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│                 Next.js Route Handlers                    │
│                                                          │
│  GET  /api/channel   ─── YouTube API → computeAllMetrics │
│  POST /api/insights  ─── Redis → Anthropic stream        │
│  POST /api/compare   ─── YouTube API × 3 + Anthropic     │
│  GET  /auth/callback ─── Supabase OAuth callback         │
└──────┬────────────────────────────────┬──────────────────┘
       │                                │
┌──────▼──────┐                ┌────────▼───────┐
│ YouTube     │                │ Upstash Redis  │
│ Data API v3 │                │ (AI cache)     │
│ ~9 units    │                │ 24hr TTL       │
└─────────────┘                └────────────────┘
       │
┌──────▼──────┐
│ Next.js     │
│ unstable_   │
│ cache       │
│ (1hr TTL)   │
└─────────────┘
```

**Key architectural principles:**
- All external API calls (YouTube, Anthropic, Redis) are **server-side only** in Route Handlers
- Client components call `/api/*` routes via `fetch()` — never directly call lib functions
- Two independent caching layers: Next.js `unstable_cache` for YouTube data, Upstash Redis for AI insights
- No Server Actions — all mutations go through Route Handlers

---

## 4. Directory Structure

```
vidmetrics/
├── app/
│   ├── layout.tsx                    Root layout — fonts, providers, sidebar, header
│   ├── page.tsx                      Landing page with hero search input
│   ├── globals.css                   CSS variables, animations, shadcn overrides
│   ├── api/
│   │   ├── channel/route.ts          GET — resolve channel URL, fetch data, compute metrics
│   │   ├── insights/route.ts         POST — stream AI insights, cache in Redis
│   │   └── compare/route.ts          POST — fetch 2-3 channels, AI comparison
│   ├── auth/
│   │   └── callback/route.ts         Supabase OAuth callback handler
│   └── analysis/
│       ├── page.tsx                  /analysis redirect page
│       ├── layout.tsx                Analysis sub-layout
│       ├── [channelId]/
│       │   ├── page.tsx              Server wrapper — reads channelId from params
│       │   └── AnalysisDashboard.tsx Client component — fetches data, renders analysis
│       └── compare/
│           ├── page.tsx              /compare root — ComparePageContent with no prop channel IDs
│           └── [compareId]/
│               └── page.tsx          Dynamic comparison route — reads IDs from tab state
│
├── components/
│   ├── analysis/
│   │   ├── ChannelAnalysisView.tsx   Main analysis layout — all sections assembled
│   │   ├── AnalysisSection.tsx       Section wrapper with title
│   │   └── AnalysisPageSkeleton.tsx  Loading skeleton matching real content dimensions
│   ├── auth/
│   │   ├── AuthModal.tsx             Sign-in modal (Google OAuth via Supabase)
│   │   └── UserButton.tsx            Header avatar/sign-in button
│   ├── channel/
│   │   ├── ChannelHeader.tsx         Channel avatar, title, stats row
│   │   ├── ChannelHeaderSkeleton.tsx Skeleton for channel header
│   │   ├── MetricCard.tsx            Reusable stat card with count-up animation
│   │   └── RecentChannels.tsx        Recently analyzed channels list
│   ├── charts/
│   │   ├── ViewsChart.tsx            Views over time line chart
│   │   ├── EngagementChart.tsx       Engagement rate trend
│   │   ├── PerformanceDistribution.tsx Views distribution scatter
│   │   ├── DurationVsViews.tsx       Duration vs view count scatter
│   │   ├── EngagementVsViews.tsx     Engagement vs views scatter
│   │   ├── UploadFrequencyChart.tsx  Upload cadence bar chart
│   │   ├── HeatmapGrid.tsx           Upload timing heatmap (hour × day)
│   │   └── MomentumSparkline.tsx     6-month momentum mini line chart
│   ├── compare/
│   │   └── ChannelSelector.tsx       Channel selection UI for comparison page
│   ├── insights/
│   │   ├── AIInsightsPanel.tsx       Streaming AI insights with skeleton loading
│   │   ├── MomentumScore.tsx         Momentum score widget + upload consistency
│   │   ├── NicheBenchmark.tsx        Category benchmark comparison bars
│   │   ├── ContentInsights.tsx       Content signals grid (duration, day, format)
│   │   ├── TopTakeaways.tsx          Automated top-3 bullet takeaways
│   │   ├── ContentGapDetector.tsx    Gap opportunity display
│   │   ├── InsightTimelineRailed.tsx  Timeline rail of milestones
│   │   ├── AnalysisDiff.tsx          Metric diff vs previous snapshot
│   │   ├── TrendingBadge.tsx         Hot/rising/trending badge
│   │   └── ChannelHistoryChart.tsx   Historical momentum line chart
│   ├── layout/
│   │   ├── AppSidebar.tsx            Full shadcn sidebar with nav items
│   │   ├── ChannelTabBar.tsx         Tab bar (channel + comparison tabs, drag-drop)
│   │   ├── ChannelTabBarWrapper.tsx  Route-aware wrapper for tab bar
│   │   ├── HeaderBreadcrumb.tsx      Breadcrumb in the sticky header
│   │   ├── ThemeToggle.tsx           Light/dark/system theme toggle
│   │   ├── HeroBackground.tsx        Landing page background effect
│   │   ├── VidMetricsLogo.tsx        SVG logo component
│   │   └── GlobalKeyboardShortcuts.tsx  Keyboard navigation (⌘K, ⌘J, ⌘B)
│   ├── report/
│   │   ├── ShareButton.tsx           Copy shareable report link
│   │   └── ...
│   ├── ui/                           shadcn/ui primitives (25+ components)
│   └── videos/
│       ├── VideoTable.tsx            TanStack Table with sorting/filtering
│       ├── VideoDeepDive.tsx         Sheet (desktop) / Drawer (mobile) detail panel
│       └── VideoPerformanceBadge.tsx  hot/rising/average/underperforming badge
│
├── lib/
│   ├── api.ts                        createErrorResponse, validateQuery, withErrorHandler
│   ├── benchmarks.ts                 13-category niche benchmark lookup table
│   ├── cache.ts                      Upstash Redis get/set for AI insights
│   ├── metrics.ts                    All metric computation (parseDuration, momentum, etc.)
│   ├── schemas.ts                    Zod validation schemas for all API inputs
│   ├── snapshots.ts                  Supabase snapshot save/fetch for signed-in users
│   ├── types.ts                      All TypeScript interfaces
│   ├── utils.ts                      cn, formatNumber, formatDate, normalizeChannelInput, etc.
│   ├── youtube.ts                    YouTube API client (resolveChannelId, fetchVideoDetails, etc.)
│   ├── context/
│   │   ├── AuthContext.tsx           Supabase auth state (user, session)
│   │   ├── ChannelCacheContext.tsx   In-memory Map of channelId → {channel, videos, metrics}
│   │   ├── RecentChannelsContext.tsx  localStorage history of last N analyzed channels
│   │   ├── ReportsHistoryContext.tsx  localStorage history of generated reports
│   │   ├── SavedComparisonsContext.tsx  Supabase-persisted saved comparisons
│   │   ├── SettingsContext.tsx        User preferences (videosToFetch, theme)
│   │   └── WatchlistContext.tsx       Supabase-persisted watchlist with momentum tracking
│   ├── hooks/
│   │   ├── useChannelTabs.ts         Tab state hook (localStorage + cross-tab sync)
│   │   └── useCountUp.ts             Number count-up animation hook
│   └── supabase/
│       ├── client.ts                 Browser Supabase client (SSR-safe)
│       ├── server.ts                 Server Component Supabase client
│       └── middleware.ts             Session refresh for Next.js middleware
│
├── middleware.ts                     Rate limiting + Supabase session refresh
├── next.config.ts                    Image remote patterns (ytimg, googleusercontent)
├── .env.example                      Template with placeholder values only
└── CLAUDE.md                         Project rules for Claude Code sessions
```

---

## 5. Design System

### Color System (CSS Variables)

All colors are defined as CSS variables in `globals.css` with both light and dark theme variants. **No hex values appear in component files.**

| Variable | Purpose |
|----------|---------|
| `--bg-app` | Page background (#f4f4f8 light, dark equiv) |
| `--bg-card` | Card background (#ffffff light) |
| `--bg-elevated` | Elevated elements (tooltips, dropdowns) |
| `--bg-sidebar` | Sidebar background |
| `--border` | Default border |
| `--border-subtle` | Dashed separators, chart grids |
| `--border-strong` | Emphasis borders |
| `--text-primary` | Headings, values |
| `--text-secondary` | Labels, descriptions |
| `--text-muted` | Placeholder, hint text |
| `--accent` | Brand color (indigo) |
| `--accent-subtle` | Accent background (badge bg) |
| `--accent-text` | Text on accent-subtle |
| `--green-text` / `--green-subtle` | Positive trend indicators |
| `--amber-text` / `--amber-subtle` | Warning / slowing |
| `--red-text` / `--red-subtle` / `--red` | Error states |
| `--chart-1` through `--chart-5` | Recharts series colors |

### Typography

| Variable | Font | Usage |
|----------|------|-------|
| `--font-display` | Plus Jakarta Sans (400–700) | Metric values, headings, bold numbers |
| `--font-body` | Inter (400–600) | Body text, labels, UI copy |

All large metric numbers use `font-variant-numeric: tabular-nums` to prevent layout shift.

### No Box Shadows

Cards use background contrast for depth — `--bg-app` (#f4f4f8) vs `--bg-card` (#ffffff). `box-shadow: none` on all card components. The only shadows are on interactive button insets.

### Animations

Only 7 animations exist in the system:
1. **Count-up** — `useCountUp` hook, 600ms easeOut, fires once on mount
2. **Sidebar collapse** — persisted via cookie, shadcn SidebarProvider
3. **Sort arrow flip** — `rotate-180 duration-150`
4. **Skeleton → content fade** — `fadeIn` keyframe, 200ms
5. **Trend badge pulse** — `badgePulse`, 300ms, no loop
6. **Nav active transition** — `transition-colors duration-150`
7. **Sheet/Drawer slide** — shadcn defaults, not overridden

All animations respect `prefers-reduced-motion`.

---

## 6. Backend — API Routes

### `GET /api/channel`

Resolves a YouTube channel URL to a full analysis.

**Query params:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `url` | string (URL) | Yes | Any YouTube channel URL format |
| `maxVideos` | 50 \| 100 \| 200 | No | Default: 50 |

**Validation:** `channelQuerySchema` (Zod) + hostname check (must include `youtube.com` or `youtu.be`)

**Flow:**
1. Validate query
2. Check hostname
3. `resolveChannelId(url)` → YouTube API → channelId
4. `getCachedChannelData(channelId, maxVideos)` → Next.js cache → YouTube API
5. `computeAllMetrics(rawVideos, channelInfo)` → computed Video[] + ChannelMetrics
6. Strip `uploadsPlaylistId` from response
7. Return `{ channel: ChannelInfo, videos: Video[], metrics: ChannelMetrics }`

**Error codes:** 400 (bad input), 403 (private/forbidden), 404 (not found), 503 (quota exceeded)

---

### `POST /api/insights`

Generates or retrieves AI insights for a channel. Streams new responses, returns JSON for cached.

**Body:** `insightsBodySchema`
```json
{
  "channelId": "UCxxxxxx",
  "channelTitle": "Channel Name",
  "subscriberCount": 1200000,
  "videos": [{ "id": "...", "title": "...", "viewCount": 0, "engagementRate": 0, "daysLive": 0, "duration": "PT4M30S" }],
  "metrics": { "avgViews": 0, "avgEngagementRate": 0, "momentumScore": 0, "momentumLabel": "Stable", "uploadFrequency": "3x / week" }
}
```

**Flow:**
1. Check `ANTHROPIC_API_KEY` present
2. Validate body (Zod)
3. Check Redis cache (`insights:{channelId}`)
   - **Hit:** Return `{ insights: AIInsights }` as `application/json`
   - **Miss:** Continue to stream
4. Build prompt with top 30 videos by views
5. Stream from `claude-sonnet-4-20250514` (max_tokens: 1024)
6. Return `ReadableStream` as `text/plain`
7. After stream completes, parse JSON and store in Redis (24hr TTL)

**Client detection:** `AIInsightsPanel` reads `Content-Type` header:
- `application/json` → display immediately
- `text/plain` → progressive streaming with `parsePartialInsights()`

**AI response shape:**
```json
{
  "whatIsWorking": "...",
  "uploadPattern": "...",
  "titleFormula": "...",
  "gapOpportunity": "...",
  "gapOpportunities": ["...", "...", "..."]
}
```

---

### `POST /api/compare`

Fetches 2–3 channels in parallel and generates an AI competitive comparison.

**Body:** `compareBodySchema`
```json
{
  "channelAUrl": "https://youtube.com/@channelA",
  "channelBUrl": "https://youtube.com/@channelB",
  "channelCUrl": "https://youtube.com/@channelC",  // optional
  "maxVideos": 50  // optional, default 50
}
```

**Flow:**
1. Check `ANTHROPIC_API_KEY` present
2. Validate body (Zod)
3. Resolve all channel IDs in parallel (`Promise.all`)
4. Fetch all channel data in parallel (`Promise.all` with `getCachedChannelData`)
5. Compute metrics for each channel
6. Generate AI comparison via `claude-sonnet-4-20250514` (max_tokens: 512, non-streaming)
7. Return `{ channelA, channelB, channelC?, aiComparison }`

**AI comparison shape:**
```json
{
  "whoIsWinning": "...",
  "channelStrengths": { "Channel A Title": "...", "Channel B Title": "..." },
  "gapOpportunity": "..."
}
```

---

## 7. Backend — YouTube Data Layer

**File:** `lib/youtube.ts`

YouTube API quota: 10,000 units/day. A full channel analysis costs **~3 units** (not 9 as for 200 videos — with default 50 videos, it's 1 + 1 + 1 = 3 units).

### URL Resolution (`resolveChannelId`)

Accepts any YouTube channel URL format. Cost per format:

| Input Format | Example | API Cost |
|-------------|---------|----------|
| `/channel/UCxxxxxx` | Direct ID in URL | 0 units |
| `/@handle` | `/@MrBeast` | 1 unit (forHandle) |
| `/c/customname` | `/c/TED` | 1 unit (forHandle) |
| `/user/username` | `/user/PewDiePie` | 1 unit (forUsername) |

**Never uses `search.list`** (100 units — would exhaust quota instantly).

### Client-side Input Normalization (`normalizeChannelInput`)

**File:** `lib/utils.ts`

Normalizes any user input to a full YouTube URL before sending to the API:

| User types | Normalized to |
|-----------|--------------|
| `@MrBeast` | `https://www.youtube.com/@MrBeast` |
| `MrBeast` | `https://www.youtube.com/@MrBeast` |
| `UCX6OQ3DkcsbYNE6H8uQQuVA` | `https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA` |
| `youtube.com/@channel` | `https://youtube.com/@channel` |
| `https://youtube.com/@channel` | unchanged |

### Data Fetching

```
fetchChannelInfo(channelId)     → 1 unit   (snippet + statistics + contentDetails + topicDetails)
fetchVideoIds(playlistId, 50)   → 1 unit   (playlistItems.list, 50/page)
fetchVideoDetails(videoIds[])   → 1 unit   (videos.list in batches of 50, parallel)
                                  ─────
Total for default 50 videos:      3 units
```

**Notes:**
- `subscriberCount` is rounded to 3 sig figs by YouTube — never display false precision
- `likeCount` / `commentCount` may be absent (hidden by creator) — always `?? '0'`
- `customUrl` (handle) may be empty for old channels — default to `''`
- Topic categories are Wikipedia URLs — parsed via `extractCategory()` into 13 niche buckets

---

## 8. Backend — AI Insights

**Model:** `claude-sonnet-4-20250514`

### Channel Insights (`/api/insights`)

- Prompt includes: channel title, subscriber count, upload frequency, avg views, engagement rate, momentum score, top 30 videos (title, views, engagement, days live, duration)
- Max tokens: 1024
- Streamed to client progressively
- Client parses partial JSON with `parsePartialInsights()` to reveal sections as they arrive
- Full result cached to Redis on stream completion

### Comparison Intelligence (`/api/compare`)

- Prompt includes: 2–3 channel summaries (subs, avg views, engagement, momentum, upload frequency)
- Max tokens: 512
- Non-streaming (sync response — much shorter)
- Returns structured JSON with `whoIsWinning`, per-channel `channelStrengths`, and `gapOpportunity`
- Not cached (comparison is computed fresh each time)

---

## 9. Backend — Caching Strategy

Two independent layers:

### Layer 1: YouTube Data — Next.js `unstable_cache`

- **TTL:** 1 hour
- **Key:** `channel-data-{channelId}-{maxVideos}`
- **Tag:** `channel-{channelId}`
- **Scope:** Server-side only (Next.js cache, survives across requests, resets on cold start)
- **Why:** Prevents re-fetching YouTube API on every page load for the same channel

### Layer 2: AI Insights — Upstash Redis

- **TTL:** 24 hours
- **Key:** `insights:{channelId}`
- **Scope:** Persistent across serverless cold starts (external Redis)
- **Why:** AI generation is expensive (~$0.003/request) and slow (2–5 seconds)

### Layer 3: Client-side Channel Cache — `ChannelCacheContext`

- **TTL:** Session (in-memory `Map` via `useRef`)
- **Key:** `channelId`
- **Scope:** Single browser session
- **Why:** Prevents re-fetching when switching between analysis tabs, compare page, watchlist

---

## 10. Backend — Rate Limiting

**File:** `middleware.ts`
**Provider:** Upstash Ratelimit (sliding window algorithm)

| Route | Limit | Window |
|-------|-------|--------|
| `/api/channel` | 200 requests | 1 hour |
| `/api/insights` | 100 requests | 1 hour |
| `/api/compare` | 100 requests | 1 hour |

Rate limiting keys by IP (`x-forwarded-for` header, first IP in chain).

**Graceful degradation:** If Redis is unreachable, rate limiting is skipped (fail open) with a console error. This prevents Redis outages from taking down the API.

**Development:** Rate limiting is bypassed when `NODE_ENV === 'development'`.

---

## 11. Backend — Auth (Supabase)

**Provider:** Supabase (Google OAuth)

### Flow
1. User clicks "Sign in" → `AuthModal` opens
2. `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: '/auth/callback' })`
3. Google OAuth → Supabase → redirect to `/auth/callback/route.ts`
4. Callback exchanges code for session → redirect to app
5. Session refreshed on every request via `middleware.ts` → `updateSession()`

### Auth-gated Features
- **Watchlist** — save/track channels
- **Saved Comparisons** — persist comparison results
- **Snapshots** — historical metric tracking via `lib/snapshots.ts`

### Implementation Notes
- `lib/supabase/server.ts` — Server Component client (cookies via `next/headers`)
- `lib/supabase/client.ts` — Browser client (singleton pattern)
- `lib/supabase/middleware.ts` — Session refresh, called on every request
- The empty `catch {}` in `server.ts` `setAll` is **intentional** — Server Components cannot set cookies; the session refresh happens in middleware

---

## 12. Frontend — Pages

### `/` — Landing Page
Hero section with search input. Accepts any YouTube URL format or `@handle` via `normalizeChannelInput`. Shows `RecentChannels` list below.

### `/analysis` — Analysis Root
Redirects to the last analyzed channel or shows empty state. Renders within the `analysis/layout.tsx` (no additional chrome beyond root layout).

### `/analysis/[channelId]` — Channel Analysis
- **Server:** `page.tsx` reads `channelId` from params, renders `AnalysisDashboard`
- **Client:** `AnalysisDashboard.tsx` fetches `/api/channel`, populates channel cache, adds to tabs and recent channels
- **Displays:** Channel header, metric cards (avg views, engagement, views/day, upload freq), momentum score + upload consistency, charts (views over time, engagement trend, performance distribution, duration vs views, upload frequency, best post time heatmap), AI insights panel, niche benchmark, content insights, video library table
- **Loading:** Full page skeleton matching real content dimensions

### `/analysis/compare` — Comparison Root
- Shows `CompareEmptyState` if no channel IDs in query params
- Shows `ComparePageContent` with live data if `?a=UCxxx&b=UCxxx` present

### `/analysis/compare/[compareId]` — Named Comparison
- Reads comparison tab from localStorage by ID
- Renders `ComparePageContent` with those channel IDs
- Updates tab metadata (name, channel avatars) after data loads

### `/comparisons` — Saved Comparisons
Auth-gated page showing saved comparisons (Supabase-persisted).

### `/watchlist` — Channel Watchlist
Auth-gated. Shows tracked channels with last analyzed momentum score and trend.

### `/settings` — User Settings
- Videos per channel: 50 / 100 / 200 (default: 50)
- Theme: Light / Dark / System

### `/report` — Shareable Report
Stateless URL-encoded channel report for sharing. Reconstructs channel data from URL params.

---

## 13. Frontend — Component Library

### Chart Components
All charts use `ChartContainer` from `@/components/ui/chart` (shadcn wrapper around Recharts).

- **Rule:** `chartConfig` defines all series colors using `var(--chart-N)` — never inline hex
- **CartesianGrid:** `strokeDasharray="3 3"`, `stroke="var(--border-subtle)"`, `vertical={false}`
- **Tooltips:** `ChartTooltip` + `ChartTooltipContent` or custom with CSS variables
- **Chart palette (compare page):** `['var(--accent)', 'var(--chart-5)', 'var(--chart-4)', 'var(--chart-2)']`

### MetricCard
Reusable stat card with:
- Count-up animation on first mount via `useCountUp(value, 600, mounted)`
- `formatNumber()` for all numeric values
- `tabular-nums` font feature
- Grid lines overlay (CSS `color-mix` + `mask-image` gradient)
- No trend badge (removed — per design decision)

### VideoTable
TanStack Table with:
- Sort by: Views, Engagement Rate, Views/Day, Days Live, Duration
- Filter by: Performance tier (hot/rising/average/underperforming)
- Click → opens `VideoDeepDive` (Sheet on desktop, Drawer on mobile)

### VideoDeepDive
- Desktop: `Sheet` (`side="right"`)
- Mobile: `Drawer` (bottom) — detected via `useIsMobile()` from shadcn sidebar utils
- Shows: thumbnail, title, stats, performance sentence (`buildPerformanceSentence` — computed client-side, no AI)

### AIInsightsPanel
Progressive streaming display:
- Skeleton cards shown immediately
- Sections reveal as streaming JSON is parsed (`parsePartialInsights`)
- Cache hit → instant display (no streaming)
- Error → retry button

---

## 14. Frontend — State Management

All state is client-side. No global store (no Redux/Zustand). Each concern has its own React Context.

### Context Providers (nested in `layout.tsx`)

| Context | Storage | Purpose |
|---------|---------|---------|
| `AuthContext` | Supabase session | Current user, sign in/out |
| `ChannelCacheContext` | `useRef<Map>` (memory) | Cache fetched channel data for instant tab switching |
| `RecentChannelsContext` | localStorage | Last 10 analyzed channels |
| `ReportsHistoryContext` | localStorage | Generated report history |
| `WatchlistContext` | Supabase | Auth-gated watchlist |
| `SavedComparisonsContext` | Supabase | Auth-gated saved comparisons |
| `SettingsContext` | localStorage | videosToFetch, theme |

### `ChannelCacheContext` — Key Design
Uses `useRef<Map>` (not `useState`) to avoid triggering re-renders when cache is populated. Exposes stable `get`/`set`/`has` functions via `useMemo`. This prevents the cascade of re-renders that caused the original comparison page data fetching bug.

---

## 15. Frontend — Channel Tab System

**File:** `lib/hooks/useChannelTabs.ts`

Manages persistent browser tabs for analyzed channels and comparisons.

### Tab Types

```typescript
interface ChannelTab {
  type: 'channel'
  id: string          // same as channelId
  channelId: string
  title: string
  handle: string
  thumbnailUrl: string
}

interface ComparisonTab {
  type: 'comparison'
  id: string          // UUID
  name: string        // e.g. "MrBeast vs PewDiePie"
  channels: { channelId, title, handle, thumbnailUrl }[]
}
```

### Storage
- localStorage key: `vidmetrics_tabs`
- Max 8 tabs (overflow removes oldest)
- Cross-tab sync via `window.dispatchEvent(new Event('vidmetrics_tabs_sync'))` + `storage` event

### Tab Bar (`components/layout/ChannelTabBar.tsx`)
- **Drag-drop reorder** via `@dnd-kit/core` (horizontal axis only)
- **Plus button** — opens `AddChannelPopover` (accepts @handle, bare name, or URL)
- **New Comparison button** — visible when 2+ channel tabs exist (appears to the right of the Plus button)
- **Pending tab skeleton** — shown when navigating to a channel before data loads

### URL Formats Supported in Tab Bar Input
See `normalizeChannelInput()` in `lib/utils.ts` — accepts `@handle`, bare name, full URL, channel ID.

---

## 16. Metrics Engine

**File:** `lib/metrics.ts` — Server-side only. Called by `/api/channel` and `/api/compare`.

### Per-Video Metrics

| Metric | Formula |
|--------|---------|
| `engagementRate` | `(likeCount + commentCount) / viewCount * 100` |
| `performanceTier` | hot (>1.5× median), rising (<14d + >0.8× median), average, underperforming (<0.5× median) |
| `daysLive` | `floor((now - publishedAt) / 86400000)`, min 1 |
| `viewsPerDay` | `viewCount / daysLive` |
| `durationSeconds` | parsed from ISO 8601 via `parseDurationSeconds()` |

### Channel-Level Metrics

| Metric | Method |
|--------|--------|
| `avgViews` | Mean view count across all videos |
| `medianViews` | Median view count (for performance tier baseline) |
| `avgEngagementRate` | Mean engagement rate |
| `avgViewsPerDay` | Mean views/day |
| `uploadFrequency` | Videos in last 90d ÷ 13 weeks → human label |
| `bestDayOfWeek` | Modal day from top 25% videos by views |
| `bestTimeOfDay` | Modal hour from top 25% videos (UTC) |

### Momentum Score (0–100)

Three-component score computed from the last 60 days of data:

| Component | Weight | Formula |
|-----------|--------|---------|
| Views growth | 40 pts | `clamp((last30d_views / prev30d_views - 1) * 100, -40, 40) + 40` |
| Upload pace | 30 pts | `clamp((last30d_count / prev30d_count) * 15, 0, 30)` |
| Engagement trend | 30 pts | `clamp((recent10_avg / prior10_avg - 1) * 100, -30, 30) + 30` |

**Labels:** 80–100 = Accelerating, 50–79 = Stable, 25–49 = Slowing, 0–24 = Dormant

### Upload Consistency

Standard deviation of gaps between consecutive uploads:
- ≤1.5 days std dev → Very consistent
- ≤4 days std dev → Somewhat consistent
- >4 days std dev → Irregular
- <6 videos → Insufficient data

### Niche Benchmarks (`lib/benchmarks.ts`)

13 categories with static benchmark data (engagement rate, views/video, upload frequency):
`gaming`, `music`, `news`, `education`, `tech`, `finance`, `lifestyle`, `fitness`, `food`, `travel`, `comedy`, `beauty`, `sports`, `default`

Categories are derived from YouTube's `topicCategories` field (Wikipedia URLs) via `extractCategory()` in `lib/youtube.ts`.

---

## 17. Data Types

**File:** `lib/types.ts`

```typescript
// From YouTube API (server only)
interface RawVideo {
  id, title, thumbnailUrl, publishedAt, duration,
  viewCount, likeCount, commentCount
}

// After metrics computation (sent to client)
interface Video extends RawVideo {
  engagementRate, performanceTier, daysLive, viewsPerDay, durationSeconds
}

// Channel metadata
interface ChannelInfo {
  id, title, handle, description, thumbnailUrl,
  subscriberCount, hiddenSubscriberCount, videoCount, viewCount,
  publishedAt, country?, category
}

// All channel-level computed metrics
interface ChannelMetrics {
  avgViews, avgEngagementRate, avgViewsPerDay, medianViews,
  uploadFrequency, bestDayOfWeek, bestTimeOfDay,
  momentumScore, momentumLabel,
  totalViewsLast30d, totalViewsPrev30d, viewsGrowthPct,
  uploadConsistency: { score, label, detail, stdDevDays },
  category
}

// AI insights (cached in Redis)
interface AIInsights {
  whatIsWorking, uploadPattern, titleFormula, gapOpportunity,
  gapOpportunities: string[]
}

// Supabase snapshot (auth-gated)
interface ChannelSnapshot {
  channelId, channelTitle, handle, thumbnailUrl,
  subscriberCount, totalViewCount, videoCount,
  avgViewsPerVideo, avgEngagementRate,
  momentumScore, momentumLabel, uploadFrequency,
  viewsLast30d, snapshottedAt
}
```

---

## 18. Environment Variables

**File:** `.env.local` (gitignored — never committed)

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `YOUTUBE_API_KEY` | Secret | Yes | YouTube Data API v3 key |
| `ANTHROPIC_API_KEY` | Secret | Yes | Anthropic API key (claude-sonnet-4) |
| `NEXT_PUBLIC_APP_URL` | Public | Yes | Production URL (e.g. `https://vidmetrics.vercel.app`) |
| `UPSTASH_REDIS_REST_URL` | Secret | Yes | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Secret | Yes | Upstash Redis auth token |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Yes | Supabase publishable (anon) key |

**Security rules:**
- `NEXT_PUBLIC_*` variables are safe to expose — they're meant to be public
- All other variables are server-only — never reference in `/components`, never in `NEXT_PUBLIC_` vars
- `.env.local` is in `.gitignore` and must never be committed
- `.env.example` contains only placeholder values — never real keys

---

## 19. Security Model

### Input Validation
- All API inputs validated with Zod schemas before use
- YouTube URL hostname checked server-side (must include `youtube.com` or `youtu.be`)
- Client-side `normalizeChannelInput()` normalizes but doesn't bypass server validation
- Max video count clamped to `[50, 100, 200]`

### API Key Protection
- YouTube, Anthropic, Upstash keys are **server-side only**
- Proxied through Route Handlers — client never sees keys
- `ANTHROPIC_API_KEY` presence checked at route start; returns 503 if missing

### Error Handling
- `withErrorHandler()` wraps all routes — catches all thrown errors
- Error messages are human-readable but never expose stack traces
- Consistent error shape: `{ error: string }` with appropriate HTTP status
- Status codes: 400 (bad input), 403 (private/forbidden), 404 (not found), 429 (rate limited), 500 (server error), 503 (service unavailable)

### AI Response Safety
- Claude responses stripped of markdown fences before JSON parsing
- Parse failures are caught and logged; fallback values used
- Parsed AI responses are strings only — displayed as text, never rendered as HTML

### Rate Limiting
- Sliding window rate limits via Upstash on all API routes
- Fail-open on Redis unreachability (logs error, allows request)
- IP-based limiting using `x-forwarded-for`

---

## 20. Deployment

**Platform:** Vercel

**Required setup:**
1. Add all environment variables from `.env.example` to Vercel project settings
2. Supabase: set OAuth callback URL to `{NEXT_PUBLIC_APP_URL}/auth/callback`
3. Upstash: create Redis database, copy REST URL and token
4. YouTube: create API key with YouTube Data API v3 enabled

**Build command:** `npm run build` (Next.js default)
**Output:** All routes are serverless functions (`ƒ Dynamic`)

**Image domains configured in `next.config.ts`:**
- `i.ytimg.com` — video thumbnails
- `yt3.googleusercontent.com` — channel avatars

---

*Generated from codebase state as of 2026-03-29. Update this file when architecture changes.*
