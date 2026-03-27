'use client'

import { useTimePeriod, type TimePeriod } from '@/lib/context/TimePeriodContext'

const OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '6m', label: '6m' },
  { value: '1y', label: '1y' },
  { value: 'all', label: 'All' },
]

interface TimePeriodSelectorProps {
  videosInPeriod?: number
  totalVideos?: number
}

export function TimePeriodSelector({ videosInPeriod, totalVideos }: TimePeriodSelectorProps) {
  const { period, setPeriod } = useTimePeriod()

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3">
        <div
          className="flex rounded-lg p-0.5"
          style={{ background: 'var(--bg-app)', border: '1px solid var(--border)' }}
        >
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className="text-xs px-3 py-1.5 rounded-md transition-colors duration-150"
              style={{
                background: period === opt.value ? 'var(--bg-card)' : 'transparent',
                color: period === opt.value ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: period === opt.value ? 500 : 400,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {videosInPeriod !== undefined && totalVideos !== undefined && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {videosInPeriod === totalVideos
              ? `${totalVideos} videos`
              : `${videosInPeriod} of ${totalVideos} videos`}
          </span>
        )}
      </div>

      {period !== 'all' && videosInPeriod !== undefined && videosInPeriod < 5 && (
        <p className="text-xs" style={{ color: 'var(--amber-text)' }}>
          Only {videosInPeriod} videos published in this period.
          This channel may post infrequently or recently started.
        </p>
      )}
    </div>
  )
}
