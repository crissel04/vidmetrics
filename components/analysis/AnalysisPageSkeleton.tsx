import { ChannelHeaderSkeleton } from '@/components/channel/ChannelHeaderSkeleton'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Visible on `--bg-app` where default `bg-muted` matches the page (light theme). */
const skCanvas = '!bg-[var(--skeleton-on-canvas)]'

function SectionHeadingSkeleton() {
  return <Skeleton className={cn('h-7 w-56 max-w-full rounded-md', skCanvas)} />
}

const cardSurface = 'rounded-xl border border-[var(--border)] bg-[var(--bg-card)]'

/** Everything below the channel header row (Overview, charts, table, …). */
export function AnalysisPageBodySkeleton() {
  return (
    <div className="flex flex-col gap-12">
        {/* Overview — 4 MetricCards */}
        <section className="flex flex-col gap-5">
          <SectionHeadingSkeleton />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`${cardSurface} space-y-3 p-6`}>
                <Skeleton className="h-3 w-28 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </section>

        {/* Momentum & benchmarks */}
        <section className="flex flex-col gap-5">
          <SectionHeadingSkeleton />
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className={`${cardSurface} space-y-4 p-6`}>
                <Skeleton className="h-3 w-32 rounded-md" />
                <div className="flex flex-wrap items-end gap-3">
                  <Skeleton className="h-14 w-16 rounded-md" />
                  <Skeleton className="h-7 w-28 rounded-md" />
                </div>
                <div className="border-t border-dashed border-[var(--border-subtle)] pt-3">
                  <Skeleton className="h-10 w-full max-w-md rounded-md" />
                </div>
              </div>
              <div className={`${cardSurface} flex flex-col p-6`}>
                <Skeleton className="mb-2 h-3 w-36 rounded-md" />
                <Skeleton className="h-6 w-44 rounded-md" />
                <div className="mt-auto flex min-w-0 gap-1.5 pt-6">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 min-w-0 flex-1 basis-0 rounded-md" />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className={cn('h-5 w-44 rounded-md', skCanvas)} />
                <Skeleton className={cn('h-3.5 w-3.5 shrink-0 rounded-full', skCanvas)} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={`${cardSurface} space-y-3 p-5`}>
                    <Skeleton className="h-3 w-28 rounded-md" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-9 w-20 rounded-md" />
                      <Skeleton className="h-6 w-6 shrink-0 rounded-md" />
                    </div>
                    <div className="border-t border-dashed border-[var(--border-subtle)] pt-2">
                      <Skeleton className="h-3 w-full rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative pl-4 pr-4 pb-2">
                <div
                  className="pointer-events-none absolute top-0 bottom-8 left-[26px] w-px -translate-x-1/2 bg-[var(--insight-timeline-rail)]"
                  aria-hidden
                />
                <Skeleton className={cn('mb-3 ml-[34px] h-4 w-52 rounded-md', skCanvas)} />
                <ul className="m-0 list-none space-y-4 p-0">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <li key={i} className="flex gap-3.5">
                      <div className="flex w-5 shrink-0 justify-center pt-1">
                        <Skeleton className={cn('h-2 w-2 shrink-0 rounded-full', skCanvas)} />
                      </div>
                      <Skeleton
                        className={cn('h-4 min-w-0 flex-1 rounded-md', skCanvas)}
                        style={{ maxWidth: i % 2 ? '85%' : '100%' }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Performance — 2×2 charts + upload frequency */}
        <section className="flex flex-col gap-5">
          <SectionHeadingSkeleton />
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className={`${cardSurface} p-6`}>
                  <Skeleton className="mb-4 h-4 w-40 rounded-md" />
                  <Skeleton className="h-[220px] w-full rounded-md" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className={`${cardSurface} p-6`}>
                  <Skeleton className="mb-4 h-4 w-44 rounded-md" />
                  <Skeleton className="h-[220px] w-full rounded-md" />
                </div>
              ))}
            </div>
            <div className={`${cardSurface} p-6`}>
              <Skeleton className="mb-4 h-4 w-48 rounded-md" />
              <Skeleton className="h-[200px] w-full rounded-md" />
            </div>
          </div>
        </section>

        {/* Content insights — title pattern card + takeaways rail */}
        <section className="flex flex-col gap-5">
          <SectionHeadingSkeleton />
          <div className="flex flex-col gap-5">
            <div className={`${cardSurface} shadow-none`}>
              <div className="space-y-1 border-b border-transparent px-6 pb-3 pt-6">
                <Skeleton className="h-4 w-52 rounded-md" />
                <Skeleton className="h-3 w-72 max-w-full rounded-md" />
              </div>
              <div className="px-6 pb-4 pt-0">
                <div
                  className="overflow-hidden rounded-md border"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <div className="grid grid-cols-[1fr_4.5rem_5.5rem_6.5rem] gap-0 border-b border-solid border-[var(--border-subtle)] bg-[var(--border-subtle)] px-3 py-3">
                    <Skeleton className="h-3 w-16 rounded-md" />
                    <Skeleton className="h-3 w-12 justify-self-end rounded-md" />
                    <Skeleton className="h-3 w-16 justify-self-end rounded-md" />
                    <Skeleton className="h-3 w-20 justify-self-end rounded-md" />
                  </div>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_4.5rem_5.5rem_6.5rem] gap-0 border-b border-dashed border-[var(--border)] px-3 py-3 last:border-b-0"
                    >
                      <Skeleton className="h-4 w-full max-w-[200px] rounded-md" />
                      <Skeleton className="h-4 w-8 justify-self-end rounded-md" />
                      <Skeleton className="h-4 w-14 justify-self-end rounded-md" />
                      <Skeleton className="h-4 w-12 justify-self-end rounded-md" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="relative pl-4 pr-4">
              <div
                className="pointer-events-none absolute top-0 bottom-6 left-[26px] w-px -translate-x-1/2 bg-[var(--insight-timeline-rail)]"
                aria-hidden
              />
              <Skeleton className={cn('mb-4 ml-[34px] h-4 w-40 rounded-md', skCanvas)} />
              <ul className="m-0 list-none space-y-5 p-0">
                {Array.from({ length: 3 }).map((_, i) => (
                  <li key={i} className="flex gap-3.5">
                    <div className="flex w-5 shrink-0 justify-center pt-1">
                      <Skeleton className={cn('h-2 w-2 shrink-0 rounded-full', skCanvas)} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className={cn('h-4 w-full rounded-md', skCanvas)} />
                      <Skeleton className={cn('h-4 max-w-[420px] rounded-md', skCanvas)} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Posting schedule — heatmap card */}
        <section className="flex flex-col gap-5">
          <SectionHeadingSkeleton />
          <div className={`${cardSurface} p-6`}>
            <Skeleton className="mb-4 h-4 w-40 rounded-md" />
            <div className="grid grid-cols-9 gap-1">
              {Array.from({ length: 63 }).map((_, i) => (
                <Skeleton key={i} className="h-[22px] w-full rounded-sm" />
              ))}
            </div>
          </div>
        </section>

        {/* AI insights — 2×2 cards + content gaps rail */}
        <section className="flex flex-col gap-5">
          <SectionHeadingSkeleton />
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`${cardSurface} shadow-none`}>
                  <div className="space-y-3 px-4 py-4 sm:px-5">
                    <div className="flex items-center gap-2.5 border-b border-dashed border-[var(--border-subtle)] pb-2.5">
                      <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
                      <Skeleton className="h-4 w-36 rounded-md" />
                    </div>
                    <Skeleton className="h-[4.5rem] w-full rounded-md" />
                  </div>
                </div>
              ))}
            </div>
            <div className="relative pl-4 pr-4">
              <div
                className="pointer-events-none absolute top-0 bottom-6 left-[26px] w-px -translate-x-1/2 bg-[var(--insight-timeline-rail)]"
                aria-hidden
              />
              <Skeleton className={cn('mb-1 ml-[34px] h-4 w-32 rounded-md', skCanvas)} />
              <Skeleton className={cn('mb-4 ml-[34px] h-3 w-64 max-w-full rounded-md', skCanvas)} />
              <ul className="m-0 list-none space-y-5 p-0">
                {Array.from({ length: 3 }).map((_, i) => (
                  <li key={i} className="flex gap-3.5">
                    <div className="flex w-5 shrink-0 justify-center pt-1">
                      <Skeleton className={cn('h-2 w-2 shrink-0 rounded-full', skCanvas)} />
                    </div>
                    <Skeleton className={cn('h-[3.25rem] min-w-0 flex-1 rounded-md', skCanvas)} />
                  </li>
                ))}
              </ul>
              <Skeleton className={cn('ml-4 mt-4 h-8 w-52 rounded-md', skCanvas)} />
            </div>
          </div>
        </section>

        {/* Video library */}
        <section className="flex flex-col gap-5">
          <SectionHeadingSkeleton />
          <div className={`${cardSurface} shadow-none overflow-hidden`}>
            <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] p-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-28 rounded-md" />
                <Skeleton className="h-3 w-48 rounded-md" />
              </div>
              <Skeleton className="h-8 w-28 shrink-0 rounded-md" />
            </div>
            <div
              className="flex flex-wrap items-center gap-3 border-b px-4 py-3"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <Skeleton className="h-8 w-[11.5rem] rounded-lg" />
              <Skeleton className="h-8 w-[17rem] max-w-full rounded-lg" />
              <Skeleton className="h-8 min-w-[200px] flex-1 rounded-md" />
            </div>
            <div
              className="overflow-hidden rounded-none border-x-0 border-b-0 border-t"
              style={{ borderTopWidth: 1, borderTopStyle: 'solid', borderColor: 'var(--border-subtle)' }}
            >
              <div
                className="grid gap-0 border-b border-solid border-[var(--border-subtle)] bg-[var(--border-subtle)] px-3 py-3"
                style={{
                  gridTemplateColumns: 'minmax(8rem,1.2fr) 5.5rem 4rem 4rem 4.5rem 5rem 5rem 4.5rem 4.5rem',
                }}
              >
                <Skeleton className="h-3 w-10 justify-self-start rounded-md" />
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-10 justify-self-end rounded-md" />
                ))}
              </div>
              {Array.from({ length: 8 }).map((_, row) => (
                <div
                  key={row}
                  className="grid gap-0 border-b border-dashed border-[var(--border)] px-3 py-2.5 last:border-b-0"
                  style={{
                    gridTemplateColumns: 'minmax(8rem,1.2fr) 5.5rem 4rem 4rem 4.5rem 5rem 5rem 4.5rem 4.5rem',
                  }}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Skeleton className="h-9 w-14 shrink-0 rounded-md" />
                    <Skeleton className="h-4 min-w-0 flex-1 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-full justify-self-end rounded-md" />
                  <Skeleton className="h-4 w-full justify-self-end rounded-md" />
                  <Skeleton className="h-4 w-full justify-self-end rounded-md" />
                  <Skeleton className="h-4 w-full justify-self-end rounded-md" />
                  <Skeleton className="h-4 w-full justify-self-end rounded-md" />
                  <Skeleton className="h-4 w-full justify-self-end rounded-md" />
                  <Skeleton className="h-4 w-full justify-self-end rounded-md" />
                  <Skeleton className="h-7 w-16 justify-self-end rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </section>
    </div>
  )
}

export function AnalysisPageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <ChannelHeaderSkeleton />
      <AnalysisPageBodySkeleton />
    </div>
  )
}
