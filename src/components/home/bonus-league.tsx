import { useBonusLeague, useSubSeasons } from '@/hooks/use-data'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPoints, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export function BonusLeague() {
  const { data: entries, isLoading } = useBonusLeague()
  const { data: subSeasons } = useSubSeasons()
  const openSeason = subSeasons?.find((ss) => ss.status === 'open')

  if (isLoading) {
    return (
      <div className="space-y-2 px-4">
        {[0, 1, 2, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    )
  }

  const filtered = entries?.filter((e) => e.best_net !== undefined) ?? []
  const noRounds = entries?.filter((e) => e.best_net === undefined) ?? []

  return (
    <div className="px-4 space-y-3">
      {openSeason && (
        <div
          className="rounded-xl px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: 'oklch(0.91 0.19 106 / 0.15)', border: '1px solid oklch(0.91 0.19 106 / 0.3)' }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: 'oklch(0.91 0.19 106)' }}>
              {openSeason.name} Open
            </p>
            <p className="text-xs text-muted-foreground">
              Until {formatDate(openSeason.end_date)}
            </p>
          </div>
          <Badge
            className="text-[10px] font-bold border-0"
            style={{ backgroundColor: 'oklch(0.91 0.19 106 / 0.3)', color: 'oklch(0.91 0.19 106)' }}
          >
            LIVE
          </Badge>
        </div>
      )}

      {/* Column headers */}
      <div className="flex items-center px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <div className="w-6 mr-3" />
        <div className="flex-1" />
        <div className="flex gap-3 w-44 justify-end">
          <span className="w-12 text-center">Best</span>
          <span className="w-12 text-center">2nd</span>
          <span className="w-12 text-right">Bonus</span>
        </div>
      </div>

      {filtered.map((entry, idx) => (
        <div
          key={entry.player.id}
          className={cn(
            'flex items-center gap-3 p-3 rounded-xl',
            idx < 3 ? 'bg-card border border-border' : 'bg-card/50'
          )}
        >
          <span
            className={cn(
              'w-5 text-xs font-black text-center',
              idx === 0 && 'text-yellow-500',
              idx === 1 && 'text-gray-400',
              idx === 2 && 'text-amber-600'
            )}
          >
            {idx + 1}
          </span>
          <PlayerAvatar player={entry.player} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{entry.player.display_name}</p>
            <p className="text-xs text-muted-foreground">
              HCP {entry.player.handicap}
            </p>
          </div>
          <div className="flex gap-3 items-center w-44 justify-end">
            <span className="text-sm font-bold w-12 text-center text-foreground">
              {entry.best_net ?? '—'}
            </span>
            <span className="text-sm text-muted-foreground w-12 text-center">
              {entry.second_best_net ?? '—'}
            </span>
            <span
              className="text-sm font-black w-12 text-right"
              style={{ color: entry.bonus_points > 0 ? 'oklch(0.91 0.19 106)' : 'var(--muted-foreground)' }}
            >
              {entry.bonus_points > 0 ? `+${formatPoints(entry.bonus_points)}` : '—'}
            </span>
          </div>
        </div>
      ))}

      {noRounds.length > 0 && (
        <div className="pt-2">
          <p className="text-xs text-muted-foreground text-center mb-2">
            No rounds submitted yet
          </p>
          {noRounds.map((entry) => (
            <div key={entry.player.id} className="flex items-center gap-3 p-3 rounded-xl opacity-40">
              <span className="w-5 text-xs text-muted-foreground text-center">—</span>
              <PlayerAvatar player={entry.player} size="sm" />
              <span className="flex-1 text-sm text-muted-foreground truncate">
                {entry.player.display_name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
