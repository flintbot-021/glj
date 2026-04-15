import { useState } from 'react'
import { Navigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase'

export function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const profile = useAuthStore((s) => s.profile)
  const isLoading = useAuthStore((s) => s.isLoading)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPending(true)
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setPending(false)
    if (signErr) {
      setError(signErr.message)
    }
  }

  if (!isLoading && profile) {
    return <Navigate to="/" replace />
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: 'oklch(0.29 0.072 160)' }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/50 mb-1">
            Welcome to
          </p>
          <h1
            className="text-5xl font-black tracking-tight text-white"
            style={{ fontFamily: "'DM Serif Display', serif", color: 'oklch(0.91 0.19 106)' }}
          >
            Road To Dias
          </h1>
          <p className="text-white/60 mt-2 text-sm">Your private golf competition</p>
        </div>

        <form onSubmit={(e) => void handleSignIn(e)} className="space-y-4">
          <div>
            <Label className="text-white/70 text-sm">Email</Label>
            <Input
              type="email"
              autoComplete="email"
              className="mt-1.5 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/40"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label className="text-white/70 text-sm">Password</Label>
            <Input
              type="password"
              autoComplete="current-password"
              className="mt-1.5 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/40"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <Button
            type="submit"
            className="w-full h-12 text-base font-bold disabled:opacity-60"
            style={{ backgroundColor: 'oklch(0.91 0.19 106)', color: 'oklch(0.20 0.07 150)' }}
            disabled={pending}
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
