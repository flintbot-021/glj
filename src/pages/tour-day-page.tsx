import { useParams, useNavigate } from 'react-router'
import { useTourDays, useTourDayMatches } from '@/hooks/use-data'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { TourTeam } from '@/lib/types'

export function TourDayPage() {
  const { dayNumber } = useParams<{ dayNumber: string }>()
  const navigate = useNavigate()
  const dayNum = Number(dayNumber)

  const { data: days } = useTourDays()
  const day = days?.find((d) => d.day_number === dayNum)
  const { data: matches, isLoading } = useTourDayMatches(day?.id ?? '')

  const teamColor = (team: TourTeam) =>
    team === '93s' ? 'oklch(0.42 0.15 260)' : 'oklch(0.50 0.21 26)'

  return (
    <div className="py-4">
      <div className="px-4 mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tour')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-black">Day {dayNum}</h1>
          {day && (
            <p className="text-sm text-muted-foreground">{day.format.name} · {day.played_at}</p>
          )}
        </div>
      </div>

      <div className="px-4 space-y-3">
        {isLoading || !day ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          matches?.map((match, i) => (
            <div key={match.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Match header */}
              <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Match {i + 1}
                </span>
                <MatchStatusBadge status={match.status} />
              </div>

              {/* Teams */}
              <div className="p-4">
                <div className="flex items-center gap-3">
                  {/* Team A */}
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <span
                        className="text-[10px] font-black px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: teamColor(match.team_a) }}
                      >
                        {match.team_a}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {match.players_a.map((p) => (
                        <div key={p.id} className="flex items-center gap-1.5">
                          <PlayerAvatar player={p.profile} size="xs" />
                          <span className="text-xs font-medium">{p.profile.display_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-center px-3">
                    {match.status === 'complete' ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-lg font-black"
                          style={{ color: teamColor(match.team_a) }}
                        >
                          {match.team_a_points}
                        </span>
                        <span className="text-muted-foreground">–</span>
                        <span
                          className="text-lg font-black"
                          style={{ color: teamColor(match.team_b) }}
                        >
                          {match.team_b_points}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground font-medium">vs</span>
                    )}
                  </div>

                  {/* Team B */}
                  <div className="flex-1 text-right">
                    <div className="flex items-center gap-1 justify-end mb-1">
                      <span
                        className="text-[10px] font-black px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: teamColor(match.team_b) }}
                      >
                        {match.team_b}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {match.players_b.map((p) => (
                        <div key={p.id} className="flex items-center gap-1.5 justify-end">
                          <span className="text-xs font-medium">{p.profile.display_name}</span>
                          <PlayerAvatar player={p.profile} size="xs" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Score button */}
                {match.status === 'in_progress' && (
                  <Button
                    className="w-full mt-3 gap-2"
                    style={{ backgroundColor: 'oklch(0.91 0.19 106)', color: 'oklch(0.20 0.07 150)' }}
                    onClick={() => navigate(`/tour/scoring/${match.id}`)}
                  >
                    Live Scoring
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
                {match.status === 'scheduled' && (
                  <Button
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() => navigate(`/tour/scoring/${match.id}`)}
                  >
                    Start Scoring
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function MatchStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    scheduled: { label: 'Scheduled', className: 'bg-gray-100 text-gray-700' },
    in_progress: { label: 'Live', className: 'bg-green-100 text-green-700' },
    complete: { label: 'Complete', className: 'bg-blue-100 text-blue-700' },
  }
  const { label, className } = configs[status] ?? configs.scheduled
  return (
    <Badge variant="outline" className={`text-[10px] font-bold border-0 ${className}`}>
      {status === 'in_progress' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />}
      {label}
    </Badge>
  )
}
