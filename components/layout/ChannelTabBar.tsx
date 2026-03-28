'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { X, Plus, GitCompare, Loader2, ExternalLink, ArrowUp } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useChannelTabs, type ChannelTab } from '@/lib/hooks/useChannelTabs'
import { useChannelCache } from '@/lib/context/ChannelCacheContext'
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
  const { tabs, addTab, removeTab, reorderTabs } = useChannelTabs()
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
    const oldIndex = tabs.findIndex(t => t.channelId === active.id)
    const newIndex = tabs.findIndex(t => t.channelId === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    reorderTabs(arrayMove(tabs, oldIndex, newIndex))
  }

  const handleRemove = (channelId: string) => {
    const isActive = pathname === `/analysis/${channelId}`
    removeTab(channelId)

    if (isActive) {
      const remaining = tabs.filter((t) => t.channelId !== channelId)
      if (remaining.length > 0) {
        router.push(`/analysis/${remaining[0].channelId}`)
      } else {
        router.push('/')
      }
    }
  }

  const activeTab = activeId ? tabs.find(t => t.channelId === activeId) : null

  return (
    <div
      className="flex h-full min-h-0 w-full min-w-0 items-stretch gap-0 overflow-x-auto p-0 m-0"
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
        {/* Flex wrapper so tab sortables are direct flex children with h-full (providers are not a DOM node). */}
        <div className="flex h-full min-h-0 min-w-0 items-stretch">
          <SortableContext
            items={tabs.map(t => t.channelId)}
            strategy={horizontalListSortingStrategy}
          >
            {tabs.map((tab, index) => (
              <SortableChannelTab
                key={tab.channelId}
                tab={tab}
                isFirst={index === 0}
                isActive={pathname === `/analysis/${tab.channelId}`}
                onRemove={handleRemove}
              />
            ))}
          </SortableContext>
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTab ? (
            <TabContent
              tab={activeTab}
              isActive={pathname === `/analysis/${activeTab.channelId}`}
              isDragOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Compare tab — only when 2+ tabs */}
      {tabs.length >= 2 && (
        <Link
          href={`/analysis/compare?a=${tabs[0].channelId}&b=${tabs[1].channelId}${tabs[2] ? `&c=${tabs[2].channelId}` : ''}`}
          className="-ml-px flex h-full min-h-0 shrink-0 items-center gap-1.5 border-x border-solid border-y-0 px-3 py-2.5 text-xs font-medium transition-all duration-150"
          style={pathname === '/analysis/compare' ? {
            background: 'var(--accent)',
            color: '#ffffff',
            borderColor: 'var(--border)',
          } : {
            background: 'var(--accent-subtle)',
            color: 'var(--accent-text)',
            borderColor: 'var(--border)',
          }}
          onMouseEnter={(e) => {
            if (pathname !== '/analysis/compare') e.currentTarget.style.opacity = '0.8'
          }}
          onMouseLeave={(e) => {
            if (pathname !== '/analysis/compare') e.currentTarget.style.opacity = '1'
          }}
        >
          <GitCompare size={15} />
          Compare
        </Link>
      )}

      {/* Add channel button */}
      <AddChannelPopover
        isFirst={tabs.length === 0}
        onAdd={(tab) => {
          addTab(tab)
          router.push(`/analysis/${tab.channelId}`)
        }}
      />
    </div>
  )
}

/** Visual content of a tab — used both in-place and inside DragOverlay */
function TabContent({
  tab,
  isActive,
  isFirst,
  onRemove,
  isDragOverlay,
  listeners,
}: {
  tab: ChannelTab
  isActive: boolean
  /** Flush left edge of the tab bar (no horizontal inset) */
  isFirst?: boolean
  onRemove?: (channelId: string) => void
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
        <>
          <Tooltip>
            <TooltipTrigger
              render={
                <a
                  href={`https://www.youtube.com/channel/${tab.channelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ color: 'var(--text-muted)' }}
                />
              }
            >
              <ExternalLink size={11} />
            </TooltipTrigger>
            <TooltipContent>View on YouTube</TooltipContent>
          </Tooltip>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemove?.(tab.channelId)
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={12} />
          </button>
        </>
      )}
    </div>
  )
}

function SortableChannelTab({
  tab,
  isFirst,
  isActive,
  onRemove,
}: {
  tab: ChannelTab
  isFirst: boolean
  isActive: boolean
  onRemove: (channelId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.channelId })

  // The dragged item is hidden (DragOverlay renders the visible clone).
  // Non-dragging items get a smooth slide transition as they reorder.
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
      let fullUrl = url.trim()
      if (!fullUrl.startsWith('http')) fullUrl = `https://${fullUrl}`

      const res = await fetch(`/api/channel?url=${encodeURIComponent(fullUrl)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid channel URL')
        setLoading(false)
        return
      }

      // Pre-populate cache so navigation is instant
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
    } catch {
      setError('Network error')
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
            placeholder="youtube.com/@channel"
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
