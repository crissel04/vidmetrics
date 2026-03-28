import { cn } from '@/lib/utils'

type SidebarNavBadgeProps = {
  count: number
  className?: string
}

/** Compact circular / pill indicator for unseen counts in the sidebar. */
export function SidebarNavBadge({ count, className }: SidebarNavBadgeProps) {
  if (count <= 0) return null
  const label = count > 99 ? '99+' : String(count)
  const wide = label.length > 1

  return (
    <span
      className={cn(
        // truncate-none: parent SidebarMenuButton applies [&>span:last-child]:truncate to the badge; reset it
        'inline-flex shrink-0 items-center justify-center truncate-none rounded-full font-medium tabular-nums leading-none',
        'min-h-4 text-[10px]',
        wide ? 'min-w-[1.125rem] px-0.5' : 'aspect-square size-4 p-0',
        className
      )}
      style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
    >
      {label}
    </span>
  )
}
