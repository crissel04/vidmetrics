'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { LogOut, Settings, Loader2 } from 'lucide-react'
import AuthModal from './AuthModal'

export default function UserButton() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
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
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="rounded-full focus:outline-none">
            <Avatar className="h-7 w-7">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback
                className="text-xs"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        }
      />
      <DropdownMenuContent
        align="end"
        className="w-[200px] shadow-none"
        style={{ borderColor: 'var(--border)' }}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {name}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator style={{ background: 'var(--border-subtle)' }} />
        <DropdownMenuItem
          onClick={() => router.push('/settings')}
          className="gap-2 cursor-pointer text-sm"
        >
          <Settings size={13} />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator style={{ background: 'var(--border-subtle)' }} />
        <DropdownMenuItem
          onClick={signOut}
          className="gap-2 cursor-pointer text-sm"
          style={{ color: 'var(--red-text)' }}
        >
          <LogOut size={13} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
