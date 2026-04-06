import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Shield } from 'lucide-react'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { PLAYERS } from '@/lib/mock-data'
import { formatWalletBalance } from '@/lib/format'

export function AdminPlayersPage() {
  const navigate = useNavigate()

  return (
    <div className="py-4">
      <div className="px-4 mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-black">Players</h1>
          <p className="text-sm text-muted-foreground">{PLAYERS.length} registered players</p>
        </div>
      </div>

      <div className="px-4 space-y-2">
        {PLAYERS.map((player) => (
          <div key={player.id} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
            <PlayerAvatar player={player} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{player.display_name}</p>
                {player.is_admin && (
                  <Shield className="h-3.5 w-3.5 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">HCP {player.handicap} · {player.email}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold" style={{ color: 'oklch(0.65 0.18 50)' }}>
                {formatWalletBalance(player.wallet_balance)}
              </p>
              <p className="text-xs text-muted-foreground">wallet</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
