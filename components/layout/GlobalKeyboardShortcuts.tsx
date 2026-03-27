'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal'

export function GlobalKeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    let gPressed = false
    let gTimer: NodeJS.Timeout

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      if (isTyping) return

      // G + key navigation
      if (e.key === 'g' || e.key === 'G') {
        if (!gPressed) {
          gPressed = true
          gTimer = setTimeout(() => { gPressed = false }, 1000)
          return
        }
      }

      if (gPressed) {
        clearTimeout(gTimer)
        gPressed = false
        switch (e.key.toLowerCase()) {
          case 'h': router.push('/'); return
          case 'w': router.push('/watchlist'); return
          case 'r': router.push('/report'); return
          case 's': router.push('/settings'); return
        }
      }

      // / key — focus search input on home page
      if (e.key === '/' && window.location.pathname === '/') {
        e.preventDefault()
        const input = document.querySelector<HTMLInputElement>(
          'input[type="text"], input[placeholder*="channel"]'
        )
        input?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(gTimer)
    }
  }, [router])

  return <KeyboardShortcutsModal />
}
