import { PlayerAvatar } from '@/components/ui/player-avatar'
import { profileDisplayName } from '@/lib/format'
import { PLAYOFF_SLOTS, type PlayoffSlotKey } from '@/lib/playoff-draw'
import type { Profile } from '@/lib/types'
import { cn } from '@/lib/utils'

export function PlayoffHalvesBoard({
  slotPlayers,
  highlightKey,
  dark = false,
}: {
  slotPlayers: Partial<Record<PlayoffSlotKey, Profile>>
  highlightKey?: PlayoffSlotKey | null
  dark?: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <HalfColumn
        title="Left"
        qfs={[1, 2]}
        slotPlayers={slotPlayers}
        highlightKey={highlightKey}
        dark={dark}
      />
      <HalfColumn
        title="Right"
        qfs={[3, 4]}
        slotPlayers={slotPlayers}
        highlightKey={highlightKey}
        dark={dark}
      />
    </div>
  )
}

function HalfColumn({
  title,
  qfs,
  slotPlayers,
  highlightKey,
  dark,
}: {
  title: string
  qfs: number[]
  slotPlayers: Partial<Record<PlayoffSlotKey, Profile>>
  highlightKey?: PlayoffSlotKey | null
  dark: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-2 space-y-2',
        dark ? 'border-white/15 bg-white/5' : 'border-border bg-card',
      )}
    >
      <p
        className={cn(
          'text-center text-[10px] font-bold uppercase tracking-[0.18em]',
          dark ? 'text-white/55' : 'text-muted-foreground',
        )}
      >
        {title}
      </p>
      {qfs.map((qf) => (
        <div
          key={qf}
          className={cn(
            'rounded-lg overflow-hidden border',
            dark ? 'border-white/10' : 'border-border',
          )}
        >
          <p
            className={cn(
              'px-2 py-1 text-[10px] font-semibold uppercase tracking-wide',
              dark ? 'bg-white/8 text-white/50' : 'bg-muted/50 text-muted-foreground',
            )}
          >
            QF {qf}
          </p>
          {PLAYOFF_SLOTS.filter((s) => s.qf === qf).map((s) => (
            <SeatRow
              key={s.key}
              player={slotPlayers[s.key]}
              highlight={highlightKey === s.key}
              dark={dark}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function SeatRow({
  player,
  highlight,
  dark,
}: {
  player?: Profile
  highlight: boolean
  dark: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 min-h-9 border-t',
        dark ? 'border-white/10' : 'border-border',
      )}
      style={{
        backgroundColor: highlight
          ? dark
            ? 'oklch(0.80 0.14 72 / 0.22)'
            : 'oklch(0.80 0.14 72 / 0.16)'
          : undefined,
      }}
    >
      {player ? (
        <>
          <PlayerAvatar player={player} size="xs" />
          <span
            className={cn(
              'text-[11px] font-semibold truncate',
              dark ? 'text-white' : 'text-foreground',
            )}
          >
            {profileDisplayName(player)}
          </span>
        </>
      ) : (
        <span className={cn('text-[11px] italic', dark ? 'text-white/35' : 'text-muted-foreground/60')}>
          Empty
        </span>
      )}
    </div>
  )
}
