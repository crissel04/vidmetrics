# VidMetrics

<!-- Screenshot placeholder -->
<!-- ![VidMetrics Dashboard](./docs/screenshot.png) -->

**YouTube competitor intelligence for creators and agencies.** Paste any channel URL. Get instant performance metrics, AI-powered insights, and content gap analysis.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![Claude AI](https://img.shields.io/badge/Claude-AI-7c3aed?logo=anthropic)

## Features

1. **Channel Analysis** - Full performance breakdown from any YouTube channel URL
2. **Momentum Score** - 0-100 composite score measuring channel trajectory
3. **AI Insights** - Streaming analysis of content patterns, title formulas, and upload strategy (powered by Claude)
4. **Content Gap Detection** - AI-identified opportunities the channel hasn't covered
5. **Niche Benchmarking** - Compare metrics against category averages
6. **Channel Comparison** - Head-to-head analysis of two channels with AI summary
7. **Shareable Reports** - Generate compressed report links with all data embedded
8. **Publishing Heatmap** - 7x24 grid showing best posting times by performance
9. **Video Deep Dive** - Slide-in panel with velocity curves, content signals, and performance analysis
10. **Video Table** - Sortable, filterable, searchable table with all video metrics
11. **Engagement Charts** - Views over time and engagement rate trends with Recharts
12. **Duration Insights** - Optimal video length analysis
13. **Top Takeaways** - Computed insights (no AI needed, instant)
14. **Upload Consistency** - Schedule regularity analysis with day-of-week dot grid
15. **CSV Export** - Download all video data as a spreadsheet
16. **Recent Channels** - localStorage history with demo pre-seeding
17. **Dark/Light Mode** - Full theme support via CSS custom properties
18. **Thumbnail Popover** - Hover over video titles to preview thumbnails
19. **Copy Handle** - One-click copy of channel handles

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### 1. Clone and install

```bash
git clone https://github.com/your-username/vidmetrics.git
cd vidmetrics
npm install
```

### 2. Environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Where to get it |
|---|---|
| `YOUTUBE_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) - Enable "YouTube Data API v3" |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/) |
| `UPSTASH_REDIS_REST_URL` | [upstash.com](https://upstash.com/) - Create a free Redis database |
| `UPSTASH_REDIS_REST_TOKEN` | Same Upstash dashboard |
| `NEXT_PUBLIC_APP_URL` | Your deployed URL (e.g. `https://your-app.vercel.app`) |

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/vidmetrics&env=YOUTUBE_API_KEY,ANTHROPIC_API_KEY,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,NEXT_PUBLIC_APP_URL)

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS 4 + CSS custom properties
- **Components**: shadcn/ui
- **Charts**: Recharts via shadcn ChartContainer
- **Tables**: TanStack Table
- **AI**: Anthropic Claude (streaming insights)
- **Caching**: Upstash Redis (AI insights) + Next.js unstable_cache (YouTube data)
- **Rate Limiting**: Upstash Ratelimit (edge middleware)
- **Compression**: lz-string (shareable report URLs)

## API Quota

YouTube Data API v3 quota: 10,000 units/day. Each channel analysis costs ~3 units. This means ~3,300 analyses per day on the free tier.

## License

MIT
