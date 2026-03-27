'use client'

import Image from 'next/image'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDuration } from '@/lib/utils'

interface ThumbnailPopoverProps {
  thumbnailUrl: string
  title: string
  duration: string
  children: React.ReactNode
}

export function ThumbnailPopover({ thumbnailUrl, title, duration, children }: ThumbnailPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger render={<span className="cursor-pointer" />}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-0 shadow-none"
        side="top"
        sideOffset={8}
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg" style={{ background: 'var(--bg-app)' }}>
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="280px"
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
