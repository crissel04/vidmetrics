'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { GitCompare, Check, Minus } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { CompareChart } from './CompareChart'
import type { ChannelInfo, Video, ChannelMetrics } from '@/lib/types'

interface ChannelData {
  channel: ChannelInfo
  videos: Video[]
  metrics: ChannelMetrics
}

interface CompareResult {
  channelA: ChannelData
  channelB: ChannelData
  aiSummary: string
}

interface ComparePanelProps {
  currentChannel: ChannelInfo
}

export function ComparePanel({ currentChannel }: ComparePanelProps) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CompareResult | null>(null)

  const handleCompare = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const channelAUrl = `https://www.youtube.com/channel/${currentChannel.id}`
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelAUrl, channelBUrl: url.trim() }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Comparison failed')
        setLoading(false)
        return
      }

      setResult(json)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setResult(null); setError(''); setUrl('') } }}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            style={{ borderColor: 'var(--border)' }}
          />
        }
      >
        <GitCompare size={14} />
        Compare
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Channels</DialogTitle>
        </DialogHeader>

        {/* Input for second channel */}
        <div className="flex gap-2">
          <Input
            placeholder="Paste a YouTube channel URL to compare..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
            style={{ borderColor: 'var(--border)' }}
          />
          <Button
            onClick={handleCompare}
            disabled={loading || !url.trim()}
            style={{ background: 'var(--accent)', color: '#ffffff' }}
          >
            {loading ? 'Loading...' : 'Compare'}
          </Button>
        </div>

        {error && (
          <p className="text-sm" style={{ color: 'var(--red-text)' }}>{error}</p>
        )}

        {loading && <CompareLoadingSkeleton />}

        {result && (
          <div className="flex flex-col gap-4 fade-in">
            {/* Channel overview row */}
            <div className="grid grid-cols-2 gap-4">
              <ChannelBadge channel={result.channelA.channel} />
              <ChannelBadge channel={result.channelB.channel} />
            </div>

            {/* Metrics table */}
            <MetricsTable a={result.channelA} b={result.channelB} />

            {/* Chart */}
            <CompareChart
              videosA={result.channelA.videos}
              videosB={result.channelB.videos}
              titleA={result.channelA.channel.title}
              titleB={result.channelB.channel.title}
            />

            {/* AI Summary */}
            {result.aiSummary && (
              <div
                className="rounded-xl border p-4 text-sm"
                style={{
                  borderColor: 'var(--accent-subtle)',
                  background: 'var(--accent-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--accent-text)' }}>
                  AI Head-to-Head
                </p>
                {result.aiSummary}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ChannelBadge({ channel }: { channel: ChannelInfo }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={channel.thumbnailUrl} alt={channel.title} />
        <AvatarFallback style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}>
          {channel.title.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {channel.title}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {formatNumber(channel.subscriberCount)} subs
        </p>
      </div>
    </div>
  )
}

const METRICS_ROWS: { label: string; key: string; format: (v: number | string) => string }[] = [
  { label: 'Avg Views/Video', key: 'avgViews', format: (v) => formatNumber(v as number) },
  { label: 'Engagement Rate', key: 'avgEngagementRate', format: (v) => `${(v as number).toFixed(2)}%` },
  { label: 'Upload Frequency', key: 'uploadFrequency', format: (v) => v as string },
  { label: 'Momentum Score', key: 'momentumScore', format: (v) => `${v}/100` },
]

function getMetricValue(metrics: ChannelMetrics, key: string): number | string {
  return (metrics as unknown as Record<string, number | string>)[key]
}

function MetricsTable({ a, b }: { a: ChannelData; b: ChannelData }) {
  const rows = [
    ...METRICS_ROWS.map(({ label, key, format }) => {
      const rawA = getMetricValue(a.metrics, key)
      const rawB = getMetricValue(b.metrics, key)
      return {
        label,
        valA: format(rawA),
        valB: format(rawB),
        numA: typeof rawA === 'number' ? rawA : null,
        numB: typeof rawB === 'number' ? rawB : null,
      }
    }),
    {
      label: 'Subscribers',
      valA: formatNumber(a.channel.subscriberCount),
      valB: formatNumber(b.channel.subscriberCount),
      numA: a.channel.subscriberCount,
      numB: b.channel.subscriberCount,
    },
  ]

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'var(--border)' }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'var(--bg-app)' }}>
            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Metric</th>
            <th className="text-right px-3 py-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
              {a.channel.title.slice(0, 20)}
            </th>
            <th className="text-right px-3 py-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
              {b.channel.title.slice(0, 20)}
            </th>
            <th className="text-center px-3 py-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Winner</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const winner = row.numA !== null && row.numB !== null
              ? row.numA > row.numB ? 'A' : row.numA < row.numB ? 'B' : 'tie'
              : null

            return (
              <tr key={row.label} style={{ borderTop: '1px solid var(--border)' }}>
                <td className="px-3 py-2" style={{ color: 'var(--text-primary)' }}>{row.label}</td>
                <td
                  className="text-right px-3 py-2 tabular-nums font-medium"
                  style={{ color: winner === 'A' ? 'var(--green-text)' : 'var(--text-primary)' }}
                >
                  {row.valA}
                </td>
                <td
                  className="text-right px-3 py-2 tabular-nums font-medium"
                  style={{ color: winner === 'B' ? 'var(--green-text)' : 'var(--text-primary)' }}
                >
                  {row.valB}
                </td>
                <td className="text-center px-3 py-2">
                  {winner === 'A' && <Check size={14} style={{ color: 'var(--green-text)', display: 'inline' }} />}
                  {winner === 'B' && <Check size={14} style={{ color: 'var(--green-text)', display: 'inline' }} />}
                  {winner === 'tie' && <Minus size={14} style={{ color: 'var(--text-muted)', display: 'inline' }} />}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function CompareLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
      <Skeleton className="h-[200px] w-full rounded-xl" />
      <Skeleton className="h-[250px] w-full rounded-xl" />
    </div>
  )
}
