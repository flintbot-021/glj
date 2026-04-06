import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth-store'
import { PLAYERS } from '@/lib/mock-data'
import { PlayerAvatar } from '@/components/ui/player-avatar'

export function AuthPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [showPlayerPicker, setShowPlayerPicker] = useState(false)
  const setCurrentPlayer = useAuthStore((s) => s.setCurrentPlayer)
  const navigate = useNavigate()

  const handleSendLink = (e: React.FormEvent) => {
    e.preventDefault()
    // In dev mode, show player picker
    setShowPlayerPicker(true)
  }

  if (showPlayerPicker) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ backgroundColor: 'oklch(0.29 0.072 160)' }}>
        <div className="flex-1 flex flex-col px-6 pt-16">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-1">
              Dev Mode
            </p>
            <h2 className="text-2xl font-black text-white">Who are you?</h2>
            <p className="text-white/60 text-sm mt-1">Select a player to sign in as</p>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pb-8">
            {PLAYERS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setCurrentPlayer(p)
                  navigate('/')
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/10 active:bg-white/20 transition-colors text-left"
              >
                <PlayerAvatar player={p} size="md" />
                <div>
                  <p className="font-semibold text-white">{p.display_name}</p>
                  <p className="text-xs text-white/50">HCP {p.handicap}</p>
                </div>
                {p.is_admin && (
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                    Admin
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6" style={{ backgroundColor: 'oklch(0.29 0.072 160)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
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

        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-xl font-bold text-white">Check your email</h2>
            <p className="text-white/60 mt-2 text-sm">
              We've sent a magic link to <strong className="text-white">{email}</strong>
            </p>
            <Button
              variant="ghost"
              className="mt-6 text-white/60 hover:text-white"
              onClick={() => setSent(false)}
            >
              Use a different email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSendLink} className="space-y-4">
            <div>
              <Label className="text-white/70 text-sm">Email address</Label>
              <Input
                type="email"
                className="mt-1.5 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/40"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-bold"
              style={{ backgroundColor: 'oklch(0.91 0.19 106)', color: 'oklch(0.20 0.07 150)' }}
            >
              Send Magic Link
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
