import { useBonusLeague, useSubSeasons } from '@/hooks/use-data'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPoints, formatDate, profileDisplayName } from '@/lib/format'
import { getActiveOpenSubSeason } from '@/lib/sub-season'
import { getLadderSubSeasonId } from '@/lib/bonus-ladder'
import { STROKE_BONUS_COPY } from '@/lib/league-rules'
import { cn } from '@/lib/utils'

function fmtScore(n: number | undefined) {
  if (n === undefined) return '—'
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

export function BonusLeague() {
  const { data: entries, isLoading } = useBonusLeague()
  const { data: subSeasons } = useSubSeasons()
  const openSeason = getActiveOpenSubSeason(subSeasons)
  const legId = getLadderSubSeasonId(subSeasons)

  if (isLoading) {
    return (
      <div className="space-y-2 px-4">
        {[0, 1, 2, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    )
  }

  const filtered = entries?.filter((e) => e.total_net !== undefined) ?? []
  const noRounds = entries?.filter((e) => e.total_net === undefined) ?? []

  return (
    <div className="px-4 space-y-3">
      <p className="text-xs text-muted-foreground leading-relaxed">{STROKE_BONUS_COPY}</p>
      {!legId && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          No open bonus leg right now — standings below will fill when the next leg is open.
        </div>
      )}
      {openSeason && (
        <div className="rounded-xl border border-border bg-card px-4 py-3.5 flex items-center justify-between gap-3 shadow-sm">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Bonus period
            </p>
            <p className="text-base font-bold text-foreground leading-tight mt-0.5">{openSeason.name}</p>
            <p className="text-xs text-muted-foreground mt-1">Until {formatDate(openSeason.end_date)}</p>
          </div>
          <Badge
            className="shrink-0 text-[10px] font-bold border-0 px-2.5 py-0.5"
            style={{ backgroundColor: 'oklch(0.91 0.19 106)', color: 'oklch(0.20 0.07 150)' }}
          >
            LIVE
          </Badge>
        </div>
      )}

      <div className="overflow-x-auto -mx-4 px-4 pb-1">
        <div className="min-w-[520px]">
          {/* Column headers */}
          <div className="flex items-center px-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground gap-1">
            <div className="w-5 shrink-0" />
            <div className="flex-1 min-w-[100px]" />
            <span className="w-8 text-center shrink-0">R1</span>
            <span className="w-9 text-center shrink-0">R1 Net</span>
            <span className="w-8 text-center shrink-0">R2</span>
            <span className="w-9 text-center shrink-0">R2 Net</span>
            <span className="w-10 text-center shrink-0 font-bold">Total</span>
            <span className="w-10 text-right shrink-0">Bonus</span>
          </div>

          {filtered.map((entry, idx) => (
            <div
              key={entry.player.id}
              className={cn(
                'flex items-center gap-1 py-2.5 border-b border-border/60 last:border-0',
                idx < 3 ? 'bg-card/80 rounded-lg px-1 -mx-1' : ''
              )}
            >
              <span
                className={cn(
                  'w-5 text-xs font-black text-center shrink-0',
                  idx === 0 && 'text-yellow-500',
                  idx === 1 && 'text-gray-400',
                  idx === 2 && 'text-amber-600'
                )}
              >
                {idx + 1}
              </span>
              <div className="flex items-center gap-2 flex-1 min-w-0 pr-1">
                <PlayerAvatar player={entry.player} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{profileDisplayName(entry.player)}</p>
                  <p className="text-[10px] text-muted-foreground">Strokeplay ladder</p>
                </div>
              </div>
              <span className="w-8 text-center text-sm tabular-nums shrink-0">{fmtScore(entry.r1_gross)}</span>
              <span className="w-9 text-center text-sm font-medium tabular-nums shrink-0">
                {fmtScore(entry.r1_net)}
              </span>
              <span className="w-8 text-center text-sm tabular-nums text-muted-foreground shrink-0">
                {fmtScore(entry.r2_gross)}
              </span>
              <span className="w-9 text-center text-sm tabular-nums text-muted-foreground shrink-0">
                {fmtScore(entry.r2_net)}
              </span>
              <span className="w-10 text-center text-sm font-bold tabular-nums shrink-0">
                {fmtScore(entry.total_net)}
              </span>
              <span
                className="w-10 text-right text-sm font-black shrink-0 tabular-nums"
                style={{ color: entry.bonus_points > 0 ? 'oklch(0.91 0.19 106)' : 'var(--muted-foreground)' }}
              >
                {entry.bonus_points > 0 ? `+${formatPoints(entry.bonus_points)}` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {noRounds.length > 0 && (
        <div className="pt-2">
          <p className="text-xs text-muted-foreground text-center mb-2">
            No rounds submitted for this bonus leg yet
          </p>
          {noRounds.map((entry) => (
            <div key={entry.player.id} className="flex items-center gap-3 p-3 rounded-xl opacity-40">
              <span className="w-5 text-xs text-muted-foreground text-center">—</span>
              <PlayerAvatar player={entry.player} size="sm" />
              <span className="flex-1 text-sm text-muted-foreground truncate">
                {profileDisplayName(entry.player)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
