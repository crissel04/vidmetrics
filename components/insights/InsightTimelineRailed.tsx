'use client'

import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Aligns optional title + subtitle with timeline body (w-5 dot column + gap-3.5). */
const HEAD_INDENT = 'pl-[34px]'

function renderRowBody(content: ReactNode) {
  if (typeof content === 'string' || typeof content === 'number') {
    return (
      <p className="min-w-0 flex-1 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {content}
      </p>
    )
  }
  return <div className="min-w-0 flex-1 text-sm leading-relaxed">{content}</div>
}

export interface InsightTimelineRailedProps {
  /** One node per bullet row (strings get default body styling). */
  items: ReactNode[]
  title?: ReactNode
  subtitle?: ReactNode
  /** Root wrapper classes (e.g. `mt-5` when this block supplies the gap below a card). */
  className?: string
  /**
   * Negative top on the rail so it meets the bottom of the block above.
   * Must match the vertical gap between this block and that sibling (e.g. `-top-5` with `mt-5`, or `-top-4` when the parent uses `space-y-4`).
   */
  railConnectTopClass?: string
  /** Extra classes on the `<ul>` (after optional header). */
  listClassName?: string
  /** Triggers rail bottom resync when content/layout changes (e.g. joined takeaway strings). */
  layoutKey?: string
}

/**
 * Vertical timeline with optional heading and an outer rail that can extend upward to meet a card or spaced sibling above.
 * Rail ends at the vertical center of the last bullet.
 */
export function InsightTimelineRailed({
  items,
  title,
  subtitle,
  className,
  railConnectTopClass,
  listClassName,
  layoutKey = '',
}: InsightTimelineRailedProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const lastBulletRef = useRef<HTMLSpanElement>(null)

  const hasHeader = title != null && title !== false && title !== ''
  const hasSubtitle = subtitle != null && subtitle !== false && subtitle !== ''

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const rail = railRef.current
    if (!wrap || !rail || items.length === 0) return

    const syncRailBottomToLastBullet = () => {
      const b = lastBulletRef.current
      if (!b?.isConnected) return
      const w = wrap.getBoundingClientRect()
      const br = b.getBoundingClientRect()
      const centerY = br.top + br.height / 2
      const bottomInset = w.bottom - centerY
      rail.style.bottom = `${Math.max(0, bottomInset)}px`
    }

    syncRailBottomToLastBullet()
    const ro = new ResizeObserver(syncRailBottomToLastBullet)
    ro.observe(wrap)
    window.addEventListener('resize', syncRailBottomToLastBullet)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', syncRailBottomToLastBullet)
    }
  }, [items.length, railConnectTopClass, layoutKey])

  if (items.length === 0) return null

  return (
    <div ref={wrapRef} className={cn('relative pl-4 pr-4 pb-8', className)}>
      <div
        ref={railRef}
        className={cn(
          'pointer-events-none absolute left-[26px] z-0 w-px -translate-x-1/2',
          railConnectTopClass ?? 'top-0'
        )}
        style={{
          bottom: '0px',
          background: 'var(--border-subtle)',
        }}
        aria-hidden
      />
      {hasHeader && (
        <h3
          className={cn('relative z-[1] text-sm font-semibold', HEAD_INDENT, !hasSubtitle && 'mb-4')}
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          {title}
        </h3>
      )}
      {hasSubtitle && (
        <p
          className={cn('relative z-[1] mb-4 text-sm', HEAD_INDENT, hasHeader && 'mt-1')}
          style={{ color: 'var(--text-muted)' }}
        >
          {subtitle}
        </p>
      )}
      <ul className={cn('relative z-[1] m-0 list-none space-y-5 p-0', listClassName)}>
        {items.map((content, i) => (
          <li key={i} className="relative z-[1] flex gap-3.5">
            <div className="flex w-5 shrink-0 justify-center pt-1">
              <span
                ref={i === items.length - 1 ? lastBulletRef : undefined}
                className="relative z-[2] h-2 w-2 shrink-0 rounded-full"
                style={{
                  background: 'var(--bg-card)',
                  boxShadow: '0 0 0 1.5px var(--border-strong)',
                }}
                aria-hidden
              />
            </div>
            {renderRowBody(content)}
          </li>
        ))}
      </ul>
    </div>
  )
}
