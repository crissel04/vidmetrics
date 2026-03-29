import { updateSession } from '@/lib/supabase/middleware'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

// Lazily initialized — only created when env vars are present and the first request arrives.
// Module-level instantiation crashes Vercel Edge Runtime when env vars are absent.
let channelRatelimit: Ratelimit | null = null
let insightsRatelimit: Ratelimit | null = null

function getRatelimits(): { channel: Ratelimit; insights: Ratelimit } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  if (!channelRatelimit || !insightsRatelimit) {
    const redis = new Redis({ url, token })
    channelRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, '1 h'),
      prefix: 'ratelimit:channel',
    })
    insightsRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(500, '1 h'),
      prefix: 'ratelimit:insights',
    })
  }

  return { channel: channelRatelimit, insights: insightsRatelimit }
}

export async function middleware(request: NextRequest) {
  // Refresh Supabase auth session on every request.
  // Guard with try/catch so missing Supabase env vars don't crash the middleware.
  let response: NextResponse
  try {
    response = await updateSession(request)
  } catch (err) {
    console.error('[middleware] Supabase session update failed:', err)
    response = NextResponse.next({ request })
  }

  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return response
  }

  const limits = getRatelimits()
  if (!limits) return response

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const path = request.nextUrl.pathname

  try {
    if (path.startsWith('/api/channel')) {
      const { success } = await limits.channel.limit(ip)
      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait before analyzing another channel.' },
          { status: 429 }
        )
      }
    }

    if (path.startsWith('/api/insights') || path.startsWith('/api/compare')) {
      const { success } = await limits.insights.limit(ip)
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
