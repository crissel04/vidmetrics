'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (channelCache.has(channelId)) {
      const cached = channelCache.get(channelId)!
      setData(cached)
      setLoading(false)
      setError('')

      addRecent({
        channelId: cached.channel.id,
        title: cached.channel.title,
        handle: cached.channel.handle,
        thumbnailUrl: cached.channel.thumbnailUrl,
        subscriberCount: cached.channel.subscriberCount,
        analyzedAt: new Date().toISOString(),
      })
      addTab({
        channelId: cached.channel.id,
        title: cached.channel.title,
        handle: cached.channel.handle,
        thumbnailUrl: cached.channel.thumbnailUrl,
      })
      updateLastAnalyzed(
        cached.channel.id,
        cached.metrics.momentumScore,
        cached.metrics.momentumLabel
      )
      return
    }

    setLoading(true)
    setError('')

    async function fetchData() {
      try {
        const res = await fetch(
          `/api/channel?url=${encodeURIComponent(`https://www.youtube.com/channel/${channelId}`)}&maxVideos=${settings.videosToFetch}`
        )
        const json = await res.json()

        if (!res.ok) {
          setError(json.error || 'Failed to load channel data')
          setLoading(false)
          return
        }

        channelCache.set(channelId, json)
        setData(json)
        setLoading(false)

        addRecent({
          channelId: json.channel.id,
          title: json.channel.title,
          handle: json.channel.handle,
          thumbnailUrl: json.channel.thumbnailUrl,
          subscriberCount: json.channel.subscriberCount,
          analyzedAt: new Date().toISOString(),
        })

        addTab({
          channelId: json.channel.id,
          title: json.channel.title,
          handle: json.channel.handle,
          thumbnailUrl: json.channel.thumbnailUrl,
        })

        updateLastAnalyzed(
          json.channel.id,
          json.metrics.momentumScore,
          json.metrics.momentumLabel
        )
      } catch {
        setError('Network error — please try again')
        setLoading(false)
      }
    }
    fetchData()
  }, [channelId, addTab, channelCache, addRecent, updateLastAnalyzed, settings.videosToFetch])

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
