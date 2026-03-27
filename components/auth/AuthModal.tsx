'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { signInWithGoogle, signInWithMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const handleGoogle = async () => {
    setLoadingGoogle(true)
    await signInWithGoogle()
  }

  const handleMagicLink = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }
    setLoadingEmail(true)
    const { error } = await signInWithMagicLink(email)
    setLoadingEmail(false)

    if (error) {
      toast.error(error)
      return
    }

    setMagicLinkSent(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[400px] shadow-none"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
      >
        <DialogHeader>
          <DialogTitle
            className="font-semibold text-lg"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Sign in to VidMetrics
          </DialogTitle>
          <DialogDescription className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Save your watchlist, reports, and comparisons across devices.
          </DialogDescription>
        </DialogHeader>

        {magicLinkSent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'var(--accent-subtle)' }}
            >
              <Mail size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
              Check your email
            </p>
            <p className="text-sm max-w-[280px]" style={{ color: 'var(--text-secondary)' }}>
              We sent a sign-in link to{' '}
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {email}
              </span>
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => {
                setMagicLinkSent(false)
                setEmail('')
              }}
            >
              Use a different email
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-2">

            {/* Google sign in */}
            <Button
              variant="outline"
              className="w-full gap-3 h-10"
              style={{ borderColor: 'var(--border)' }}
              onClick={handleGoogle}
              disabled={loadingGoogle}
            >
              {loadingGoogle ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" style={{ background: 'var(--border-subtle)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
              <Separator className="flex-1" style={{ background: 'var(--border-subtle)' }} />
            </div>

            {/* Magic link */}
            <div className="flex flex-col gap-2">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                style={{ borderColor: 'var(--border)' }}
              />
              <Button
                className="w-full gap-2"
                style={{ background: 'var(--accent)', color: '#ffffff' }}
                onClick={handleMagicLink}
                disabled={loadingEmail}
              >
                {loadingEmail ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Mail size={14} />
                )}
                Continue with Email
              </Button>
            </div>

            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              We'll send you a magic link — no password needed
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
