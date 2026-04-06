import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { ChevronLeft, AlertTriangle } from 'lucide-react'
import { useWagers } from '@/hooks/use-data'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { formatDate } from '@/lib/format'

export function AdminDisputesPage() {
  const navigate = useNavigate()
  const { data: allWagers = [] } = useWagers()
  const disputes = allWagers.filter((w) => w.status === 'disputed')

  return (
    <div className="py-4">
      <div className="px-4 mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-black">Wager Disputes</h1>
      </div>

      <div className="px-4 space-y-4">
        {disputes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">✅</p>
            <p className="font-semibold">No active disputes</p>
            <p className="text-sm text-muted-foreground mt-1">All wager results are confirmed</p>
          </div>
        ) : (
          disputes.map((wager) => (
            <div key={wager.id} className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-bold text-destructive">Disputed</span>
                <span className="text-xs text-muted-foreground ml-auto">€{wager.amount}</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <PlayerAvatar player={wager.proposer} size="xs" />
                  <span className="text-sm font-medium">{wager.proposer.display_name}</span>
                </div>
                <span className="text-muted-foreground text-xs">vs</span>
                <div className="flex items-center gap-2">
                  <PlayerAvatar player={wager.opponent} size="xs" />
                  <span className="text-sm font-medium">{wager.opponent.display_name}</span>
                </div>
              </div>

              {wager.result_winner && (
                <p className="text-xs text-muted-foreground">
                  Claimed winner: {wager.result_winner.display_name}
                  {wager.result_margin && ` · ${wager.result_margin}`}
                  {wager.result_played_at && ` · ${formatDate(wager.result_played_at)}`}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  style={{ backgroundColor: 'oklch(0.29 0.072 160)' }}
                >
                  Award to {wager.proposer.display_name}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  Award to {wager.opponent.display_name}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
