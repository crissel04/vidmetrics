'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, GitCompare, Trash2, Tag, X, ArrowRight, LayoutGrid, List } from 'lucide-react'
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
  const { watchlist, removeFromWatchlist, addTag, removeTag } = useWatchlist()
  const { addTab } = useChannelTabs()
  const { user } = useAuth()
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [authOpen, setAuthOpen] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [addingTagFor, setAddingTagFor] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  const getDisplayTags = (entry: WatchlistEntry) => {
    const tags = [...entry.tags]
    const cat = entry.category ? capitalize(entry.category) : ''
    if (cat && !tags.includes(cat)) {
      tags.unshift(cat)
    }
    return tags
  }

  const allDisplayTags = (() => {
    const tagSet = new Set<string>()
    watchlist.forEach(entry => {
      getDisplayTags(entry).forEach(t => tagSet.add(t))
    })
    return Array.from(tagSet)
  })()

  const filteredWatchlist = activeTag
    ? watchlist.filter(entry => getDisplayTags(entry).includes(activeTag))
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-8 text-center fade-in">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-app)' }}
        >
          <Bookmark size={24} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div className="space-y-1.5">
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Your watchlist is empty
          </h2>
          <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
            Analyze a channel and click Save to add it here.
            Use the watchlist to track competitors you check regularly.
          </p>
        </div>
        <Button
          onClick={() => router.push('/')}
          className="mt-2 h-10 cursor-pointer gap-1.5 px-4 text-sm font-medium border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.2)] transition-shadow duration-300 ease-out hover:shadow-[inset_0_2px_14px_rgba(255,255,255,0.18),inset_0_-3px_16px_rgba(0,0,0,0.22)]"
          style={{ background: 'var(--accent)', color: '#ffffff' }}
        >
          Analyze a channel
          <ArrowRight size={14} className="shrink-0" aria-hidden />
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 px-6 pt-2 fade-in">
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
            className="font-semibold text-2xl"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Watchlist
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {watchlist.length} saved channel{watchlist.length !== 1 ? 's' : ''} — select 2–3 to compare
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selected.size >= 2 && (
            <Button
              onClick={handleCompareSelected}
              className="cursor-pointer gap-1.5 px-4 text-sm font-medium border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.2)] transition-shadow duration-300 ease-out hover:shadow-[inset_0_2px_14px_rgba(255,255,255,0.18),inset_0_-3px_16px_rgba(0,0,0,0.22)]"
              style={{ background: 'var(--accent)', color: '#ffffff' }}
            >
              <GitCompare size={14} />
              Compare {selected.size}
              <ArrowRight size={14} className="shrink-0" aria-hidden />
            </Button>
          )}
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
      </div>

      {/* Tag filter bar */}
      {allDisplayTags.length > 0 && (
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
          {allDisplayTags.map(tag => {
            const count = watchlist.filter(e => getDisplayTags(e).includes(tag)).length
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

      {/* Channel grid / list */}
      <div className={viewMode === 'card' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
        {filteredWatchlist.map(entry => {
          const isSelected = selected.has(entry.channelId)
          const displayTags = getDisplayTags(entry)

          if (viewMode === 'list') {
            return (
              <Card
                key={entry.channelId}
                className="cursor-pointer transition-colors shadow-none"
                style={{
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                  background: 'var(--bg-card)',
                  ...(isSelected ? { outline: '2px solid var(--accent)', outlineOffset: '-2px' } : {}),
                }}
                onClick={() => toggleSelect(entry.channelId)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={isSelected}
                      className="shrink-0 pointer-events-none"
                    />
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={entry.thumbnailUrl} alt={entry.channelTitle} />
                      <AvatarFallback
                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', fontSize: '11px' }}
                      >
                        {entry.channelTitle.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {entry.channelTitle}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {entry.handle}
                      </p>
                    </div>
                    <p className="text-sm font-medium tabular-nums shrink-0" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                      {formatNumber(entry.subscriberCount)}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        onClick={() => handleAnalyze(entry)}
                        className="cursor-pointer gap-1.5 px-3 text-xs font-medium border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.2)]"
                        style={{ background: 'var(--accent)', color: '#ffffff' }}
                        size="sm"
                      >
                        Analyze
                        <ArrowRight size={12} className="shrink-0" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => removeFromWatchlist(entry.channelId)}
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          }

          const gridLine = 'color-mix(in srgb, var(--border-strong) 32%, transparent)'

          return (
            <Card
              key={entry.channelId}
              className="relative cursor-pointer overflow-hidden transition-colors shadow-none"
              style={{
                borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                background: 'var(--bg-card)',
                ...(isSelected ? { outline: '2px solid var(--accent)', outlineOffset: '-2px' } : {}),
              }}
              onClick={() => toggleSelect(entry.channelId)}
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
                {/* Top row: checkbox + avatar + name + delete */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    className="mt-1 shrink-0 pointer-events-none"
                  />
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={entry.thumbnailUrl} alt={entry.channelTitle} />
                    <AvatarFallback
                      style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', fontSize: '11px' }}
                    >
                      {entry.channelTitle.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
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
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFromWatchlist(entry.channelId) }}
                    className="shrink-0 p-1 rounded transition-colors duration-150"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red-text)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Subscriber count */}
                <p
                  className="text-lg font-bold tabular-nums"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                >
                  {formatNumber(entry.subscriberCount)}
                  <span className="ml-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>subscribers</span>
                </p>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {displayTags.map(tag => {
                    const catCapitalized = entry.category ? capitalize(entry.category) : ''
                    const isCategoryTag = tag === catCapitalized && !entry.tags.includes(tag)
                    return (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
                      >
                        {tag}
                        {!isCategoryTag && (
                          <button
                            onClick={() => removeTag(entry.channelId, tag)}
                            className="hover:opacity-70"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </span>
                    )
                  })}
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

                {/* Spacer pushes analyze button to bottom */}
                <div className="flex-1" />

                {/* Analyze button — always at bottom */}
                <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    onClick={() => handleAnalyze(entry)}
                    className="w-full cursor-pointer gap-1.5 text-sm font-medium border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.2)] transition-shadow duration-300 ease-out hover:shadow-[inset_0_2px_14px_rgba(255,255,255,0.18),inset_0_-3px_16px_rgba(0,0,0,0.22)]"
                    style={{ background: 'var(--accent)', color: '#ffffff' }}
                    size="sm"
                  >
                    Analyze
                    <ArrowRight size={14} className="shrink-0" aria-hidden />
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
