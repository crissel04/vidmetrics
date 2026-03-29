'use client'

import { useState } from 'react'
import { useSettings } from '@/lib/context/SettingsContext'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Trash2, RotateCcw, Keyboard, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'

export default function SettingsPage() {
  const { settings, updateSetting, resetSettings, clearAllData } = useSettings()
  const { setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-8 px-6 pt-2 fade-in">

      {/* Page header */}
      <div>
        <h1
          className="font-semibold text-2xl"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Preferences are saved automatically to your browser.
        </p>
      </div>

      {/* ── Account ── */}
      {user && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            Account
          </h2>
          <div
            className="flex items-center justify-between rounded-xl border p-4"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {user.email}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Signed in
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              style={{ color: 'var(--red-text)', borderColor: 'var(--border)' }}
              onClick={() => signOut()}
            >
              <LogOut size={13} />
              Sign out
            </Button>
          </div>
        </section>
      )}

      {/* ── Preferences ── */}
      <section>
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Preferences
        </h2>
        <div
          className="divide-y rounded-xl border"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
        >
          {/* Videos to fetch */}
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Videos per channel
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                More videos = better accuracy, slightly slower
              </p>
            </div>
            <select
              value={String(settings.videosToFetch)}
              onChange={(e) => {
                const num = parseInt(e.target.value, 10)
                if (num === 50 || num === 100 || num === 200) {
                  updateSetting('videosToFetch', num)
                }
              }}
              className="h-9 rounded-md border px-3 text-sm outline-none cursor-pointer"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Theme
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Light, dark, or follow your system
              </p>
            </div>
            <select
              value={settings.theme}
              onChange={(e) => {
                const v = e.target.value as 'light' | 'dark' | 'system'
                updateSetting('theme', v)
                setTheme(v)
              }}
              className="h-9 rounded-md border px-3 text-sm outline-none cursor-pointer"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Shortcuts ── */}
      <section>
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Keyboard shortcuts
        </h2>
        <div
          className="flex items-center justify-between rounded-xl border px-4 py-3.5"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            View all shortcuts
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            style={{ borderColor: 'var(--border)' }}
            onClick={() => {
              window.dispatchEvent(
                new KeyboardEvent('keydown', { key: '?' })
              )
            }}
          >
            <Keyboard size={14} />
            <span>Show</span>
            <kbd
              className="ml-1 text-[10px] rounded px-1.5 py-0.5 border font-mono"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              ?
            </kbd>
          </Button>
        </div>
      </section>

      {/* ── Data ── */}
      <section>
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Data
        </h2>
        <div
          className="divide-y rounded-xl border"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
        >
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Reset settings
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Restore all preferences to defaults
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              style={{ borderColor: 'var(--border)' }}
              onClick={resetSettings}
            >
              <RotateCcw size={13} />
              Reset
            </Button>
          </div>

          <div className="px-4 py-3.5">
            {!showClearConfirm ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Clear all data
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Remove tabs, recent channels, watchlist, and reports
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  style={{ color: 'var(--red-text)', borderColor: 'var(--border)' }}
                  onClick={() => setShowClearConfirm(true)}
                >
                  <Trash2 size={13} />
                  Clear
                </Button>
              </div>
            ) : (
              <div
                className="flex items-center gap-3 p-3 rounded-lg border"
                style={{ background: 'var(--red-subtle)', borderColor: 'var(--red-text)' }}
              >
                <p className="text-xs flex-1" style={{ color: 'var(--red-text)' }}>
                  This will clear your tabs, recent channels, watchlist, and reports. This cannot be undone.
                </p>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs h-7"
                    style={{ background: 'var(--red-text)', color: '#ffffff' }}
                    onClick={clearAllData}
                  >
                    Clear everything
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  )
}
