interface TrendingBadgeProps {
  tier: 'hot' | 'rising' | 'average' | 'underperforming'
}

const tierConfig = {
  hot: { label: 'Hot', bg: 'var(--red-subtle)', color: 'var(--red-text)' },
  rising: { label: 'Rising', bg: 'var(--accent-subtle)', color: 'var(--accent-text)' },
  average: { label: '—', bg: 'transparent', color: 'var(--text-muted)' },
  underperforming: { label: 'Low', bg: 'var(--red-subtle)', color: 'var(--red-text)' },
}

export function TrendingBadge({ tier }: TrendingBadgeProps) {
  const config = tierConfig[tier]
  if (tier === 'average') {
    return <span style={{ color: config.color }}>—</span>
  }
  return (
    <span
      className="inline-flex items-center rounded-md border border-solid px-2 py-0.5 text-xs font-medium"
      style={{
        background: config.bg,
        color: config.color,
        borderColor: `color-mix(in srgb, ${config.color} 28%, transparent)`,
      }}
    >
      {config.label}
    </span>
  )
}
