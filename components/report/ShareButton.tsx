'use client'

import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ShareButtonProps {
  channelId: string
}

export function ShareButton({ channelId }: ShareButtonProps) {
  const handleShare = async () => {
    if (!channelId) {
      toast.error('No channel loaded')
      return
    }

    const url = `${window.location.origin}/report?channelId=${channelId}`
    await navigator.clipboard.writeText(url)
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
