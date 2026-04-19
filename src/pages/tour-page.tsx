import { useNavigate } from 'react-router'
import { useTourLeaderboard, useTourDays, useTourPlayers } from '@/hooks/use-data'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronRight, Flag } from 'lucide-react'
import { profileDisplayName } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Profile, TourPlayer, TourTeam } from '@/lib/types'

const GREEN      = 'oklch(0.22 0.068 157)'
const GREEN_DARK = 'oklch(0.17 0.055 157)'
const GOLD       = 'oklch(0.80 0.14 72)'
const GOLD_FG    = 'oklch(0.18 0.06 60)'

type TourPlayerRow = TourPlayer & { profile: Profile }

export function TourPage() {
  const navigate = useNavigate()
  const { data: leaderboard, isLoading: lbLoading } = useTourLeaderboard()
  const { data: days, isLoading: daysLoading } = useTourDays()
  const { data: tourPlayers } = useTourPlayers()

  const team93sPlayers = tourPlayers?.filter((tp) => tp.team === '93s') ?? []
  const team91sPlayers = tourPlayers?.filter((tp) => tp.team === '91s') ?? []

  return <TourComingSoon />

  // Live tour page (re-enable when tour goes live)
  // eslint-disable-next-line no-unreachable
  return (
    <div className="py-4">
      {/* Tour header */}
      <div
        className="mx-4 mb-5 rounded-2xl p-5 overflow-hidden relative"
        style={{ backgroundColor: 'oklch(0.22 0.068 157)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-0.5">Tour 2026</p>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Adare Manor
            </h1>
            <p className="text-sm text-white/60 mt-0.5">Apr 18–20, 2026</p>
          </div>
          <Badge className="text-xs font-bold border-0 bg-white/20 text-white">
            Day 2 Live
          </Badge>
        </div>

        {/* Score board */}
        {lbLoading ? (
          <Skeleton className="h-20 rounded-xl" />
        ) : leaderboard && (
          <div className="flex rounded-xl overflow-hidden">
            {/* 93s */}
            <TeamScore
              team="93s"
              score={leaderboard['93s'].total}
              day1={leaderboard['93s'].day1}
              day2={leaderboard['93s'].day2}
              target={leaderboard.target}
            />
            {/* Divider */}
            <div className="w-px bg-white/10" />
            {/* 91s */}
            <TeamScore
              team="91s"
              score={leaderboard['91s'].total}
              day1={leaderboard['91s'].day1}
              day2={leaderboard['91s'].day2}
              target={leaderboard.target}
            />
          </div>
        )}

        {/* Target indicator */}
        {leaderboard && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${((leaderboard['93s'].total + leaderboard['91s'].total) / (leaderboard.target * 2)) * 100}%`,
                  backgroundColor: 'oklch(0.80 0.14 72)',
                }}
              />
            </div>
            <span className="text-xs text-white/60">
              Target: {leaderboard.target}
            </span>
          </div>
        )}
      </div>

      {/* Days */}
      <div className="px-4 mb-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Schedule</h2>
        <div className="space-y-2">
          {daysLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
          ) : (
            days?.map((day) => (
              <button
                key={day.id}
                onClick={() => navigate(`/tour/day/${day.day_number}`)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card active:scale-[0.99] transition-transform text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">Day {day.day_number}</span>
                    <StatusDot status={day.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{day.format.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{day.played_at}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="px-4 mb-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickLinkCard
            icon="🏆"
            title="Green Jacket"
            subtitle="Individual standings"
            onClick={() => navigate('/tour/green-jacket')}
          />
          <QuickLinkCard
            icon="🎰"
            title="Tour Chumps"
            subtitle="Fantasy picks"
            onClick={() => navigate('/tour/chumps')}
          />
        </div>
      </div>

      {/* Team rosters */}
      <div className="px-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Teams</h2>
        <div className="grid grid-cols-2 gap-3">
          <TeamRoster team="93s" players={team93sPlayers.slice(0, 4)} total={team93sPlayers.length} />
          <TeamRoster team="91s" players={team91sPlayers.slice(0, 4)} total={team91sPlayers.length} />
        </div>
      </div>
    </div>
  )
}

function TeamScore({
  team,
  score,
  day1,
  day2,
}: {
  team: TourTeam
  score: number
  day1: number
  day2: number
  target?: number
}) {
  const color = team === '93s' ? 'oklch(0.42 0.15 260)' : 'oklch(0.50 0.21 26)'
  return (
    <div className="flex-1 p-4 text-center">
      <div
        className="text-xs font-black uppercase tracking-widest mb-2 px-2 py-0.5 rounded-full inline-block"
        style={{ backgroundColor: color, color: 'white' }}
      >
        {team}
      </div>
      <div className="text-5xl font-black text-white leading-none">{score}</div>
      <div className="flex justify-center gap-2 mt-2 text-xs text-white/50">
        <span>D1: {day1}</span>
        <span>D2: {day2}</span>
      </div>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    setup: 'bg-gray-400',
    locked: 'bg-yellow-400',
    in_progress: 'bg-green-400',
    complete: 'bg-blue-400',
  }
  return (
    <span className={cn('h-2 w-2 rounded-full', colors[status] ?? 'bg-gray-400')} />
  )
}

function QuickLinkCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: string
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-5 rounded-xl border border-border bg-card active:scale-[0.97] transition-transform gap-2"
    >
      <span className="text-3xl">{icon}</span>
      <div className="text-center">
        <p className="font-bold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </button>
  )
}

function TourComingSoon() {
  return (
    <div className="py-4">
      <div
        className="mx-4 mb-5 rounded-2xl p-5 overflow-hidden relative"
        style={{ backgroundColor: GREEN }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-0.5">Tour 2026</p>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Overberg Tour 2026
            </h1>
          </div>
          <Badge className="text-xs font-bold border-0 bg-white/20 text-white">
            Coming Soon
          </Badge>
        </div>

        {/* Scoreboard — hardcoded 0 – 0 */}
        <div className="flex rounded-xl overflow-hidden">
          <TeamScore team="93s" score={0} day1={0} day2={0} />
          <div className="w-px bg-white/10" />
          <TeamScore team="91s" score={0} day1={0} day2={0} />
        </div>
      </div>

      {/* Coming soon message */}
      <div className="mx-4 rounded-2xl bg-card ring-1 ring-black/[0.04] shadow-sm flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
        <div
          className="h-14 w-14 rounded-full flex items-center justify-center mb-1"
          style={{ backgroundColor: `${GOLD}18` }}
        >
          <Flag className="h-7 w-7" style={{ color: GOLD }} />
        </div>
        <p className="text-base font-black text-foreground">Schedule coming soon</p>
        <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed">
          The Overberg Tour 2026 schedule and live scores will appear here once the season kicks off.
        </p>
      </div>
    </div>
  )
}

function TeamRoster({
  team,
  players,
  total,
}: {
  team: TourTeam
  players: TourPlayerRow[]
  total: number
}) {
  const color = team === '93s' ? 'oklch(0.42 0.15 260)' : 'oklch(0.50 0.21 26)'

  return (
    <div
      className="rounded-xl p-3 space-y-2"
      style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
    >
      <div
        className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block"
        style={{ backgroundColor: color, color: 'white' }}
      >
        {team}
      </div>
      {players.map((p) => (
        <div key={p.id} className="flex items-center gap-2">
          <PlayerAvatar player={p.profile} size="xs" />
          <span className="text-xs font-medium truncate">{profileDisplayName(p.profile)}</span>
        </div>
      ))}
      {total > 4 && (
        <p className="text-xs text-muted-foreground">+{total - 4} more</p>
      )}
    </div>
  )
}
