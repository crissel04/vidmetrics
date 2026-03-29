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
import { GitCompare, Trash2, ArrowRight, LayoutGrid, List } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import AuthModal from '@/components/auth/AuthModal'

export default function ComparisonsPage() {
  const { user } = useAuth()
  const { comparisons, loading, deleteComparison, markViewed } =
    useSavedComparisons()
  const { addTab, addComparisonTab } = useChannelTabs()
  const router = useRouter()
  const [authOpen, setAuthOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list')

  const handleOpen = async (comparison: SavedComparison) => {
    // Also add individual channel tabs
    comparison.channelIds.forEach((id, i) => {
      addTab({
        channelId: id,
        title: comparison.channelTitles[i],
        handle: comparison.channelHandles[i],
        thumbnailUrl: comparison.thumbnailUrls[i],
      })
    })
    // Create a comparison tab and navigate to it
    const compareId = crypto.randomUUID()
    addComparisonTab({
      id: compareId,
      name: comparison.name,
      channels: comparison.channelIds.map((id, i) => ({
        channelId: id,
        title: comparison.channelTitles[i],
        handle: comparison.channelHandles[i],
        thumbnailUrl: comparison.thumbnailUrls[i],
      })),
    })
    await markViewed(comparison.id)
    router.push(`/analysis/compare/${compareId}`)
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 py-8 text-center fade-in sm:px-6">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-app)' }}
        >
          <GitCompare size={24} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div className="space-y-1.5">
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Sign in to save comparisons
          </h2>
          <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
            Build multi-channel comparisons and save them to revisit anytime.
          </p>
        </div>
        <Button
          onClick={() => setAuthOpen(true)}
          className="mt-2 h-10 cursor-pointer gap-1.5 px-4 text-sm font-medium border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.2)] transition-shadow duration-300 ease-out hover:shadow-[inset_0_2px_14px_rgba(255,255,255,0.18),inset_0_-3px_16px_rgba(0,0,0,0.22)]"
          style={{ background: 'var(--accent)', color: '#ffffff' }}
        >
          Sign in
          <ArrowRight size={14} className="shrink-0" aria-hidden />
        </Button>
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1280px] space-y-4 px-4 sm:px-6">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-[100px] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (comparisons.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 py-8 text-center fade-in sm:px-6">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-app)' }}
        >
          <GitCompare size={24} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div className="space-y-1.5">
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            No saved comparisons
          </h2>
          <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
            Open the Compare page, select channels, and click
            &ldquo;Save comparison&rdquo; to save it here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 pt-2 sm:px-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-semibold text-2xl"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Saved comparisons
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {comparisons.length} saved comparison{comparisons.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div
          className="flex items-center rounded-lg border p-0.5"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            onClick={() => setViewMode('card')}
            className="rounded-md p-1.5 transition-colors"
            style={{
              background: viewMode === 'card' ? 'var(--bg-app)' : 'transparent',
              color: viewMode === 'card' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="rounded-md p-1.5 transition-colors"
            style={{
              background: viewMode === 'list' ? 'var(--bg-app)' : 'transparent',
              color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      <div className={viewMode === 'card' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
        {comparisons.map(comparison => {
          const timeLabel = comparison.lastViewedAt
            ? `Viewed ${formatDistanceToNow(new Date(comparison.lastViewedAt), { addSuffix: true })}`
            : `Saved ${formatDistanceToNow(new Date(comparison.createdAt), { addSuffix: true })}`

          const gridLine = 'color-mix(in srgb, var(--border-strong) 32%, transparent)'

          if (viewMode === 'card') {
            return (
              <Card
                key={comparison.id}
                className="relative cursor-pointer overflow-hidden transition-colors shadow-none"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
                onClick={() => handleOpen(comparison)}
              >
                {/* Grid lines */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-[inherit]"
                  aria-hidden
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, ${gridLine} 1px, transparent 1px),
                      linear-gradient(to bottom, ${gridLine} 1px, transparent 1px)
                    `,
                    backgroundSize: '24px 24px',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black)',
                    maskImage: 'linear-gradient(to bottom, transparent, black)',
                  }}
                />
                <CardContent className="relative z-[1] flex h-full flex-col p-4 space-y-3">
                  {/* Top row: avatars + delete */}
                  <div className="flex items-start justify-between">
                    <div className="flex -space-x-2">
                      {comparison.thumbnailUrls.slice(0, 3).map((url, i) => (
                        <Avatar
                          key={i}
                          className="h-9 w-9 border-2"
                          style={{ borderColor: 'var(--bg-card)' }}
                        >
                          <AvatarImage src={url} alt={comparison.channelTitles[i]} />
                          <AvatarFallback
                            className="text-xs"
                            style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
                          >
                            {comparison.channelTitles[i]?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteComparison(comparison.id) }}
                      className="shrink-0 p-1 rounded transition-colors duration-150"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red-text)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div>
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {comparison.name}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                      {comparison.channelHandles.join(' \u00b7 ')}
                    </p>
                  </div>

                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeLabel}</span>

                  {/* Spacer pushes button to bottom */}
                  <div className="flex-1" />

                  {/* Open comparison button */}
                  <div className="pt-1">
                    <span
                      className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.2)] transition-shadow duration-300 ease-out hover:shadow-[inset_0_2px_14px_rgba(255,255,255,0.18),inset_0_-3px_16px_rgba(0,0,0,0.22)]"
                      style={{ background: 'var(--accent)', color: '#ffffff' }}
                    >
                      Open comparison
                      <ArrowRight size={14} className="shrink-0" aria-hidden />
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          }

          return (
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
                        <AvatarImage src={url} alt={comparison.channelTitles[i]} />
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
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {comparison.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {comparison.channelHandles.join(' \u00b7 ')}
                    </p>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{timeLabel}</span>
                  <span
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.2)]"
                    style={{ background: 'var(--accent)', color: '#ffffff' }}
                  >
                    Open
                    <ArrowRight size={12} className="shrink-0" aria-hidden />
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); deleteComparison(comparison.id) }}
                    className="p-1 rounded transition-colors duration-150 shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red-text)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
