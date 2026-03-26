# VidMetrics — Claude Code Rules

This file is read automatically at the start of every session.
Follow every rule here without exception. These override any intuition
about "normal" Next.js patterns when they conflict.

---

## 🔴 Non-negotiable rules

### Git
- Commit after EVERY step using the exact message in the PRD. No batching. No skipping.
- Never commit broken code. `npm run build` must not fail at the time of commit.
- `.env.local` must never be committed. Verify it is in `.gitignore` before every push.

### API keys — this is a PUBLIC repo, treat it accordingly
- YOUTUBE_API_KEY, ANTHROPIC_API_KEY, UPSTASH_REDIS_REST_URL, and UPSTASH_REDIS_REST_TOKEN are server-side only.
- Never reference them in any file inside `/components`, never in any `NEXT_PUBLIC_` var.
- If a value needs to reach the client, proxy it through a Route Handler.
- `.env.local` must never be committed under any circumstances. It must be in `.gitignore`.
- `.env.example` must contain ONLY placeholder text — never a real key value, not even partially. The correct format is:
  ```
  YOUTUBE_API_KEY=your_youtube_data_api_v3_key
  ANTHROPIC_API_KEY=your_anthropic_api_key
  NEXT_PUBLIC_APP_URL=https://your-vercel-url.vercel.app
  UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
  UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
  ```
- Never hardcode any key value or token string anywhere in source code, including in comments.
- Before every `git push`, run this scan — if it returns any output, do NOT push:
  ```bash
  git diff HEAD --cached | grep -i "AIza\|sk-ant\|upstash\|redis.*token"
  git log --all -p | grep -i "AIza\|sk-ant" | head -5
  ```
- The only environment variable that is safe to expose publicly is `NEXT_PUBLIC_APP_URL` — it is just a URL, not a secret.

### No hardcoded colors — ever
- Every color in every component must use a CSS variable: `var(--accent)`, `var(--border)`, etc.
- Never write a hex value (`#6366f1`) or rgb/hsl directly in a component file.
- Tailwind classes that use CSS variables are fine: `bg-[var(--bg-card)]`.
- Recharts colors must come from `chartConfig` using `var(--chart-1)` etc., never inline hex.

