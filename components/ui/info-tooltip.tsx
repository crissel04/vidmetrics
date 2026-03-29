'use client'

import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface InfoTooltipProps {
  text: string
  /** When set, overrides default muted icon color (e.g. on dark or accent backgrounds). */
  iconClassName?: string
}

export function InfoTooltip({ text, iconClassName }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Info
            size={13}
            className={cn('cursor-help shrink-0', iconClassName)}
            style={iconClassName ? undefined : { color: 'var(--text-muted)' }}
          />
        }
      />
      <TooltipContent className="max-w-[280px]">
        <p className="text-sm">{text}</p>
      </TooltipContent>
    </Tooltip>
  )
}
