'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDuration } from '@/lib/utils'

interface ThumbnailPopoverProps {
  videoId: string
  thumbnailUrl: string
  title: string
  duration: string
  children: React.ReactNode
}

export function ThumbnailPopover({ videoId, thumbnailUrl, title, duration, children }: ThumbnailPopoverProps) {
  const [open, setOpen] = useState(false)
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleMouseEnter = () => {
    clearTimeout(closeTimer.current)
    openTimer.current = setTimeout(() => setOpen(true), 200)
  }

  const handleMouseLeave = () => {
    clearTimeout(openTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 150)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <span
            className="cursor-pointer"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        }
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-[280px] p-0 shadow-none"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="relative aspect-video w-full overflow-hidden rounded-t-lg"
          style={{ background: 'var(--bg-app)' }}
        >
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="280px"
            onError={(e) => {
              const img = e.target as HTMLImageElement
              if (!img.src.includes('hqdefault')) {
                img.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
              }
            }}
          />
          <span
            className="absolute bottom-1.5 right-1.5 rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
            style={{ background: 'rgba(0,0,0,0.8)', color: '#ffffff' }}
          >
            {formatDuration(duration)}
          </span>
        </div>
        <p
          className="p-2 text-xs leading-snug line-clamp-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </p>
      </PopoverContent>
    </Popover>
  )
}
