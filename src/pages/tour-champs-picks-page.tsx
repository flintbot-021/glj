import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useSaveTourChampsPick, useTourBoard } from '@/hooks/use-data'
import { useAuthStore } from '@/stores/auth-store'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TEAM_BLUE,
  TEAM_RED,
  TOUR_GOLD,
  TOUR_GOLD_FG,
  TOUR_GREEN,
  champsDeadlineIso,
  champsPicksLocked,
} from '@/lib/tour-colors'
import {
  CHAMPS_PICK_COUNT,
  CHAMPS_RANK_BUDGET,
  champsRankSum,
} from '@/lib/tour-scoring'
import { profileDisplayName, profileFirstName } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Check, Plus, Star } from 'lucide-react'
import type { TourRosterPlayer } from '@/lib/tour-board'

export function TourChampsPicksPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const { data: board, isLoading } = useTourBoard()
  const save = useSaveTourChampsPick()

  const existing = board?.champs.find((c) => c.picker.id === profile?.id)

  const [picked, setPicked] = useState<string[]>([])
  const [captainId, setCaptainId] = useState<string | null>(null)
  const [captainDay, setCaptainDay] = useState<1 | 2 | 3>(1)
  const [hydrated, setHydrated] = useState(false)
  const [error, setError] = useState('')

  const locked = champsPicksLocked(board?.event.champs_deadline)
  const deadlineLabel = new Date(champsDeadlineIso(board?.event.champs_deadline)).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Johannesburg',
  })

  useEffect(() => {
    if (!existing || hydrated) return
    setPicked(existing.picks.map((p) => p.id))
    setCaptainId(existing.captain.id)
    setCaptainDay(existing.pick.captain_day)
    setHydrated(true)
  }, [existing, hydrated])

  const roster = useMemo(
    () => [...(board?.players ?? [])].sort((a, b) => a.seed - b.seed),
    [board?.players],
  )

  const selectedPlayers = useMemo(
    () => picked.map((id) => roster.find((p) => p.id === id)).filter(Boolean) as TourRosterPlayer[],
    [picked, roster],
  )

  const used = champsRankSum(selectedPlayers.map((p) => p.seed))
  const short = Math.max(0, CHAMPS_RANK_BUDGET - used)
  const full = selectedPlayers.length === CHAMPS_PICK_COUNT
  const metFloor = full && used >= CHAMPS_RANK_BUDGET

  const toggle = (id: string) => {
    if (locked) return
    setError('')
    setPicked((prev) => {
      if (prev.includes(id)) {
        if (captainId === id) setCaptainId(null)
        return prev.filter((x) => x !== id)
      }
      if (prev.length >= CHAMPS_PICK_COUNT) {
        setError('Four picked — drop someone first.')
        return prev
      }
      return [...prev, id]
    })
  }

  const onSave = () => {
    if (!board || !profile) return
    if (picked.length !== CHAMPS_PICK_COUNT) {
      setError('Pick exactly four.')
      return
    }
    if (used < CHAMPS_RANK_BUDGET) {
      setError(`Ranks must add to ${CHAMPS_RANK_BUDGET} or more. You’re on ${used}.`)
      return
    }
    if (!captainId || !picked.includes(captainId)) {
      setError('Choose a captain.')
      return
    }
    const [a, b, c, d] = picked
    save.mutate(
      {
        tour_id: board.event.id,
        picker_id: profile.id,
        pick_1_id: a!,
        pick_2_id: b!,
        pick_3_id: c!,
        pick_4_id: d!,
        captain_id: captainId,
        captain_day: captainDay,
      },
      {
        onSuccess: () => navigate('/tour?tab=champs'),
        onError: (e) => setError(e instanceof Error ? e.message : 'Could not save picks'),
      },
    )
  }

  const ready = metFloor && !!captainId
  const pct = Math.min(100, (used / CHAMPS_RANK_BUDGET) * 100)

  if (isLoading || !board) {
    return (
      <div className="px-4 py-4">
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="pb-2">
      <div className="sticky top-0 z-20 border-b border-border bg-background px-4 pt-3 pb-2.5">
        <div className="flex items-end justify-between gap-3">
          <p className="text-3xl font-black leading-none num">
            {used}
            <span className="text-lg text-muted-foreground"> / 32+</span>
          </p>
          <div className="text-right pb-0.5">
            <p className="text-xs font-bold text-muted-foreground">
              {locked ? 'Locked' : deadlineLabel}
            </p>
            <p className="text-sm font-bold mt-0.5">
              {metFloor
                ? 'Rank floor met'
                : full && short > 0
                  ? `Need 32+ · on ${used}`
                  : `${picked.length}/4 picked`}
            </p>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              backgroundColor: metFloor ? TOUR_GOLD : full && short > 0 ? 'oklch(0.63 0.2 25)' : TOUR_GREEN,
            }}
          />
        </div>
      </div>

      <div className="px-4 mt-4 mb-4">
        <p className="text-xs font-bold text-muted-foreground mb-2">Your four</p>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: CHAMPS_PICK_COUNT }).map((_, i) => {
            const p = selectedPlayers[i]
            const isCap = p?.id === captainId
            return (
              <div
                key={i}
                className="rounded-xl border bg-card p-3 min-h-[76px]"
                style={p ? { borderColor: p.team === '93s' ? TEAM_BLUE : TEAM_RED } : undefined}
              >
                {p ? (
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-2xl font-black leading-none num">#{p.seed}</p>
                      {isCap && (
                        <Star className="h-4 w-4 shrink-0" style={{ color: TOUR_GOLD, fill: TOUR_GOLD }} />
                      )}
                    </div>
                    <p className="text-sm font-bold mt-1 truncate">{profileFirstName(p.profile)}</p>
                    <p className="text-[11px] font-bold" style={{ color: p.team === '93s' ? TEAM_BLUE : TEAM_RED }}>
                      {p.team}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-4">Pick {i + 1}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {picked.length === CHAMPS_PICK_COUNT && (
        <div className="px-4 mb-5">
          <p className="text-sm font-black">Captain</p>
          <p className="text-xs text-muted-foreground mb-2">
            Their Stableford is doubled on one day. Choose the player, then the day.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {selectedPlayers.map((p) => {
              const on = p.id === captainId
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={locked}
                  onClick={() => setCaptainId(p.id)}
                  className="h-12 rounded-xl px-3 flex items-center gap-2 text-left border bg-card"
                  style={
                    on
                      ? { backgroundColor: TOUR_GOLD, color: TOUR_GOLD_FG, borderColor: TOUR_GOLD }
                      : undefined
                  }
                >
                  <Star className="h-4 w-4 shrink-0" style={on ? { fill: 'currentColor' } : undefined} />
                  <span className="text-sm font-bold truncate">{profileFirstName(p.profile)}</span>
                </button>
              )
            })}
          </div>
          <p className="text-xs font-bold text-muted-foreground mb-2">Double on</p>
          <div className="grid grid-cols-3 gap-2">
            {([1, 2, 3] as const).map((n) => {
              const on = captainDay === n
              return (
                <button
                  key={n}
                  type="button"
                  disabled={locked}
                  onClick={() => setCaptainDay(n)}
                  className="h-11 rounded-xl text-sm font-bold border bg-card"
                  style={
                    on
                      ? { backgroundColor: TOUR_GOLD, color: TOUR_GOLD_FG, borderColor: TOUR_GOLD }
                      : undefined
                  }
                >
                  Day {n}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="px-4">
        <p className="text-xs font-bold text-muted-foreground mb-2">Field · rank 1–16</p>
        <div className="space-y-2">
          {roster.map((p) => {
            const on = picked.includes(p.id)
            const isCap = on && p.id === captainId
            return (
              <button
                key={p.id}
                type="button"
                disabled={locked}
                onClick={() => toggle(p.id)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left border',
                  on ? 'text-white border-transparent' : 'bg-card border-border',
                )}
                style={on ? { backgroundColor: TOUR_GREEN } : undefined}
              >
                <span className={cn('w-12 text-2xl font-black num leading-none', !on && 'text-foreground')}>
                  {p.seed}
                </span>
                <PlayerAvatar player={p.profile} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-black truncate leading-tight">{profileDisplayName(p.profile)}</p>
                  <p className={cn('text-[11px] font-semibold mt-0.5', on ? (isCap ? 'opacity-70' : 'text-white/65') : 'text-muted-foreground')}>
                    HCP {p.locked_handicap}
                    {isCap ? ' · Captain' : ''}
                  </p>
                </div>
                <span
                  className="text-[10px] font-black px-1.5 py-0.5 rounded-md text-white"
                  style={{ backgroundColor: p.team === '93s' ? TEAM_BLUE : TEAM_RED }}
                >
                  {p.team}
                </span>
                {on ? (
                  <span
                    className="size-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: isCap ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.2)' }}
                  >
                    <Check className="h-4 w-4" />
                  </span>
                ) : (
                  <span className="size-8 rounded-full border border-border flex items-center justify-center shrink-0 text-muted-foreground">
                    <Plus className="h-4 w-4" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {error && <p className="px-4 text-sm text-destructive mt-3">{error}</p>}

      {!locked && (
        <div className="px-4 mt-5 mb-6">
          <button
            type="button"
            onClick={onSave}
            disabled={save.isPending || !ready}
            className="w-full h-14 rounded-2xl text-base font-black disabled:opacity-40"
            style={{ backgroundColor: TOUR_GOLD, color: TOUR_GOLD_FG }}
          >
            {save.isPending ? 'Saving…' : ready ? 'Lock in picks' : 'Need 32+ and a captain'}
          </button>
        </div>
      )}
    </div>
  )
}
