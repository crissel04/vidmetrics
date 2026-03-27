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
    const json = JSON.stringify(reportData)
    console.log('[ShareButton] JSON length:', json.length)
    const encoded = encodeReportData(reportData)
    console.log('[ShareButton] Compressed length:', encoded.length)
    const reportUrl = `${window.location.origin}/report?data=${encoded}`
    console.log('[ShareButton] Full URL length:', reportUrl.length)
    console.log('[ShareButton] URL preview:', reportUrl.substring(0, 100) + '...')
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
