import type { CSSProperties } from 'react'
import { TEAM_BLUE, TEAM_RED, TOUR_GOLD } from '@/lib/tour-colors'
import { matchIsPending, type TourBoardDay, type TourMatchView } from '@/lib/tour-board'
import { expectedMatchCount } from '@/lib/tour-scoring'
import type { TourTeam } from '@/lib/types'

const SLOTS_PER_DAY = 4
const MIN_BAR_SLOTS = 16

export type TallyKind = 'pending' | 'to_play' | 'live' | 'won'

export interface TallySlot {
  kind: TallyKind
  team: TourTeam | 'half' | null
}

export function fmtPts(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

export function tallySlotFromMatch(m: TourMatchView | null): TallySlot {
  if (!m || matchIsPending(m)) return { kind: 'pending', team: null }
  if (m.computed.holesPlayed === 0) return { kind: 'to_play', team: null }
  const team =
    m.computed.leader === 'half' || (m.computed.closed && m.computed.points93 === 0.5)
      ? 'half'
      : m.computed.leader
  if (m.computed.closed) return { kind: 'won', team }
  return { kind: 'live', team }
}

export function padDayMatches(matches: TourMatchView[], size = SLOTS_PER_DAY): (TourMatchView | null)[] {
  const slots: (TourMatchView | null)[] = [...matches]
  while (slots.length < size) slots.push(null)
  return slots
}

export function barSlotCount(matchSlots: number): number {
  return Math.max(MIN_BAR_SLOTS, matchSlots)
}

export function TourTally({
  name,
  points93,
  points91,
  target,
  days,
}: {
  name: string
  points93: number
  points91: number
  target: number
  days: TourBoardDay[]
}) {
  const rows = [1, 2, 3].map((n) => days.find((d) => d.day.day_number === n) ?? null)
  const flattened = rows.flatMap((d, i) => padDayMatches(d?.matches ?? [], expectedMatchCount(d?.format, i + 1)))
  const totalSlots = barSlotCount(flattened.length)
  const barSlots: TallySlot[] = [
    ...flattened.map(tallySlotFromMatch),
    ...Array.from({ length: Math.max(0, totalSlots - flattened.length) }, () => ({
      kind: 'to_play' as const,
      team: null,
    })),
  ]
  const decided = points93 + points91
  const toPlay = Math.max(0, totalSlots - decided)
  const winAt = (target / totalSlots) * 100

  return (
    <div className="mx-4 mt-3 rounded-3xl overflow-hidden" style={{ backgroundColor: 'oklch(0.22 0.068 157)' }}>
      <div className="px-4 pt-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Golf Tour</p>
          <h1 className="rtd-display text-3xl text-white leading-none tracking-wide">{name}</h1>
        </div>
        <span className="text-[10px] font-bold text-white/50 mt-1 shrink-0">
          {totalSlots} pts · first to {fmtPts(target)}
        </span>
      </div>

      <div className="px-4 mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TeamPill team="93s" />
          <span className="text-4xl font-black text-white leading-none num">{fmtPts(points93)}</span>
        </div>
        <p className="text-[11px] text-white/45 text-center px-2">
          {toPlay === 0 ? 'All points decided' : `${fmtPts(toPlay)} ${toPlay === 1 ? 'point' : 'points'} to play`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-4xl font-black text-white leading-none num">{fmtPts(points91)}</span>
          <TeamPill team="91s" />
        </div>
      </div>

      <div className="px-4 mt-4 pb-1 relative">
        <p
          className="absolute -top-3 text-[9px] font-bold whitespace-nowrap"
          style={{ left: `${winAt}%`, transform: 'translateX(-50%)', color: TOUR_GOLD }}
        >
          {fmtPts(target)} wins
        </p>
        <div className="flex gap-[3px] items-stretch h-7 relative">
          {barSlots.map((slot, i) => (
            <div key={i} className="flex-1 min-w-0 rounded-[3px]" style={pipStyle(slot)} />
          ))}
          <div
            className="absolute top-0 bottom-0 w-px border-l border-dashed pointer-events-none"
            style={{ left: `${winAt}%`, borderColor: TOUR_GOLD }}
          />
        </div>
      </div>

      <div className="mx-4 mt-4 border-t border-white/10 pt-3 pb-4 space-y-2.5">
        {rows.map((day, i) => (
          <DayCapsuleRow key={i} dayNumber={i + 1} day={day} />
        ))}
      </div>
    </div>
  )
}

function DayCapsuleRow({ dayNumber, day }: { dayNumber: number; day: TourBoardDay | null }) {
  const slots = padDayMatches(day?.matches ?? [], expectedMatchCount(day?.format, dayNumber))
  const allPending = slots.every((m) => !m || matchIsPending(m))
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-white/45 w-10 shrink-0">
        Day {dayNumber}
      </span>
      <div className="flex-1 flex gap-1.5">
        {slots.map((m, i) => (
          <div key={i} className="h-3.5 flex-1 rounded-full" style={capsuleStyle(tallySlotFromMatch(m))} />
        ))}
      </div>
      <span className="text-[11px] font-bold w-10 text-right num text-white/70">
        {allPending ? 'TBC' : `${fmtPts(day?.points93 ?? 0)}-${fmtPts(day?.points91 ?? 0)}`}
      </span>
    </div>
  )
}

function TeamPill({ team }: { team: TourTeam }) {
  return (
    <span
      className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
      style={{ backgroundColor: team === '93s' ? TEAM_BLUE : TEAM_RED }}
    >
      {team}
    </span>
  )
}

function pipStyle(slot: TallySlot): CSSProperties {
  if (slot.kind === 'pending') {
    return { background: 'transparent', border: '1px dashed rgba(255,255,255,0.28)' }
  }
  if (slot.kind === 'to_play') {
    return { background: 'rgba(0,0,0,0.28)' }
  }
  const color = teamFill(slot.team)
  if (slot.kind === 'live') {
    return { background: 'transparent', border: `2px solid ${color}` }
  }
  if (slot.team === 'half') {
    return { background: `linear-gradient(135deg, ${TEAM_BLUE} 50%, ${TEAM_RED} 50%)` }
  }
  return { background: color }
}

function capsuleStyle(slot: TallySlot): CSSProperties {
  if (slot.kind === 'pending') {
    return { background: 'transparent', border: '1px dashed rgba(255,255,255,0.32)' }
  }
  if (slot.kind === 'to_play') {
    return { background: 'rgba(0,0,0,0.28)' }
  }
  const color = teamFill(slot.team)
  if (slot.kind === 'live') {
    return { background: 'transparent', border: `2px solid ${color}` }
  }
  if (slot.team === 'half') {
    return { background: `linear-gradient(90deg, ${TEAM_BLUE} 50%, ${TEAM_RED} 50%)` }
  }
  return { background: color }
}

function teamFill(team: TourTeam | 'half' | null): string {
  if (team === '91s') return TEAM_RED
  return TEAM_BLUE
}
