import type { ReactNode } from 'react'
import { MatchHoleBar } from '@/components/tour/hole-strip'
import { matchIsPending, type TourMatchView } from '@/lib/tour-board'
import { TEAM_BLUE, TEAM_RED, TOUR_GOLD, TOUR_GOLD_FG } from '@/lib/tour-colors'
import { matchFormatFromTourFormat } from '@/lib/tour-scoring'
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
  const decidedOpen = view.computed.decided && !view.match.card_confirmed_at
  const live = view.computed.holesPlayed > 0 && !view.computed.decided
  const slotsPerSide = sideSlots(view)
  const total = pending
    ? 'Not started'
    : view.computed.holesPlayed === 0 && !view.computed.decided
      ? 'Not started'
      : view.computed.statusLabel

  const leadTeam =
    view.computed.leader === '93s' || view.computed.leader === '91s'
      ? view.computed.leader
      : null
  const showLeadChrome = !pending && view.computed.holesPlayed > 0 && leadTeam != null
  const showHalfTag = !pending && view.computed.holesPlayed > 0 && view.computed.leader === 'half'
  const outlineColor = showLeadChrome ? (leadTeam === '93s' ? TEAM_BLUE : TEAM_RED) : undefined
  const statusTagBg = showLeadChrome
    ? leadTeam === '93s'
      ? TEAM_BLUE
      : TEAM_RED
    : showHalfTag
      ? TOUR_GOLD
      : undefined

  const inner = (
    <>
      <div className="px-3 pt-3 pb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-muted-foreground">
          Match {view.matchNumber}
          {live && ` · thru ${view.computed.holesPlayed}`}
          {decidedOpen && ' · finish card'}
          {view.match.wager_amount != null && ` · R${view.match.wager_amount}`}
        </span>
        {statusTagBg ? (
          <span
            className="text-[11px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md"
            style={{
              backgroundColor: statusTagBg,
              color: showHalfTag ? TOUR_GOLD_FG : 'white',
            }}
          >
            {total}
          </span>
        ) : (
          <span className={cn('text-sm font-black num', pending && 'text-muted-foreground')}>
            {total}
          </span>
        )}
      </div>
      <div className="px-3 flex items-center gap-2 mb-2.5">
        <SideNames team={view.match.team_a} players={view.playersA} slots={slotsPerSide} />
        <span className="text-[11px] font-black text-muted-foreground w-6 text-center">vs</span>
        <SideNames team={view.match.team_b} players={view.playersB} slots={slotsPerSide} align="right" />
      </div>
      <div className="px-3 pb-3">
        <MatchHoleBar holes={view.computed.holes} pending={pending} tone="light" className="h-3" />
      </div>
      {children}
    </>
  )

  const frame = cn(
    'w-full rounded-2xl overflow-hidden bg-card text-left border-2',
    outlineColor ? undefined : 'border-border',
  )
  const frameStyle = outlineColor ? { borderColor: outlineColor } : undefined

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={frame} style={frameStyle}>
        {inner}
      </button>
    )
  }

  return (
    <div className={frame} style={frameStyle}>
      {inner}
    </div>
  )
}

/** Match shell before admin creates the DB row — same layout, placeholder names. */
export function TourMatchPlaceholderCard({
  matchNumber,
  singles,
}: {
  matchNumber: number
  singles: boolean
}) {
  const slots: 1 | 2 = singles ? 1 : 2
  return (
    <div className="w-full rounded-2xl overflow-hidden bg-card border border-border text-left">
      <div className="px-3 pt-3 pb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-muted-foreground">Match {matchNumber}</span>
        <span className="text-sm font-black num text-muted-foreground">Not started</span>
      </div>
      <div className="px-3 flex items-center gap-2 mb-2.5">
        <SideNames team="93s" players={[]} slots={slots} />
        <span className="text-[11px] font-black text-muted-foreground w-6 text-center">vs</span>
        <SideNames team="91s" players={[]} slots={slots} align="right" />
      </div>
      <div className="px-3 pb-3">
        <MatchHoleBar holes={[]} pending tone="light" className="h-3" />
      </div>
    </div>
  )
}

function sideSlots(view: TourMatchView): 1 | 2 {
  const spec = matchFormatFromTourFormat(view.format)
  return spec.agg === 'individual' || spec.compare === 'lower_net' || spec.expectedMatches === 8 ? 1 : 2
}

function sidePlayerLabels(
  players: TourMatchView['playersA'],
  slots: 1 | 2,
): string {
  const names = players.map((p) => profileFirstName(p.profile))
  while (names.length < slots) {
    names.push(`Player ${names.length + 1}`)
  }
  return names.slice(0, slots).join(' / ')
}

function SideNames({
  team,
  players,
  slots,
  align,
}: {
  team: TourTeam
  players: TourMatchView['playersA']
  slots: 1 | 2
  align?: 'right'
}) {
  const empty = players.length === 0
  return (
    <div className={cn('flex-1 min-w-0', align === 'right' && 'text-right')}>
      <span
        className="text-[10px] font-black px-1.5 py-0.5 rounded text-white"
        style={{ backgroundColor: team === '93s' ? TEAM_BLUE : TEAM_RED }}
      >
        {team}
      </span>
      <p
        className={cn(
          'text-sm font-bold mt-1 truncate',
          empty && 'text-muted-foreground',
        )}
      >
        {sidePlayerLabels(players, slots)}
      </p>
    </div>
  )
}
