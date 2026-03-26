/**
 * Static niche benchmark lookup table.
 * Used by NicheBenchmark component to compare a channel against category averages.
 * Falls back to 'default' (YouTube-wide averages) if category can't be determined.
 */
export const NICHE_BENCHMARKS: Record<string, {
  label: string
  avgEngagementRate: number
  avgViewsPerVideo: number
  avgUploadFrequency: string
}> = {
  'gaming':      { label: 'Gaming',      avgEngagementRate: 4.2, avgViewsPerVideo: 180000, avgUploadFrequency: '4x/week' },
  'music':       { label: 'Music',       avgEngagementRate: 3.1, avgViewsPerVideo: 320000, avgUploadFrequency: '2x/week' },
  'news':        { label: 'News',        avgEngagementRate: 1.8, avgViewsPerVideo: 95000,  avgUploadFrequency: '7x/week' },
  'education':   { label: 'Education',   avgEngagementRate: 5.1, avgViewsPerVideo: 120000, avgUploadFrequency: '2x/week' },
  'tech':        { label: 'Tech',        avgEngagementRate: 3.4, avgViewsPerVideo: 210000, avgUploadFrequency: '3x/week' },
  'finance':     { label: 'Finance',     avgEngagementRate: 2.1, avgViewsPerVideo: 85000,  avgUploadFrequency: '3x/week' },
  'lifestyle':   { label: 'Lifestyle',   avgEngagementRate: 3.8, avgViewsPerVideo: 150000, avgUploadFrequency: '3x/week' },
  'fitness':     { label: 'Fitness',     avgEngagementRate: 4.5, avgViewsPerVideo: 95000,  avgUploadFrequency: '4x/week' },
  'food':        { label: 'Food',        avgEngagementRate: 4.0, avgViewsPerVideo: 130000, avgUploadFrequency: '2x/week' },
  'travel':      { label: 'Travel',      avgEngagementRate: 3.6, avgViewsPerVideo: 175000, avgUploadFrequency: '2x/week' },
  'comedy':      { label: 'Comedy',      avgEngagementRate: 4.8, avgViewsPerVideo: 290000, avgUploadFrequency: '2x/week' },
  'beauty':      { label: 'Beauty',      avgEngagementRate: 3.9, avgViewsPerVideo: 110000, avgUploadFrequency: '3x/week' },
  'sports':      { label: 'Sports',      avgEngagementRate: 2.9, avgViewsPerVideo: 220000, avgUploadFrequency: '5x/week' },
  'default':     { label: 'YouTube avg', avgEngagementRate: 3.2, avgViewsPerVideo: 140000, avgUploadFrequency: '2x/week' },
}
