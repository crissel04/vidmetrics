'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/context/AuthContext'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import AuthModal from './AuthModal'

export default function UserButton() {
  const { user, loading, signOut } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)

  if (loading) {
    return (
      <div className="h-8 w-8 flex items-center justify-center">
        <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs h-8"
          style={{ borderColor: 'var(--border)' }}
          onClick={() => setAuthOpen(true)}
        >
          Sign in
        </Button>
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </>
    )
  }

  const avatarUrl = user.user_metadata?.avatar_url
  const name = user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split('@')[0] ??
    'User'
  const initials = name.charAt(0).toUpperCase()

  return (
    <Link
      href="/settings"
      className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      title="Settings"
      aria-label="Open settings"
    >
      <Avatar className="h-7 w-7">
        <AvatarImage src={avatarUrl} alt={name} />
        <AvatarFallback
          className="text-xs"
          style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
    </Link>
  )
}
