'use client'

import { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Keyboard } from 'lucide-react'

interface Shortcut {
  keys: string[]
  description: string
}

const SHORTCUTS: { group: string; items: Shortcut[] }[] = [
  {
    group: 'Navigation',
    items: [
      { keys: ['G', 'H'], description: 'Go to Home' },
      { keys: ['G', 'W'], description: 'Go to Watchlist' },
      { keys: ['G', 'R'], description: 'Go to Reports' },
      { keys: ['G', 'S'], description: 'Go to Settings' },
    ],
  },
  {
    group: 'Analysis',
    items: [
      { keys: ['/'], description: 'Focus channel search input' },
      { keys: ['S'], description: 'Share current report' },
      { keys: ['B'], description: 'Toggle bookmark (Save to Watchlist)' },
      { keys: ['C'], description: 'Open Compare (when 2+ tabs open)' },
    ],
  },
  {
    group: 'Table',
    items: [
      { keys: ['J'], description: 'Next row in video table' },
      { keys: ['K'], description: 'Previous row in video table' },
      { keys: ['Enter'], description: 'Open Video Deep Dive for selected row' },
      { keys: ['Esc'], description: 'Close any open panel or modal' },
    ],
  },
  {
    group: 'General',
    items: [
      { keys: ['?'], description: 'Show this shortcuts panel' },
    ],
  },
]

function KeyBadge({ children }: { children: string }) {
  return (
    <kbd
      className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-medium rounded border font-mono"
      style={{
        borderColor: 'var(--border-strong)',
        background: 'var(--bg-app)',
        color: 'var(--text-secondary)',
      }}
    >
      {children}
    </kbd>
  )
}

export default function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) return

      if (e.key === '?') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-[520px] shadow-none"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
      >
        <DialogHeader>
          <DialogTitle
            className="flex items-center gap-2 font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            <Keyboard size={16} style={{ color: 'var(--text-muted)' }} />
            Keyboard shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {SHORTCUTS.map(group => (
            <div key={group.group}>
              <p
                className="text-xs font-medium uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                {group.group}
              </p>
              <div className="space-y-1.5">
                {group.items.map(shortcut => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <KeyBadge>{key}</KeyBadge>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              then
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p
          className="text-xs pt-2 border-t"
          style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}
        >
          Press <KeyBadge>?</KeyBadge> anywhere to show or hide this panel
        </p>
      </DialogContent>
    </Dialog>
  )
}
