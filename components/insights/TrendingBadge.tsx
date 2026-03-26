import { Badge } from '@/components/ui/badge'

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
    <Badge
      variant="secondary"
      className="text-xs font-medium px-2 py-0.5"
      style={{ background: config.bg, color: config.color, border: 'none' }}
    >
      {config.label}
    </Badge>
  )
}
