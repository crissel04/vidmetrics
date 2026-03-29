'use client'

import { useParams } from 'next/navigation'
import { useChannelTabs } from '@/lib/hooks/useChannelTabs'
import { ComparePageContent } from '../page'

export default function CompareTabPage() {
  const params = useParams()
  const compareId = params.compareId as string
  const { comparisonTabs } = useChannelTabs()

  const tab = comparisonTabs.find(t => t.id === compareId)
  const channelIds = tab?.channels.map(ch => ch.channelId) ?? []

  return (
    <ComparePageContent
      channelIds={channelIds}
      compareTabId={compareId}
    />
  )
}
