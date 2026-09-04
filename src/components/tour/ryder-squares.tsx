import { cn } from '@/lib/utils'
import { TEAM_BLUE, TEAM_RED } from '@/lib/tour-colors'
import type { TourMatchView } from '@/lib/tour-board'

export function RyderSquares({
  matches,
}: {
  matches: TourMatchView[]
}) {
  if (matches.length === 0) {
    return <p className="text-xs text-white/40">No matches set</p>
  }
  return (
    <div className="flex gap-1.5 flex-wrap">
      {matches.map((m) => (
        <div
          key={m.match.id}
          title={`Match ${m.matchNumber} · ${m.computed.statusLabel}`}
          className={cn(
            'h-9 w-9 rounded-md flex items-center justify-center text-[10px] font-black text-white',
            m.computed.holesPlayed === 0 && 'border border-white/25 text-white/40',
          )}
          style={{ background: squareFill(m) }}
        >
          {m.matchNumber}
        </div>
      ))}
    </div>
  )
}

function squareFill(m: TourMatchView): string | undefined {
  const { computed } = m
  if (computed.holesPlayed === 0) return 'transparent'
  if (computed.leader === 'half' || (computed.closed && computed.points93 === 0.5)) {
    return `linear-gradient(135deg, ${TEAM_BLUE} 50%, ${TEAM_RED} 50%)`
  }
  if (computed.leader === '93s') return computed.closed ? TEAM_BLUE : `${TEAM_BLUE}99`
  if (computed.leader === '91s') return computed.closed ? TEAM_RED : `${TEAM_RED}99`
  return 'transparent'
}
