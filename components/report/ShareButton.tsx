'use client'

import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useChannelCache } from '@/lib/context/ChannelCacheContext'
import { useReportsHistory } from '@/lib/context/ReportsHistoryContext'

interface ShareButtonProps {
  channelId: string
}

export function ShareButton({ channelId }: ShareButtonProps) {
  const cache = useChannelCache()
  const { addReport } = useReportsHistory()

  const handleShare = async () => {
    if (!channelId) {
      toast.error('No channel loaded')
      return
    }

    const url = `${window.location.origin}/report?channelId=${channelId}`
    await navigator.clipboard.writeText(url)

    const cached = cache.get(channelId)
    if (cached) {
      addReport({
        channelId,
        channelTitle: cached.channel.title,
        handle: cached.channel.handle,
        thumbnailUrl: cached.channel.thumbnailUrl,
        subscriberCount: cached.channel.subscriberCount,
        sharedAt: new Date().toISOString(),
      })
    }

    toast('Report link copied to clipboard')
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="gap-1.5"
      style={{ borderColor: 'var(--border)' }}
    >
      <Share2 size={14} />
      Share
    </Button>
  )
}
