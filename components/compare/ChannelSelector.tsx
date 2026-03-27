'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X, Plus, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useChannelTabs, type ChannelTab } from '@/lib/hooks/useChannelTabs'
import { useChannelCache } from '@/lib/context/ChannelCacheContext'
import { toast } from 'sonner'

interface SelectedChannel {
  channelId: string
  title: string
  handle: string
  thumbnailUrl: string
}

interface ChannelSelectorProps {
  channels: SelectedChannel[]
}

export function ChannelSelector({ channels }: ChannelSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedIds = [
    searchParams.get('a'),
    searchParams.get('b'),
    searchParams.get('c'),
  ].filter(Boolean) as string[]

  const handleRemove = (channelId: string) => {
    const remaining = selectedIds.filter(id => id !== channelId)
    if (remaining.length < 2) {
      toast('Add at least two channels to compare')
      router.replace('/')
      return
    }
    const params = new URLSearchParams()
    remaining.forEach((id, i) => {
      const key = ['a', 'b', 'c'][i]
      params.set(key, id)
    })
    router.replace(`/analysis/compare?${params.toString()}`)
  }

  const handleAdd = (channelId: string) => {
    if (selectedIds.length >= 3) return
    const params = new URLSearchParams()
    ;[...selectedIds, channelId].forEach((id, i) => {
      const key = ['a', 'b', 'c'][i]
      params.set(key, id)
    })
    router.replace(`/analysis/compare?${params.toString()}`)
  }

  const atMax = selectedIds.length >= 3

  return (
    <div
      className="flex items-center gap-2 flex-wrap"
    >
      <span
        className="text-xs font-medium shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        Comparing:
      </span>

      {channels.map(ch => (
        <div
          key={ch.channelId}
          className="flex items-center gap-1.5 px-2 py-1 rounded-full"
          style={{ background: 'var(--bg-app)', border: '1px solid var(--border)' }}
        >
          <Avatar className="h-5 w-5 shrink-0">
            <AvatarImage src={ch.thumbnailUrl} alt={ch.title} />
            <AvatarFallback
              style={{
                background: 'var(--accent-subtle)',
                color: 'var(--accent-text)',
                fontSize: '8px',
              }}
            >
              {ch.title.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span
            className="text-xs font-medium truncate max-w-[16ch]"
            style={{ color: 'var(--text-primary)' }}
          >
            {ch.handle || ch.title}
          </span>
          <button
            onClick={() => handleRemove(ch.channelId)}
            className="shrink-0 p-0.5 rounded-full transition-colors duration-150"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <X size={12} />
          </button>
        </div>
      ))}

      {atMax ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium opacity-40 cursor-not-allowed"
                style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                disabled
              />
            }
          >
            <Plus size={12} />
            Add
          </TooltipTrigger>
          <TooltipContent>Maximum 3 channels</TooltipContent>
        </Tooltip>
      ) : (
        <AddChannelPopover
          selectedIds={selectedIds}
          onAdd={handleAdd}
        />
      )}
    </div>
  )
}

function AddChannelPopover({
  selectedIds,
  onAdd,
}: {
  selectedIds: string[]
  onAdd: (channelId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { tabs, addTab } = useChannelTabs()
  const channelCache = useChannelCache()

  const availableTabs = tabs.filter(t => !selectedIds.includes(t.channelId))

  const handleSelectTab = (tab: ChannelTab) => {
    onAdd(tab.channelId)
    setOpen(false)
  }

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
        setError(data.error || 'Channel not found')
        setLoading(false)
        return
      }

      // Pre-populate cache so navigation is instant
      channelCache.set(data.channel.id, {
        channel: data.channel,
        videos: data.videos,
        metrics: data.metrics,
      })

      // Add to tabs so it persists
      addTab({
        channelId: data.channel.id,
        title: data.channel.title,
        handle: data.channel.handle,
        thumbnailUrl: data.channel.thumbnailUrl,
      })

      onAdd(data.channel.id)
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
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors duration-150"
            style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
        }
      >
        <Plus size={12} />
        Add channel
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-72 shadow-none">
        {/* Section 1: Open channels */}
        <p
          className="text-[10px] font-medium uppercase tracking-wider mb-1.5"
          style={{ color: 'var(--text-muted)' }}
        >
          Open channels
        </p>
        {availableTabs.length === 0 ? (
          <p className="text-xs py-1.5" style={{ color: 'var(--text-muted)' }}>
            All open channels are already selected.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
            {availableTabs.map(tab => (
              <button
                key={tab.channelId}
                onClick={() => handleSelectTab(tab)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors duration-150 w-full"
                style={{ color: 'var(--text-primary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-app)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarImage src={tab.thumbnailUrl} alt={tab.title} />
                  <AvatarFallback
                    style={{
                      background: 'var(--accent-subtle)',
                      color: 'var(--accent-text)',
                      fontSize: '8px',
                    }}
                  >
                    {tab.title.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{tab.title}</p>
                  {tab.handle && (
                    <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                      {tab.handle}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <Separator className="my-2" />

        {/* Section 2: Add new channel */}
        <p
          className="text-[10px] font-medium uppercase tracking-wider mb-1.5"
          style={{ color: 'var(--text-muted)' }}
        >
          Add new channel
        </p>
        <div className="flex gap-1.5">
          <Input
            placeholder="Paste YouTube channel URL..."
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
