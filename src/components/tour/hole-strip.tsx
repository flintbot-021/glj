import { cn } from '@/lib/utils'
import { TEAM_BLUE, TEAM_RED } from '@/lib/tour-colors'
import type { MatchHoleView } from '@/lib/tour-scoring'

export function HoleStrip({
  holes,
  current,
  onSelect,
}: {
  holes: MatchHoleView[]
  current?: number
  onSelect?: (hole: number) => void
}) {
  return (
    <div className="grid grid-cols-9 gap-1">
      {Array.from({ length: 18 }, (_, i) => {
        const n = i + 1
        const hole = holes[i]
        const fill = holeFill(hole)
        const active = current === n
        return (
          <button
            key={n}
            type="button"
            onClick={() => onSelect?.(n)}
            className={cn(
              'aspect-square rounded-md text-[11px] font-black flex items-center justify-center',
              active && 'ring-2 ring-white ring-offset-2 ring-offset-transparent scale-105',
            )}
            style={{
              background: fill,
              color: hole?.winnerTeam ? 'white' : 'rgba(255,255,255,0.45)',
            }}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}

export function MatchHoleBar({
  holes,
  current,
  onSelect,
  pending,
  tone = 'light',
  className,
}: {
  holes: MatchHoleView[]
  current?: number
  onSelect?: (hole: number) => void
  pending?: boolean
  tone?: 'light' | 'dark'
  className?: string
}) {
  const empty = tone === 'dark' ? 'rgba(255,255,255,0.16)' : 'oklch(0.90 0.01 157)'
  const pendingFill = tone === 'dark' ? 'rgba(255,255,255,0.08)' : 'oklch(0.93 0.01 157)'
  const pendingBorder = tone === 'dark' ? 'rgba(255,255,255,0.12)' : 'oklch(0.86 0.01 157)'
  const ring = tone === 'dark' ? 'ring-white' : 'ring-foreground/40'
  return (
    <div className={cn('flex gap-[2px] h-3', className)}>
      {Array.from({ length: 18 }, (_, i) => {
        const n = i + 1
        const hole = holes[i]
        const active = current === n
        if (onSelect) {
          return (
            <button
              key={n}
              type="button"
              onClick={() => onSelect(n)}
              aria-label={`Hole ${n}`}
              className={cn(
                'h-full flex-1 min-w-0 rounded-[2px]',
                active && `ring-1 ${ring} ring-offset-1 ring-offset-transparent`,
              )}
              style={
                pending
                  ? { background: pendingFill, border: `1px solid ${pendingBorder}` }
                  : { background: holeFill(hole, empty) }
              }
            />
          )
        }
        return (
          <div
            key={n}
            className="h-full flex-1 min-w-0 rounded-[2px]"
            style={
              pending
                ? { background: pendingFill, border: `1px solid ${pendingBorder}` }
                : { background: holeFill(hole, empty) }
            }
          />
        )
      })}
    </div>
  )
}

export function holeFill(hole?: MatchHoleView, empty = 'rgba(255,255,255,0.12)'): string {
  if (!hole?.winnerTeam) return empty
  if (hole.winnerTeam === 'half') {
    return `linear-gradient(135deg, ${TEAM_BLUE} 50%, ${TEAM_RED} 50%)`
  }
  return hole.winnerTeam === '93s' ? TEAM_BLUE : TEAM_RED
}
