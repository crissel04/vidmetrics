'use client'

import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface InfoTooltipProps {
  text: string
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Info
            size={13}
            style={{ color: 'var(--text-muted)' }}
            className="cursor-help shrink-0"
          />
        }
      />
      <TooltipContent className="max-w-[280px]">
        <p className="text-sm">{text}</p>
      </TooltipContent>
    </Tooltip>
  )
}