### No box shadows — ever
- `box-shadow: none` on all cards. No `shadow-sm`, `shadow-md`, or any Tailwind shadow class.
- Depth is achieved through background color contrast: `--bg-app` (#f4f4f8) vs `--bg-card` (#ffffff).
- The only exception: `PopoverContent` gets `shadow-none` explicitly to override shadcn's default.

### Always use shadcn components
- Never build a custom modal — use `Dialog`.
- Never build a custom dropdown — use `DropdownMenu` or `Select`.
- Never build a custom side panel — use `Sheet` (desktop) / `Drawer` (mobile).
- Never build a custom tooltip — use `Tooltip`.
- Never build a custom popover — use `Popover`.
- Never build a custom table — use shadcn `Table` + TanStack Table.
- Never build a custom sidebar — use the full shadcn Sidebar system.
- If shadcn has it, use it. Check before building anything from scratch.

---

## 🟡 Architecture rules

### Route Handlers, not Server Actions
- All external API calls (YouTube, Anthropic, Upstash) go in `app/api/*/route.ts`.
- Server Actions are for form mutations. VidMetrics has no form mutations.
- Client components fetch via `fetch('/api/...')`, never call lib functions directly.

### Every Route Handler must:
1. Validate input with `validateQuery` or parse + `safeParse` from `lib/schemas.ts`
2. Be wrapped in `withErrorHandler` from `lib/api.ts`
3. Return `{ error: string }` on failures with the correct HTTP status code
4. Never expose raw error messages or stack traces to the client

### Caching — two layers, know which is which
- **YouTube data** → `unstable_cache` from `next/cache`, 1-hour TTL, key includes channelId
- **AI insights** → Upstash Redis via `lib/cache.ts`, 24-hour TTL, key = `insights:{channelId}`
- Never use `unstable_cache` for AI insights (wrong layer — won't survive serverless cold starts)
- Never use Redis for YouTube data (unnecessary — `unstable_cache` handles it)

### `'use client'` boundary
- Default to Server Components. Add `'use client'` only when the component uses:
  - `useState`, `useEffect`, `useRef`, or any other hook
  - Browser APIs (`localStorage`, `navigator.clipboard`, `window`)
  - Event handlers that need client-side interactivity
  - Recharts (all chart components must be client)
- Do NOT add `'use client'` to components that only receive and display props.

---

## 🟡 YouTube API rules

```
channels.list    → 1 unit  ✅ use freely
playlistItems.list → 1 unit  ✅ use for video IDs
videos.list      → 1 unit  ✅ batch up to 50 IDs per call
search.list      → 100 units ❌ NEVER USE — will exhaust quota instantly
```

- Full channel analysis costs ~3 units total. Daily quota: 10,000 units.
- All statistics fields (`viewCount`, `subscriberCount`, `likeCount`, `commentCount`) are
  **returned as strings** by the API. Always `parseInt(value ?? '0', 10)`.
- `likeCount` and `commentCount` may be **completely absent** (not just '0') if the creator
  has hidden them. Always use `?? '0'` — never assume the field exists.
- `subscriberCount` is rounded to 3 significant figures by YouTube. Never display false precision.
- `customUrl` (handle) may be empty for old channels. Default to empty string.
- Resolve `@handle` and `/c/` URLs via `channels.list?forHandle=`. Cost: 1 unit.
- Resolve `/user/` URLs via `channels.list?forUsername=`. Cost: 1 unit.
- Extract `/channel/UC...` IDs directly from the URL. Cost: 0 units.

---

## 🟡 AI insights streaming rules

- Fresh requests → `anthropic.messages.stream` → return `ReadableStream` (`text/plain`)
- Cached requests (Redis hit) → return plain `NextResponse.json` (`application/json`)
- The `AIInsightsPanel` client checks `Content-Type` header to determine which path to take
- Never stream a cached response — pointless latency
- Parse the streamed text progressively with `parsePartialInsights` to reveal sections as they arrive
- Cache the full parsed JSON to Redis only after the stream completes successfully
- If JSON parse fails after stream ends → do not cache, show retry button

---

## 🟡 Component conventions

### Numbers
- Always format via `formatNumber` from `lib/utils.ts` — never raw `.toLocaleString()` or manual formatting
- All numbers in metric cards and tables: `font-variant-numeric: tabular-nums`
- Large metric numbers: `font-display` (Plus Jakarta Sans), weight 700

### Metric cards
- Use `useCountUp` hook for the animated number on first data load
- `enabled` prop must be `false` during SSR and on re-renders — count-up fires once only
- Trend badge gets `badge-pulse` className — single pulse, never `animation: infinite`

### Skeletons
- Every async section gets a `Skeleton` that matches the **exact dimensions** of the loaded content
- Apply `fade-in` className to the outermost element when content replaces a skeleton
- Never show a spinner. Always show a skeleton that looks like the real content.

### VideoDeepDive
- Desktop: shadcn `Sheet` with `side="right"`
- Mobile: shadcn `Drawer` (bottom sheet) — detect via `useIsMobile()` from sidebar utils
- Do not override Sheet or Drawer's default slide animation
- The Section 4 "performance one-liner" is **computed client-side** using `buildPerformanceSentence` — no AI call, no latency. It derives from `contentSignals` (title has number/question, duration bucket, optimal day) and the outperformance ratio vs channel average. See Feature 16 in the PRD for the exact implementation.

### Charts
- Always use `ChartContainer` from `@/components/ui/chart` — never raw Recharts
- `chartConfig` defines all colors using CSS variable references
- All chart components must have `'use client'` at the top
- CartesianGrid: `strokeDasharray="3 3"`, `stroke="var(--border-subtle)"`, `vertical={false}`
- Tooltips: always `ChartTooltip` + `ChartTooltipContent` — never custom tooltip components

### Sidebar
- Never rebuild the sidebar. Use the full shadcn Sidebar system.
- `SidebarProvider` in `layout.tsx` with `defaultOpen` from server-side cookie
- `SidebarRail` must be present — it enables click-to-collapse
- Active item: `isActive` prop on `SidebarMenuButton`, not manual className

### Animations — the complete list (nothing else)
1. Metric card count-up (useCountUp, 600ms easeOut, fires once)
2. Sidebar collapse persisted via cookie (SidebarProvider defaultOpen)
3. Sort arrow flip (rotate-180, duration-150)
4. Skeleton → content fade-in (fadeIn keyframe, 200ms)
5. Trend badge single pulse (badgePulse, 300ms, no loop)
6. Sidebar nav active transition (transition-colors duration-150)
7. Sheet/Drawer default animations (do not override)

Do not add any other animations. No page transitions. No scroll-triggered effects.
All animations must be wrapped in `prefers-reduced-motion` override in globals.css.

---

## 🟢 Helpful reminders

### next.config.js — required for images
```js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'i.ytimg.com' },
    { protocol: 'https', hostname: 'yt3.googleusercontent.com' },
  ]
}
```
Without this, every YouTube thumbnail and avatar throws a runtime error.

### ThemeProvider — critical attribute
```tsx
<ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem>
```
`attribute="data-theme"` is required. Without it, `[data-theme="dark"]` in globals.css
will never activate and dark mode will silently do nothing.

### dark mode check
When adding a new component, ask: does it work in dark mode?
Every color must use a CSS variable. Test by toggling the theme toggle.

### Zod schemas live in `lib/schemas.ts`
- `channelQuerySchema` — for GET /api/channel
- `insightsBodySchema` — for POST /api/insights (includes channelId for Redis key)
- `compareBodySchema` — for POST /api/compare
Do not define schemas inline in route files.

### The uploads playlist shortcut
The uploads playlist ID is always the channel ID with `UC` replaced by `UU`.
It is also returned from `channels.list` as `contentDetails.relatedPlaylists.uploads`.
Use the API value — do not derive it manually.

### Error response shape
All errors: `{ error: string }` — human-readable, safe to show in the UI.
Status codes: 400 (bad input), 404 (not found), 403 (private), 429 (rate limited),
500 (server error), 503 (YouTube quota exceeded).

### Sonner toasts
`toast()` from sonner is already set up in layout.tsx via `<Toaster />`.
Use it for: link copied, export started, analysis failed, rate limit hit.
Never build a custom notification component.

---

## Files that must exist before any feature work begins

- `next.config.js` — image remotePatterns
- `app/globals.css` — all CSS variables, keyframes, shadcn overrides
- `middleware.ts` — Upstash rate limiting
- `lib/types.ts` — all TypeScript interfaces
- `lib/api.ts` — createErrorResponse, validateQuery, withErrorHandler
- `lib/schemas.ts` — all Zod schemas
- `lib/cache.ts` — Upstash Redis helpers
- `lib/hooks/useCountUp.ts` — count-up hook

These are all built in Steps 1–9. Do not skip ahead to feature work until all exist.