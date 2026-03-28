import { ChannelTabBar } from '@/components/layout/ChannelTabBar'

export default function AnalysisLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div
        className="-mt-6 mb-0 border-b px-6"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <ChannelTabBar />
      </div>
      {children}
    </>
  )
}
