import type { ReactNode } from 'react'
import { MatchHoleBar } from '@/components/tour/hole-strip'
import { fmtPts } from '@/components/tour/tour-tally'
import { matchIsPending, type TourMatchView } from '@/lib/tour-board'
import { TEAM_BLUE, TEAM_RED } from '@/lib/tour-colors'
import { profileFirstName } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TourTeam } from '@/lib/types'

export function TourMatchCard({
  view,
  onClick,
  children,
}: {
  view: TourMatchView
  onClick?: () => void
  children?: ReactNode
}) {
  const pending = matchIsPending(view)
  const live = view.computed.holesPlayed > 0 && !view.computed.closed
  const total = pending
    ? 'Pending'
    : view.computed.closed
      ? `${fmtPts(view.computed.points93)}–${fmtPts(view.computed.points91)}`
      : view.computed.holesPlayed === 0
        ? 'Not started'
        : view.computed.statusLabel
  const statusColor =
    live && view.computed.leader === '93s'
      ? TEAM_BLUE
      : live && view.computed.leader === '91s'
        ? TEAM_RED
        : undefined

  const inner = (
    <>
      <div className="px-3 pt-3 pb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-muted-foreground">
          Match {view.matchNumber}
          {live && ` · thru ${view.computed.holesPlayed}`}
        </span>
        <span
          className={cn('text-sm font-black num', pending && 'text-muted-foreground')}
          style={{ color: statusColor }}
        >
          {total}
        </span>
      </div>
      <div className="px-3 flex items-center gap-2 mb-2.5">
        <SideNames team={view.match.team_a} players={view.playersA} />
        <span className="text-[11px] font-black text-muted-foreground w-6 text-center">vs</span>
        <SideNames team={view.match.team_b} players={view.playersB} align="right" />
      </div>
      <div className="px-3 pb-3">
        <MatchHoleBar holes={view.computed.holes} pending={pending} tone="light" className="h-3" />
      </div>
      {children}
    </>
  )

  const frame = 'w-full rounded-2xl overflow-hidden bg-card border border-border text-left'

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={frame}>
        {inner}
      </button>
    )
  }

  return <div className={frame}>{inner}</div>
}

function SideNames({
  team,
  players,
  align,
}: {
  team: TourTeam
  players: TourMatchView['playersA']
  align?: 'right'
}) {
  return (
    <div className={cn('flex-1 min-w-0', align === 'right' && 'text-right')}>
      <span
        className="text-[10px] font-black px-1.5 py-0.5 rounded text-white"
        style={{ backgroundColor: team === '93s' ? TEAM_BLUE : TEAM_RED }}
      >
        {team}
      </span>
      <p className="text-sm font-bold mt-1 truncate">
        {players.length ? players.map((p) => profileFirstName(p.profile)).join(' / ') : 'TBD'}
      </p>
    </div>
  )
}
