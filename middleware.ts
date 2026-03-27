import { updateSession } from '@/lib/supabase/middleware'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

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
  // Refresh Supabase auth session on every request
  const response = await updateSession(request)

  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return response
  }

  // Skip rate limiting when Upstash credentials are missing
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return response
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

    if (path.startsWith('/api/insights') || path.startsWith('/api/compare')) {
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

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
