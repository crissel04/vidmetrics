'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSavedComparisons, type SavedComparison } from '@/lib/context/SavedComparisonsContext'
import { useChannelTabs } from '@/lib/hooks/useChannelTabs'
import { useAuth } from '@/lib/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { GitCompare, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import AuthModal from '@/components/auth/AuthModal'

export default function ComparisonsPage() {
  const { user } = useAuth()
  const { comparisons, loading, deleteComparison, markViewed } =
    useSavedComparisons()
  const { addTab } = useChannelTabs()
  const router = useRouter()
  const [authOpen, setAuthOpen] = useState(false)

  const handleOpen = async (comparison: SavedComparison) => {
    comparison.channelIds.forEach((id, i) => {
      addTab({
        channelId: id,
        title: comparison.channelTitles[i],
        handle: comparison.channelHandles[i],
        thumbnailUrl: comparison.thumbnailUrls[i],
      })
    })
    await markViewed(comparison.id)
    const params = new URLSearchParams()
    if (comparison.channelIds[0]) params.set('a', comparison.channelIds[0])
    if (comparison.channelIds[1]) params.set('b', comparison.channelIds[1])
    if (comparison.channelIds[2]) params.set('c', comparison.channelIds[2])
    router.push(`/analysis/compare?${params.toString()}`)
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-8 text-center fade-in">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-app)' }}
        >
          <GitCompare size={24} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div className="space-y-1">
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
            Sign in to save comparisons
          </p>
          <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
            Build multi-channel comparisons and save them to revisit anytime.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setAuthOpen(true)}
          style={{ borderColor: 'var(--border)' }}
        >
          Sign in
        </Button>
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1280px] space-y-4 px-6">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-[100px] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (comparisons.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-8 text-center fade-in">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-app)' }}
        >
          <GitCompare size={24} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div className="space-y-1">
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
            No saved comparisons
          </p>
          <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
            Open the Compare page, select channels, and click
            &ldquo;Save comparison&rdquo; to save it here.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/analysis/compare')}
          style={{ borderColor: 'var(--border)' }}
        >
          Start a comparison
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-4 px-6 fade-in">
      <div>
        <h1
          className="font-semibold text-xl"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Saved comparisons
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {comparisons.length} saved
        </p>
      </div>

      <div className="space-y-3">
        {comparisons.map(comparison => (
          <Card
            key={comparison.id}
            className="cursor-pointer transition-colors shadow-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
            onClick={() => handleOpen(comparison)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2 shrink-0">
                  {comparison.thumbnailUrls.slice(0, 3).map((url, i) => (
                    <Avatar
                      key={i}
                      className="h-9 w-9 border-2"
                      style={{ borderColor: 'var(--bg-card)' }}
                    >
                      <AvatarImage
                        src={url}
                        alt={comparison.channelTitles[i]}
                      />
                      <AvatarFallback
                        className="text-xs"
                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
                      >
                        {comparison.channelTitles[i]?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="font-medium text-sm truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {comparison.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {comparison.channelHandles.join(' \u00b7 ')}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {comparison.lastViewedAt
                      ? `Viewed ${formatDistanceToNow(
                          new Date(comparison.lastViewedAt),
                          { addSuffix: true }
                        )}`
                      : `Saved ${formatDistanceToNow(
                          new Date(comparison.createdAt),
                          { addSuffix: true }
                        )}`
                    }
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    style={{ color: 'var(--text-muted)' }}
                    onClick={e => {
                      e.stopPropagation()
                      deleteComparison(comparison.id)
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red-text)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
