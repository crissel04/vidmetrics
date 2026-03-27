'use client'

import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { encodeReportData } from '@/lib/shareLink'
import type { ChannelInfo, Video, ChannelMetrics } from '@/lib/types'

interface ShareButtonProps {
  channel: ChannelInfo
  videos: Video[]
  metrics: ChannelMetrics
}

export function ShareButton({ channel, videos, metrics }: ShareButtonProps) {
  const handleShare = async () => {
    const reportData = {
      channel,
      videos,
      metrics,
      generatedAt: new Date().toISOString(),
    }
    const encoded = encodeReportData(reportData)
    const reportUrl = `${window.location.origin}/report?data=${encoded}`
    console.log('[ShareButton] Report URL:', reportUrl)
    await navigator.clipboard.writeText(reportUrl)
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
