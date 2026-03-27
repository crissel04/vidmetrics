'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

interface CopyHandleButtonProps {
  handle: string
}

export function CopyHandleButton({ handle }: CopyHandleButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(handle)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            onClick={handleCopy}
            className="inline-flex items-center justify-center h-5 w-5 rounded transition-colors duration-150"
            style={{ color: 'var(--text-muted)' }}
          />
        }
      >
        {copied ? <Check size={12} style={{ color: 'var(--green-text)' }} /> : <Copy size={12} />}
      </TooltipTrigger>
      <TooltipContent>
        {copied ? 'Copied!' : 'Copy handle'}
      </TooltipContent>
    </Tooltip>
  )
}
