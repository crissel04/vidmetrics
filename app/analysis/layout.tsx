import { ChannelTabBar } from '@/components/layout/ChannelTabBar'

export default function AnalysisLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div
        className="-mx-6 -mt-6 mb-0 border-b"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <ChannelTabBar />
      </div>
      {children}
    </>
  )
}
