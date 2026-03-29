/**
 * Shared scatter colors: primary accent plus violet, pink, and a neutral.
 * Avoids traffic-light green / amber / red while keeping series distinct.
 */
export const SCATTER_PRIMARY = 'var(--accent)'

export const SCATTER_SERIES = {
  primary: 'var(--accent)',
  violet: 'var(--chart-5)',
  pink: 'var(--chart-4)',
  neutral: 'var(--text-secondary)',
} as const

/** Performance tier → series slot (Views vs content age). */
export const scatterTierFill: Record<string, string> = {
  hot: SCATTER_SERIES.primary,
  rising: SCATTER_SERIES.violet,
  average: SCATTER_SERIES.pink,
  underperforming: SCATTER_SERIES.neutral,
}

/** Engagement quadrant → same four-color system (order matches legend). */
export const scatterQuadrantFill: Record<string, string> = {
  'High views, high engagement': SCATTER_SERIES.primary,
  'High views, low engagement': SCATTER_SERIES.violet,
  'Low views, high engagement': SCATTER_SERIES.pink,
  'Low views, low engagement': SCATTER_SERIES.neutral,
}
