'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, RefreshCw, GitCompare, Trash2, Plus, Tag, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useWatchlist, type WatchlistEntry } from '@/lib/context/WatchlistContext'
import { useChannelTabs } from '@/lib/hooks/useChannelTabs'
import { useAuth } from '@/lib/context/AuthContext'
import AuthModal from '@/components/auth/AuthModal'
import { formatNumber } from '@/lib/utils'

export default function WatchlistPage() {
  const { watchlist, removeFromWatchlist, addTag, removeTag, getAllTags } = useWatchlist()
  const { addTab } = useChannelTabs()
  const { user } = useAuth()
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [authOpen, setAuthOpen] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [addingTagFor, setAddingTagFor] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const allTags = getAllTags()
  const filteredWatchlist = activeTag
    ? watchlist.filter(entry => entry.tags.includes(activeTag))
    : watchlist

  const toggleSelect = (channelId: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(channelId)) next.delete(channelId)
      else if (next.size < 3) next.add(channelId)
      return next
    })
  }

  const handleAnalyze = (entry: WatchlistEntry) => {
    addTab({
      channelId: entry.channelId,
      title: entry.channelTitle,
      handle: entry.handle,
      thumbnailUrl: entry.thumbnailUrl,
    })
    router.push(`/analysis/${entry.channelId}`)
  }

  const handleCompareSelected = () => {
    const ids = Array.from(selected)
    const params = new URLSearchParams()
    if (ids[0]) params.set('a', ids[0])
    if (ids[1]) params.set('b', ids[1])
    if (ids[2]) params.set('c', ids[2])
    ids.forEach(id => {
      const entry = watchlist.find(w => w.channelId === id)
      if (entry) addTab({
        channelId: entry.channelId,
        title: entry.channelTitle,
        handle: entry.handle,
        thumbnailUrl: entry.thumbnailUrl,
      })
    })
    router.push(`/analysis/compare?${params.toString()}`)
  }

  if (watchlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8 fade-in">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-app)' }}
        >
          <Bookmark size={24} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div className="space-y-1">
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
            Your watchlist is empty
          </p>
          <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
            Analyze a channel and click Save to add it here.
            Use the watchlist to track competitors you check regularly.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/')}
          style={{ borderColor: 'var(--border)' }}
        >
          <Plus size={14} className="mr-1.5" />
          Analyze a channel
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto w-full fade-in">
      {!user && (
        <>
          <div
            className="flex items-center justify-between p-3 rounded-lg border"
            style={{ background: 'var(--accent-subtle)', borderColor: 'var(--accent)' }}
          >
            <p className="text-sm" style={{ color: 'var(--accent-text)' }}>
              Sign in to sync your watchlist across devices
            </p>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5"
              style={{ borderColor: 'var(--accent)' }}
              onClick={() => setAuthOpen(true)}
            >
              Sign in
            </Button>
          </div>
          <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
        </>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-semibold text-xl"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Watchlist
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {watchlist.length} saved channel{watchlist.length !== 1 ? 's' : ''}
          </p>
        </div>

        {selected.size >= 2 && (
          <Button
            onClick={handleCompareSelected}
            className="gap-2"
            style={{ background: 'var(--accent)', color: '#ffffff' }}
          >
            <GitCompare size={14} />
            Compare {selected.size} channels
          </Button>
        )}
      </div>

      {watchlist.length >= 2 && selected.size === 0 && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Select 2 or 3 channels to compare them side by side
        </p>
      )}

      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTag(null)}
            className="text-xs font-medium px-3 py-1 rounded-full border transition-colors"
            style={{
              borderColor: activeTag === null ? 'var(--accent)' : 'var(--border)',
              background: activeTag === null ? 'var(--accent-subtle)' : 'transparent',
              color: activeTag === null ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
          >
            All ({watchlist.length})
          </button>
          {allTags.map(tag => {
            const count = watchlist.filter(e => e.tags.includes(tag)).length
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className="text-xs font-medium px-3 py-1 rounded-full border transition-colors"
                style={{
                  borderColor: activeTag === tag ? 'var(--accent)' : 'var(--border)',
                  background: activeTag === tag ? 'var(--accent-subtle)' : 'transparent',
                  color: activeTag === tag ? 'var(--accent-text)' : 'var(--text-secondary)',
                }}
              >
                {tag} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Channel grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWatchlist.map(entry => {
          const isSelected = selected.has(entry.channelId)
          const momentumColor =
            entry.lastMomentumLabel === 'Accelerating' ? 'var(--green-text)' :
            entry.lastMomentumLabel === 'Stable' ? 'var(--accent-text)' :
            entry.lastMomentumLabel === 'Slowing' ? 'var(--amber-text)' :
            entry.lastMomentumLabel === 'Dormant' ? 'var(--red-text)' :
            'var(--text-muted)'

          return (
            <Card
              key={entry.channelId}
              className="cursor-pointer transition-colors"
              style={{
                borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                background: 'var(--bg-card)',
                ...(isSelected ? { boxShadow: 'none', outline: '2px solid var(--accent)', outlineOffset: '-2px' } : {}),
              }}
              onClick={() => toggleSelect(entry.channelId)}
            >
              <CardContent className="p-4 space-y-4">
                {/* Top row: checkbox + avatar + name */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(entry.channelId)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={!isSelected && selected.size >= 3}
                    className="mt-1 shrink-0"
                  />
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={entry.thumbnailUrl} alt={entry.channelTitle} />
                    <AvatarFallback
                      style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', fontSize: '11px' }}
                    >
                      {entry.channelTitle.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p
                      className="font-medium truncate text-sm"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {entry.channelTitle}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {entry.handle}
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Subscribers</p>
                    <p
                      className="text-sm font-medium tabular-nums"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                    >
                      {formatNumber(entry.subscriberCount)}
                    </p>
                  </div>
                  {entry.lastMomentumScore !== undefined && (
                    <div className="text-right space-y-0.5">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Momentum</p>
                      <p
                        className="text-sm font-medium tabular-nums"
                        style={{ fontFamily: 'var(--font-display)', color: momentumColor }}
                      >
                        {entry.lastMomentumScore} · {entry.lastMomentumLabel}
                      </p>
                    </div>
                  )}
                </div>

                {/* Last analyzed */}
                {entry.lastAnalyzedAt && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Analyzed {formatDistanceToNow(new Date(entry.lastAnalyzedAt), { addSuffix: true })}
                  </p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {entry.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(entry.channelId, tag)}
                        className="hover:opacity-70"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  {addingTagFor === entry.channelId ? (
                    <input
                      autoFocus
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTag.trim()) {
                          addTag(entry.channelId, newTag.trim())
                          setNewTag('')
                          setAddingTagFor(null)
                        }
                        if (e.key === 'Escape') {
                          setNewTag('')
                          setAddingTagFor(null)
                        }
                      }}
                      onBlur={() => {
                        setNewTag('')
                        setAddingTagFor(null)
                      }}
                      placeholder="Add tag…"
                      className="text-[11px] px-2 py-0.5 rounded-full border outline-none w-20"
                      style={{
                        borderColor: 'var(--border)',
                        background: 'var(--bg-app)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  ) : (
                    <button
                      onClick={() => setAddingTagFor(entry.channelId)}
                      className="inline-flex items-center gap-0.5 text-[11px] px-2 py-0.5 rounded-full border border-dashed transition-colors"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                    >
                      <Tag size={10} />
                      Add
                    </button>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => handleAnalyze(entry)}
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <RefreshCw size={12} />
                    Analyze
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromWatchlist(entry.channelId)}
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
