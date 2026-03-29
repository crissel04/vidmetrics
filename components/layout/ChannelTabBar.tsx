'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { X, Plus, GitCompare, Loader2, ArrowUp } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useChannelTabs,
  type ChannelTab,
  type ComparisonTab,
  type Tab,
} from '@/lib/hooks/useChannelTabs'
import { useChannelCache } from '@/lib/context/ChannelCacheContext'
import { normalizeChannelInput } from '@/lib/utils'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'

export function ChannelTabBar() {
  const { tabs, channelTabs, addTab, addComparisonTab, removeTab, reorderTabs } = useChannelTabs()
  const pathname = usePathname()
  const router = useRouter()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 12 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = tabs.findIndex(t => t.id === active.id)
    const newIndex = tabs.findIndex(t => t.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    reorderTabs(arrayMove(tabs, oldIndex, newIndex))
  }

  const handleRemove = (id: string) => {
    const tab = tabs.find(t => t.id === id)
    if (!tab) return

    const isActive = tab.type === 'channel'
      ? pathname === `/analysis/${tab.channelId}`
      : pathname === `/analysis/compare/${tab.id}`

    removeTab(id)

    if (isActive) {
      const remaining = tabs.filter(t => t.id !== id)
      if (remaining.length > 0) {
        const first = remaining[0]
        if (first.type === 'channel') {
          router.push(`/analysis/${first.channelId}`)
        } else {
          router.push(`/analysis/compare/${first.id}`)
        }
      } else {
        router.push('/')
      }
    }
  }

  const handleNewComparison = () => {
    const id = crypto.randomUUID()
    addComparisonTab({
      id,
      name: 'New comparison',
      channels: [],
    })
    router.push(`/analysis/compare/${id}`)
  }

  const activeTab = activeId ? tabs.find(t => t.id === activeId) : null

  const pendingChannelId = useMemo(() => {
    if (!pathname) return null
    const m = pathname.match(/^\/analysis\/([^/]+)$/)
    if (!m) return null
    const id = m[1]
    if (id === 'compare') return null
    return id
  }, [pathname])

  const showPendingChannelTab =
    pendingChannelId != null && !tabs.some(t => t.type === 'channel' && t.channelId === pendingChannelId)

  return (
    <div
      className="flex h-full min-h-[40px] w-full min-w-0 items-stretch gap-0 overflow-x-auto p-0 m-0"
      style={{ scrollbarWidth: 'none' }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
        modifiers={[restrictToHorizontalAxis]}
      >
        <div className="flex h-full min-h-0 min-w-0 items-stretch">
          <SortableContext
            items={tabs.map(t => t.id)}
            strategy={horizontalListSortingStrategy}
          >
            {tabs.map((tab, index) => (
              <SortableTab
                key={tab.id}
                tab={tab}
                isFirst={index === 0}
                isActive={
                  tab.type === 'channel'
                    ? pathname === `/analysis/${tab.channelId}`
                    : pathname === `/analysis/compare/${tab.id}`
                }
                onRemove={handleRemove}
                pathname={pathname}
              />
            ))}
          </SortableContext>
        </div>
        {showPendingChannelTab && pendingChannelId && (
          <PendingChannelTabSkeleton
            isActive={pathname === `/analysis/${pendingChannelId}`}
          />
        )}
        <DragOverlay dropAnimation={null}>
          {activeTab ? (
            <TabContent
              tab={activeTab}
              isActive={
                activeTab.type === 'channel'
                  ? pathname === `/analysis/${activeTab.channelId}`
                  : pathname === `/analysis/compare/${activeTab.id}`
              }
              isDragOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add channel button */}
      <AddChannelPopover
        isFirst={tabs.length === 0}
        onAdd={(tab) => {
          addTab(tab)
          router.push(`/analysis/${tab.channelId}`)
        }}
      />

      {/* New comparison button — only when 2+ channel tabs */}
      {channelTabs.length >= 2 && (
        <button
          onClick={handleNewComparison}
          className="-ml-px flex h-full min-h-0 shrink-0 items-center gap-1.5 border-x border-solid border-y-0 px-3 py-2.5 text-xs font-medium transition-all duration-150 cursor-pointer"
          style={{
            background: 'var(--accent-subtle)',
            color: 'var(--accent-text)',
            borderColor: 'var(--border)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          <GitCompare size={15} />
          <span className="hidden sm:inline">New Comparison</span>
        </button>
      )}
    </div>
  )
}

/* ─── Channel tab content ─── */

function ChannelTabContent({
  tab,
  isActive,
  isFirst,
  onRemove,
  isDragOverlay,
  listeners,
}: {
  tab: ChannelTab
  isActive: boolean
  isFirst?: boolean
  onRemove?: (id: string) => void
  isDragOverlay?: boolean
  listeners?: Record<string, unknown>
}) {
  return (
    <div
      className={`group relative box-border flex h-full min-h-0 min-w-0 shrink-0 items-center gap-1.5 border-x border-solid border-y-0 px-3 py-2.5 text-xs font-medium ${isFirst ? 'border-l-0' : ''}`}
      style={{
        background: isActive ? 'var(--bg-app)' : isDragOverlay ? 'var(--bg-card)' : 'transparent',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        borderColor: 'var(--border)',
        boxShadow: isActive ? 'inset 0 -2px 0 0 var(--accent)' : undefined,
        cursor: isDragOverlay ? 'grabbing' : 'grab',
      }}
      onMouseEnter={(e) => {
        if (!isActive && !isDragOverlay) e.currentTarget.style.background = 'var(--bg-app)'
      }}
      onMouseLeave={(e) => {
        if (!isActive && !isDragOverlay) e.currentTarget.style.background = 'transparent'
      }}
      {...(listeners ?? {})}
    >
      <Link
        href={`/analysis/${tab.channelId}`}
        className="flex items-center gap-1.5"
        onClick={(e) => { if (isDragOverlay) e.preventDefault() }}
      >
        <Avatar className="h-5 w-5">
          <AvatarImage src={tab.thumbnailUrl} alt={tab.title} />
          <AvatarFallback
            style={{
              background: 'var(--accent-subtle)',
              color: 'var(--accent-text)',
              fontSize: '8px',
            }}
          >
            {tab.title.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="truncate max-w-[18ch]">
          {tab.handle || tab.title}
        </span>
      </Link>
      {!isDragOverlay && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRemove?.(tab.id)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-60 transition-opacity duration-150"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}

/* ─── Comparison tab content ─── */

function ComparisonTabContent({
  tab,
  isActive,
  isFirst,
  onRemove,
  isDragOverlay,
  listeners,
}: {
  tab: ComparisonTab
  isActive: boolean
  isFirst?: boolean
  onRemove?: (id: string) => void
  isDragOverlay?: boolean
  listeners?: Record<string, unknown>
}) {
  return (
    <div
      className={`group relative box-border flex h-full min-h-0 min-w-0 shrink-0 items-center gap-1.5 border-x border-solid border-y-0 px-3 py-2.5 text-xs font-medium ${isFirst ? 'border-l-0' : ''}`}
      style={{
        background: isActive ? 'var(--bg-app)' : isDragOverlay ? 'var(--bg-card)' : 'transparent',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        borderColor: 'var(--border)',
        boxShadow: isActive ? 'inset 0 -2px 0 0 var(--accent)' : undefined,
        cursor: isDragOverlay ? 'grabbing' : 'grab',
      }}
      onMouseEnter={(e) => {
        if (!isActive && !isDragOverlay) e.currentTarget.style.background = 'var(--bg-app)'
      }}
      onMouseLeave={(e) => {
        if (!isActive && !isDragOverlay) e.currentTarget.style.background = 'transparent'
      }}
      {...(listeners ?? {})}
    >
      <Link
        href={`/analysis/compare/${tab.id}`}
        className="flex items-center gap-1.5"
        onClick={(e) => { if (isDragOverlay) e.preventDefault() }}
      >
        {/* Stacked avatars */}
        <div className="flex -space-x-1.5 shrink-0">
          {tab.channels.slice(0, 3).map((ch, i) => (
            <Avatar key={ch.channelId} className="h-5 w-5 border" style={{ borderColor: 'var(--bg-card)', zIndex: 3 - i }}>
              <AvatarImage src={ch.thumbnailUrl} alt={ch.title} />
              <AvatarFallback
                style={{
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent-text)',
                  fontSize: '7px',
                }}
              >
                {ch.title.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <span className="truncate max-w-[18ch]">
          {tab.name}
        </span>
      </Link>
      {!isDragOverlay && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRemove?.(tab.id)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-60 transition-opacity duration-150"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}

/* ─── Unified tab content renderer ─── */

function TabContent({
  tab,
  isActive,
  isFirst,
  onRemove,
  isDragOverlay,
  listeners,
}: {
  tab: Tab
  isActive: boolean
  isFirst?: boolean
  onRemove?: (id: string) => void
  isDragOverlay?: boolean
  listeners?: Record<string, unknown>
}) {
  if (tab.type === 'comparison') {
    return (
      <ComparisonTabContent
        tab={tab}
        isActive={isActive}
        isFirst={isFirst}
        onRemove={onRemove}
        isDragOverlay={isDragOverlay}
        listeners={listeners}
      />
    )
  }
  return (
    <ChannelTabContent
      tab={tab}
      isActive={isActive}
      isFirst={isFirst}
      onRemove={onRemove}
      isDragOverlay={isDragOverlay}
      listeners={listeners}
    />
  )
}

/* ─── Sortable wrapper ─── */

function SortableTab({
  tab,
  isFirst,
  isActive,
  onRemove,
  pathname,
}: {
  tab: Tab
  isFirst: boolean
  isActive: boolean
  onRemove: (id: string) => void
  pathname: string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id })

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, 0px, 0)`
      : undefined,
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.5 : 1,
    ...(isDragging ? {
      background: 'var(--accent-subtle)',
      border: '1px dashed color-mix(in srgb, var(--accent) 40%, transparent)',
    } : {}),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`flex h-full min-h-0 shrink-0 ${isFirst ? 'ml-0' : '-ml-px'}`}
    >
      <TabContent
        tab={tab}
        isFirst={isFirst}
        isActive={isActive}
        onRemove={onRemove}
        listeners={listeners}
      />
    </div>
  )
}

/* ─── Pending channel skeleton ─── */

function PendingChannelTabSkeleton({ isActive }: { isActive: boolean }) {
  return (
    <div
      className="-ml-px flex h-full min-h-0 shrink-0 items-center gap-1.5 border-x border-solid border-y-0 px-3 py-2.5"
      style={{
        background: isActive ? 'var(--bg-app)' : 'transparent',
        borderColor: 'var(--border)',
        boxShadow: isActive ? 'inset 0 -2px 0 0 var(--accent)' : undefined,
      }}
      aria-busy
      aria-label="Loading channel"
    >
      <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
      <Skeleton className="h-3 w-[14ch] max-w-[18ch] rounded-md" />
    </div>
  )
}

/* ─── Add channel popover ─── */

function AddChannelPopover({
  isFirst,
  onAdd,
}: {
  isFirst: boolean
  onAdd: (tab: { channelId: string; title: string; handle: string; thumbnailUrl: string }) => void
}) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const channelCache = useChannelCache()

  const handleSubmit = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')

    try {
      const fullUrl = normalizeChannelInput(url)

      const res = await fetch(`/api/channel?url=${encodeURIComponent(fullUrl)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid channel URL')
        setLoading(false)
        return
      }

      channelCache.set(data.channel.id, {
        channel: data.channel,
        videos: data.videos,
        metrics: data.metrics,
      })

      onAdd({
        channelId: data.channel.id,
        title: data.channel.title,
        handle: data.channel.handle,
        thumbnailUrl: data.channel.thumbnailUrl,
      })
      setUrl('')
      setError('')
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) { setUrl(''); setError('') }
      }}
    >
      <PopoverTrigger
        render={
          <button
            type="button"
            className={`flex h-full min-h-0 w-9 shrink-0 cursor-pointer items-center justify-center border-x border-solid border-y-0 p-0 transition-colors duration-150 ${isFirst ? 'ml-0 border-l-0' : '-ml-px'}`}
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-app)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          />
        }
      >
        <Plus size={15} />
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom" sideOffset={18} className="w-80 p-2.5 shadow-none">
        <p className="mb-1.5 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Add channel
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="@channel or paste URL"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
            className="h-9 rounded-md px-3 text-xs"
            style={{ borderColor: error ? 'var(--red)' : 'var(--border)' }}
          />
          <Button
            onClick={handleSubmit}
            disabled={loading || !url.trim()}
            className="h-9 shrink-0 gap-1.5 rounded-md px-3.5 text-xs"
            style={{ background: 'var(--accent)', color: '#ffffff' }}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                Add
                <ArrowUp size={14} className="shrink-0" aria-hidden />
              </>
            )}
          </Button>
        </div>
        {error && (
          <p className="text-[11px] mt-1" style={{ color: 'var(--red-text)' }}>{error}</p>
        )}
      </PopoverContent>
    </Popover>
  )
}
