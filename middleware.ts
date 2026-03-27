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
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  // Skip rate limiting when Upstash credentials are missing
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return NextResponse.next()
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const path = request.nextUrl.pathname

  try {
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
  } catch (err) {
    // If Redis is unreachable, allow the request through rather than blocking
    console.error('[middleware] Rate limit check failed:', err)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/channel/:path*', '/api/insights/:path*', '/api/compare/:path*'],
}
