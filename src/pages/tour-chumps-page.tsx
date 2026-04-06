import { useNavigate } from 'react-router'
import { useTourChumps, useTourPlayers } from '@/hooks/use-data'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, Star } from 'lucide-react'
import type { TourTeam } from '@/lib/types'

export function TourChumpsPage() {
  const navigate = useNavigate()
  const { data: entries, isLoading } = useTourChumps()
  const { data: tourPlayers } = useTourPlayers()

  const teamColor = (team: TourTeam) =>
    team === '93s' ? 'oklch(0.42 0.15 260)' : 'oklch(0.50 0.21 26)'

  return (
    <div className="py-4">
      <div className="px-4 mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tour')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-black">Tour Chumps</h1>
          <p className="text-sm text-muted-foreground">Fantasy picks · Picks locked</p>
        </div>
      </div>

      {/* All 16 seeds for reference */}
      {tourPlayers && (
        <div className="px-4 mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Player Seeds</h2>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {[...tourPlayers].sort((a, b) => a.seed - b.seed).map((p) => (
              <div
                key={p.id}
                className="flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl border border-border bg-card min-w-[64px]"
              >
                <span className="text-xs font-bold text-muted-foreground">#{p.seed}</span>
                <PlayerAvatar player={p.profile} size="xs" />
                <span className="text-[9px] font-semibold text-center leading-tight" style={{ maxWidth: 56 }}>
                  {p.profile.display_name.split(' ')[0]}
                </span>
                <span
                  className="text-[8px] font-black px-1 rounded text-white"
                  style={{ backgroundColor: teamColor(p.team) }}
                >
                  {p.team}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Picks leaderboard */}
      <div className="px-4 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Leaderboard</h2>

        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)
        ) : (
          entries?.map((entry, idx) => (
            <div key={entry.pick.id} className="rounded-xl border border-border bg-card p-4">
              {/* Picker header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black w-5 text-center ${
                    idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-muted-foreground'
                  }`}>
                    {idx + 1}
                  </span>
                  <PlayerAvatar player={entry.picker} size="sm" />
                  <span className="font-bold text-sm">{entry.picker.display_name}</span>
                </div>
                <span className="text-lg font-black" style={{ color: 'oklch(0.91 0.19 106)' }}>
                  {entry.total_points} pts
                </span>
              </div>

              {/* Picks */}
              <div className="flex gap-2">
                {entry.picks.map((pick) => {
                  const isCaptain = pick.id === entry.captain.id
                  return (
                    <div
                      key={pick.id}
                      className="flex-1 flex flex-col items-center gap-1 p-2 rounded-lg relative"
                      style={{
                        backgroundColor: isCaptain ? 'oklch(0.91 0.19 106 / 0.15)' : 'oklch(0.96 0 0)',
                        border: isCaptain ? '1px solid oklch(0.91 0.19 106 / 0.5)' : '1px solid transparent',
                      }}
                    >
                      {isCaptain && (
                        <Star
                          className="absolute top-1 right-1 h-3 w-3"
                          style={{ color: 'oklch(0.91 0.19 106)', fill: 'oklch(0.91 0.19 106)' }}
                        />
                      )}
                      <PlayerAvatar player={pick.profile} size="xs" />
                      <span className="text-[9px] font-semibold text-center leading-tight">
                        {pick.profile.display_name.split(' ')[0]}
                      </span>
                      <span
                        className="text-[8px] font-black px-1 rounded text-white"
                        style={{ backgroundColor: teamColor(pick.team) }}
                      >
                        {pick.team}
                      </span>
                      {isCaptain && (
                        <span
                          className="text-[8px] font-bold"
                          style={{ color: 'oklch(0.91 0.19 106)' }}
                        >
                          D{entry.pick.captain_day}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
