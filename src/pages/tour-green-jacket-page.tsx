import { useNavigate } from 'react-router'
import { useTourGreenJacket } from '@/hooks/use-data'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TourTeam } from '@/lib/types'

export function TourGreenJacketPage() {
  const navigate = useNavigate()
  const { data: entries, isLoading } = useTourGreenJacket()

  const teamColor = (team: TourTeam) =>
    team === '93s' ? 'oklch(0.42 0.15 260)' : 'oklch(0.50 0.21 26)'

  return (
    <div className="py-4">
      <div className="px-4 mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tour')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-black">Green Jacket</h1>
          <p className="text-sm text-muted-foreground">Individual standings</p>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-4 mb-2">
        <div className="w-5 mr-2" />
        <div className="flex-1" />
        <div className="flex gap-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="w-10 text-center">D1</span>
          <span className="w-10 text-center">D2</span>
          <span className="w-10 text-center">D3</span>
          <span className="w-10 text-right">Total</span>
        </div>
      </div>

      <div className="px-4 space-y-2">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
        ) : (
          entries?.map((entry, idx) => (
            <div
              key={entry.tour_player.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl',
                idx === 0 ? 'border-2' : 'bg-card border border-border'
              )}
              style={idx === 0 ? {
                borderColor: 'oklch(0.91 0.19 106)',
                backgroundColor: 'oklch(0.91 0.19 106 / 0.05)',
              } : undefined}
            >
              <span className={cn(
                'text-xs font-black w-5 text-center',
                idx === 0 && 'text-yellow-500',
                idx === 1 && 'text-gray-400',
                idx === 2 && 'text-amber-600',
              )}>
                {idx + 1}
              </span>
              <PlayerAvatar player={entry.profile} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold truncate">{entry.profile.display_name}</p>
                  <span
                    className="text-[9px] font-black px-1 py-0.5 rounded text-white flex-shrink-0"
                    style={{ backgroundColor: teamColor(entry.tour_player.team) }}
                  >
                    {entry.tour_player.team}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                {entry.day_points.map((dp) => (
                  <span key={dp.day} className="text-sm w-10 text-center text-muted-foreground">
                    {dp.points > 0 ? dp.points : '—'}
                  </span>
                ))}
                <span
                  className="text-sm font-black w-10 text-right"
                  style={{ color: entry.total_points > 0 ? 'oklch(0.91 0.19 106)' : undefined }}
                >
                  {entry.total_points > 0 ? entry.total_points : '—'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
