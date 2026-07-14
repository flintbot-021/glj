import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { profileDisplayName, profileFirstName } from '@/lib/format'
import type { BonusLegRankRow, BonusPodiumPosition, BonusTieContest } from '@/lib/bonus-ladder'

const SEGMENT_COLORS = [
  'oklch(0.80 0.14 72)',
  'oklch(0.45 0.08 250)',
  'oklch(0.55 0.12 145)',
  'oklch(0.55 0.14 25)',
  'oklch(0.50 0.10 300)',
  'oklch(0.60 0.10 200)',
]

const SPIN_MS = 3800

type Props = {
  contest: BonusTieContest
  onResolved: (orderedPlayerIds: string[]) => void
  onCancel: () => void
}

function placeLabel(pos: BonusPodiumPosition): string {
  if (pos === 1) return '1st'
  if (pos === 2) return '2nd'
  return '3rd'
}

function contestTitle(contest: BonusTieContest): string {
  if (contest.positions.length === 1) {
    return `Spin for ${placeLabel(contest.positions[0]!)}`
  }
  const first = placeLabel(contest.positions[0]!)
  const last = placeLabel(contest.positions[contest.positions.length - 1]!)
  return `Spin to break the tie (${first}–${last})`
}

export function BonusTieWheel({ contest, onResolved, onCancel }: Props) {
  const [remaining, setRemaining] = useState<BonusLegRankRow[]>(() => [...contest.players])
  const [ordered, setOrdered] = useState<string[]>([])
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [lastWinnerId, setLastWinnerId] = useState<string | null>(null)

  const nextPlace = contest.positions[ordered.length]
  const placesLeft = contest.positions.length - ordered.length
  const done = ordered.length >= contest.positions.length

  const segmentAngle = remaining.length > 0 ? 360 / remaining.length : 360

  const conic = useMemo(() => {
    if (remaining.length === 0) return 'oklch(0.9 0 0)'
    if (remaining.length === 1) return SEGMENT_COLORS[0]
    const stops = remaining.map((_, i) => {
      const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length]!
      const start = (i * 100) / remaining.length
      const end = ((i + 1) * 100) / remaining.length
      return `${color} ${start}% ${end}%`
    })
    return `conic-gradient(from -90deg, ${stops.join(', ')})`
  }, [remaining])

  const handleSpin = () => {
    if (spinning || remaining.length === 0 || done) return
    if (remaining.length === 1) {
      const only = remaining[0]!
      const nextOrdered = [...ordered, only.player.id]
      setOrdered(nextOrdered)
      setRemaining([])
      setLastWinnerId(only.player.id)
      onResolved(nextOrdered)
      return
    }

    setSpinning(true)
    setLastWinnerId(null)
    const winnerIndex = Math.floor(Math.random() * remaining.length)
    // Pointer sits at top ( -90deg in conic). Segment i centers at (i + 0.5) * segmentAngle from -90deg.
    const targetCenter = winnerIndex * segmentAngle + segmentAngle / 2
    const extraTurns = 4 + Math.floor(Math.random() * 3)
    const nextRotation = rotation + extraTurns * 360 + (360 - targetCenter) - (rotation % 360)
    setRotation(nextRotation)

    window.setTimeout(() => {
      const winner = remaining[winnerIndex]!
      let nextOrdered = [...ordered, winner.player.id]
      let nextRemaining = remaining.filter((r) => r.player.id !== winner.player.id)

      // Only one player left for the remaining place(s) — award without another spin.
      while (
        nextRemaining.length === 1 &&
        nextOrdered.length < contest.positions.length
      ) {
        nextOrdered = [...nextOrdered, nextRemaining[0]!.player.id]
        nextRemaining = []
      }

      setOrdered(nextOrdered)
      setRemaining(nextRemaining)
      setLastWinnerId(winner.player.id)
      setSpinning(false)

      if (nextOrdered.length >= contest.positions.length) {
        onResolved(nextOrdered)
      }
    }, SPIN_MS)
  }

  const winnerRow = lastWinnerId
    ? contest.players.find((r) => r.player.id === lastWinnerId)
    : undefined
  const winnerPlace = winnerRow
    ? contest.positions[ordered.indexOf(lastWinnerId!)]
    : undefined

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold">{contestTitle(contest)}</p>
        <p className="text-xs text-muted-foreground">
          Combined net {contest.combined_net.toFixed(1)} · {contest.players.length} players
        </p>
        {!done && nextPlace != null && (
          <p className="text-xs font-medium" style={{ color: 'oklch(0.80 0.14 72)' }}>
            Next up: {placeLabel(nextPlace)}
            {placesLeft > 1 ? ` (${placesLeft} places left)` : ''}
          </p>
        )}
      </div>

      <div className="relative mx-auto w-[260px] h-[260px]">
        {/* Pointer */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 z-10"
          aria-hidden
        >
          <div
            className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent"
            style={{ borderTopColor: 'oklch(0.80 0.14 72)' }}
          />
        </div>

        <div
          className="absolute inset-3 rounded-full border-4 border-background shadow-inner overflow-hidden"
          style={{
            background: conic,
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.75, 0.12, 1)`
              : undefined,
          }}
        >
          {remaining.map((row, i) => {
            const mid = -90 + i * segmentAngle + segmentAngle / 2
            return (
              <div
                key={row.player.id}
                className="absolute inset-0 flex items-start justify-center pointer-events-none"
                style={{ transform: `rotate(${mid}deg)` }}
              >
                <span
                  className="mt-7 text-[11px] font-bold text-white drop-shadow-sm truncate max-w-[72px] text-center"
                  style={{ transform: 'rotate(0deg)' }}
                >
                  {profileFirstName(row.player)}
                </span>
              </div>
            )
          })}
        </div>

        <div
          className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background text-xs font-black shadow"
          style={{ backgroundColor: 'oklch(0.80 0.14 72)', color: 'oklch(0.18 0.06 60)' }}
        >
          RTD
        </div>
      </div>

      {winnerRow && winnerPlace != null && (
        <p className="text-center text-sm font-semibold">
          {profileDisplayName(winnerRow.player)} → {placeLabel(winnerPlace)}
        </p>
      )}

      {ordered.length > 0 && (
        <ol className="space-y-1 text-sm">
          {ordered.map((id, i) => {
            const row = contest.players.find((r) => r.player.id === id)
            const pos = contest.positions[i]
            if (!row || pos == null) return null
            return (
              <li key={id} className="flex items-center gap-2">
                <span className="w-8 font-bold tabular-nums">#{pos}</span>
                <span className="truncate">{profileDisplayName(row.player)}</span>
              </li>
            )
          })}
        </ol>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={spinning}>
          Cancel
        </Button>
        {!done && (
          <Button
            className="flex-1"
            style={{ backgroundColor: 'oklch(0.80 0.14 72)', color: 'oklch(0.18 0.06 60)' }}
            onClick={handleSpin}
            disabled={spinning}
          >
            {spinning ? 'Spinning…' : remaining.length === 1 ? 'Award last place' : 'Spin'}
          </Button>
        )}
      </div>
    </div>
  )
}
