'use client'

import { useState } from 'react'
import { useSettings } from '@/lib/context/SettingsContext'
import { useTheme } from 'next-themes'
import {
  Card, CardContent, CardHeader,
  CardTitle, CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Trash2, RotateCcw, Keyboard, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'

export default function SettingsPage() {
  const { settings, updateSetting, resetSettings, clearAllData } = useSettings()
  const { setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  return (
    <div className="mx-auto w-full max-w-[640px] space-y-6 px-6 fade-in">

      {/* Page header */}
      <div>
        <h1
          className="font-semibold text-xl"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Settings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Preferences are saved automatically to your browser.
        </p>
      </div>

      {user && (
        <Card style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }} className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle
              className="text-base font-semibold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              Account
            </CardTitle>
            <CardDescription style={{ color: 'var(--text-muted)' }}>
              Signed in as {user.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              style={{ color: 'var(--red-text)', borderColor: 'var(--border)' }}
              onClick={() => signOut()}
            >
              <LogOut size={13} />
              Sign out
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Analysis preferences */}
      <Card style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }} className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Analysis
          </CardTitle>
          <CardDescription style={{ color: 'var(--text-muted)' }}>
            Controls how channel data is fetched and displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Videos to fetch */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Videos to fetch per channel
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                More videos = better time period accuracy, slightly slower first load
              </p>
            </div>
            <Select
              value={String(settings.videosToFetch)}
              onValueChange={(v) => {
                if (!v) return
                const num = parseInt(v, 10)
                if (num === 50 || num === 100 || num === 200) {
                  updateSetting('videosToFetch', num)
                }
              }}
            >
              <SelectTrigger className="w-[100px]" style={{ borderColor: 'var(--border)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </CardContent>
      </Card>

      {/* Appearance */}
      <Card style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }} className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Theme
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Light, dark, or follow your system setting
              </p>
            </div>
            <Select
              value={settings.theme}
              onValueChange={(v) => {
                if (!v) return
                updateSetting('theme', v as 'light' | 'dark' | 'system')
                setTheme(v)
              }}
            >
              <SelectTrigger className="w-[120px]" style={{ borderColor: 'var(--border)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard shortcuts */}
      <Card style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }} className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Keyboard shortcuts
          </CardTitle>
          <CardDescription style={{ color: 'var(--text-muted)' }}>
            Open the full reference of navigation and analysis shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 w-full sm:w-auto justify-start"
            style={{ borderColor: 'var(--border)' }}
            onClick={() => {
              window.dispatchEvent(
                new KeyboardEvent('keydown', { key: '?' })
              )
            }}
          >
            <Keyboard size={15} />
            <span>Show shortcuts</span>
            <kbd
              className="ml-auto sm:ml-2 text-[10px] rounded px-1.5 py-0.5 border font-mono"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              ?
            </kbd>
          </Button>
        </CardContent>
      </Card>

      {/* Data management */}
      <Card style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }} className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Data
          </CardTitle>
          <CardDescription style={{ color: 'var(--text-muted)' }}>
            All data is stored locally in your browser
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            style={{ borderColor: 'var(--border)' }}
            onClick={resetSettings}
          >
            <RotateCcw size={13} />
            Reset settings to defaults
          </Button>

          <div>
            {!showClearConfirm ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                style={{ color: 'var(--red-text)', borderColor: 'var(--border)' }}
                onClick={() => setShowClearConfirm(true)}
              >
                <Trash2 size={13} />
                Clear all data
              </Button>
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
        </CardContent>
      </Card>

    </div>
  )
}
