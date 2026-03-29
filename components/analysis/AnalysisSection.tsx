import { cn } from '@/lib/utils'

interface AnalysisSectionProps {
  title: string
  children: React.ReactNode
  className?: string
  /** Spacing between stacked children inside the section (default matches dashboard charts). */
  contentClassName?: string
}

export function AnalysisSection({
  title,
  children,
  className,
  contentClassName,
}: AnalysisSectionProps) {
  return (
    <section className={cn('flex flex-col gap-5', className)}>
      <h2
        className="text-xl font-semibold tracking-tight"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
      >
        {title}
      </h2>
      <div className={cn('flex w-full min-w-0 flex-col gap-6', contentClassName)}>{children}</div>
    </section>
  )
}
