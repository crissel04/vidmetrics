'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChannelInfo, Video, ChannelMetrics } from '@/lib/types'
import { AnalysisPageBodySkeleton } from '@/components/analysis/AnalysisPageSkeleton'
import { ChannelAnalysisView } from '@/components/analysis/ChannelAnalysisView'
import { ChannelHeaderSkeleton } from '@/components/channel/ChannelHeaderSkeleton'
import { ShareButton } from '@/components/report/ShareButton'
import { useChannelTabs } from '@/lib/hooks/useChannelTabs'
import { useChannelCache } from '@/lib/context/ChannelCacheContext'
import { useRecentChannels } from '@/lib/context/RecentChannelsContext'
import { useWatchlist } from '@/lib/context/WatchlistContext'
import { useSettings } from '@/lib/context/SettingsContext'

interface ChannelData {
  channel: ChannelInfo
  videos: Video[]
  metrics: ChannelMetrics
}

export function AnalysisDashboard({ channelId }: { channelId: string }) {
  const channelCache = useChannelCache()
  const [data, setData] = useState<ChannelData | null>(() => channelCache.get(channelId) ?? null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(!channelCache.has(channelId))
  const { addTab } = useChannelTabs()
  const { addRecent } = useRecentChannels()
  const { updateLastAnalyzed } = useWatchlist()
  const { settings } = useSettings()

  // Stable refs to avoid re-triggering the effect from callback identity changes
  const channelCacheRef = useRef(channelCache)
  channelCacheRef.current = channelCache
  const addTabRef = useRef(addTab)
  addTabRef.current = addTab
  const addRecentRef = useRef(addRecent)
  addRecentRef.current = addRecent
  const updateLastAnalyzedRef = useRef(updateLastAnalyzed)
  updateLastAnalyzedRef.current = updateLastAnalyzed

  useEffect(() => {
    const cache = channelCacheRef.current
    if (cache.has(channelId)) {
      const cached = cache.get(channelId)!
      setData(cached)
      setLoading(false)
      setError('')

      addRecentRef.current({
        channelId: cached.channel.id,
        title: cached.channel.title,
        handle: cached.channel.handle,
        thumbnailUrl: cached.channel.thumbnailUrl,
        subscriberCount: cached.channel.subscriberCount,
        analyzedAt: new Date().toISOString(),
      })
      addTabRef.current({
        channelId: cached.channel.id,
        title: cached.channel.title,
        handle: cached.channel.handle,
        thumbnailUrl: cached.channel.thumbnailUrl,
      })
      updateLastAnalyzedRef.current(
        cached.channel.id,
        cached.metrics.momentumScore,
        cached.metrics.momentumLabel
      )
      return
    }

    setLoading(true)
    setError('')

    let cancelled = false
    async function fetchData() {
      try {
        const res = await fetch(
          `/api/channel?url=${encodeURIComponent(`https://www.youtube.com/channel/${channelId}`)}&maxVideos=${settings.videosToFetch}`
        )
        if (cancelled) return
        const json = await res.json()
        if (cancelled) return

        if (!res.ok) {
          setError(json.error || 'Failed to load channel data')
          setLoading(false)
          return
        }

        channelCacheRef.current.set(channelId, json)
        setData(json)
        setLoading(false)

        addRecentRef.current({
          channelId: json.channel.id,
          title: json.channel.title,
          handle: json.channel.handle,
          thumbnailUrl: json.channel.thumbnailUrl,
          subscriberCount: json.channel.subscriberCount,
          analyzedAt: new Date().toISOString(),
        })

        addTabRef.current({
          channelId: json.channel.id,
          title: json.channel.title,
          handle: json.channel.handle,
          thumbnailUrl: json.channel.thumbnailUrl,
        })

        updateLastAnalyzedRef.current(
          json.channel.id,
          json.metrics.momentumScore,
          json.metrics.momentumLabel
        )
      } catch {
        if (!cancelled) {
          setError('Network error — please try again')
          setLoading(false)
        }
      }
    }
    fetchData()
    return () => { cancelled = true }
    // Only re-fetch when channelId or videosToFetch changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, settings.videosToFetch])

  const metrics = data?.metrics ?? null

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p style={{ color: 'var(--red-text)' }}>{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ background: 'var(--accent)', color: '#ffffff' }}
        >
          Try again
        </button>
      </div>
    )
  }

  if (loading || !data || !metrics) {
    return (
      <div className="flex flex-col gap-8" aria-busy="true">
        <ChannelHeaderSkeleton />
        <AnalysisPageBodySkeleton />
      </div>
    )
  }

  const { channel, videos } = data

  return (
    <ChannelAnalysisView
      channel={channel}
      videos={videos}
      metrics={metrics}
      shareButton={<ShareButton channelId={channel.id} />}
    />
  )
}
