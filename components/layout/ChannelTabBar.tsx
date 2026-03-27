'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { X, Plus, GitCompare, Loader2, ExternalLink } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useChannelTabs, type ChannelTab } from '@/lib/hooks/useChannelTabs'
import { useChannelCache } from '@/lib/context/ChannelCacheContext'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function ChannelTabBar() {
  const { tabs, addTab, removeTab, reorderTabs } = useChannelTabs()
  const pathname = usePathname()
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
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

  return (
    <div
      className="flex items-center gap-0.5 overflow-x-auto px-1"
      style={{ scrollbarWidth: 'none' }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tabs.map(t => t.channelId)}
          strategy={horizontalListSortingStrategy}
        >
          {tabs.map((tab) => (
            <SortableChannelTab
              key={tab.channelId}
              tab={tab}
              isActive={pathname === `/analysis/${tab.channelId}`}
              onRemove={handleRemove}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Compare tab — only when 2+ tabs */}
      {tabs.length >= 2 && (
        <Link
          href={`/analysis/compare?a=${tabs[0].channelId}&b=${tabs[1].channelId}${tabs[2] ? `&c=${tabs[2].channelId}` : ''}`}
          className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-t-md text-xs font-medium transition-colors duration-150"
          style={{
            background: pathname === '/analysis/compare' ? 'var(--bg-app)' : 'transparent',
            color: pathname === '/analysis/compare' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: pathname === '/analysis/compare' ? '2px solid var(--accent)' : '2px solid transparent',
          }}
          onMouseEnter={(e) => {
            if (pathname !== '/analysis/compare') e.currentTarget.style.background = 'var(--bg-app)'
          }}
          onMouseLeave={(e) => {
            if (pathname !== '/analysis/compare') e.currentTarget.style.background = 'transparent'
          }}
        >
          <GitCompare size={14} />
          Compare
        </Link>
      )}

      {/* Add channel button */}
      <AddChannelPopover
        onAdd={(tab) => {
          addTab(tab)
          router.push(`/analysis/${tab.channelId}`)
        }}
      />
    </div>
  )
}

function SortableChannelTab({
  tab,
  isActive,
  onRemove,
}: {
  tab: ChannelTab
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="shrink-0">
      <div
        className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-t-md text-xs font-medium transition-colors duration-150 relative"
        style={{
          background: isActive ? 'var(--bg-app)' : 'transparent',
          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = 'var(--bg-app)'
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = 'transparent'
        }}
        {...listeners}
      >
        <Link
          href={`/analysis/${tab.channelId}`}
          className="flex items-center gap-1.5"
          onClick={(e) => { if (isDragging) e.preventDefault() }}
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
            onRemove(tab.channelId)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  )
}

function AddChannelPopover({
  onAdd,
}: {
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
            className="shrink-0 flex items-center justify-center h-7 w-7 rounded-md transition-colors duration-150"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-app)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          />
        }
      >
        <Plus size={14} />
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-72 shadow-none">
        <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Add channel
        </p>
        <div className="flex gap-1.5">
          <Input
            placeholder="youtube.com/@channel"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
            className="h-7 text-xs"
            style={{ borderColor: error ? 'var(--red)' : 'var(--border)' }}
          />
          <Button
            onClick={handleSubmit}
            disabled={loading || !url.trim()}
            className="h-7 px-2.5 text-xs shrink-0"
            style={{ background: 'var(--accent)', color: '#ffffff' }}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : 'Add'}
          </Button>
        </div>
        {error && (
          <p className="text-[11px] mt-1" style={{ color: 'var(--red-text)' }}>{error}</p>
        )}
      </PopoverContent>
    </Popover>
  )
}
