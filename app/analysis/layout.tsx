import { ChannelTabBar } from '@/components/layout/ChannelTabBar'

export default function AnalysisLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div
        className="relative z-10 -mt-6 mb-0 flex items-center border-b px-6 py-1.5"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <ChannelTabBar />
      </div>
      {children}
    </>
  )
}
