import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Channel analysis: 200 requests per hour per IP
const channelRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(200, '1 h'),
  prefix: 'ratelimit:channel',
})

// AI insights: 100 requests per hour per IP
const insightsRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'),
  prefix: 'ratelimit:insights',
})

export async function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
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
  matcher: ['/api/channel/:path*', '/api/insights/:path*', '/api/compare/:path*'],
}
