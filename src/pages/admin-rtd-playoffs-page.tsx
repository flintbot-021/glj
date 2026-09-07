import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { AlertTriangle, ChevronLeft, Dices, RotateCcw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { DrawWheel } from '@/components/playoff/draw-wheel'
import { LuckyPicker } from '@/components/playoff/lucky-picker'
import { PlayoffHalvesBoard } from '@/components/playoff/halves-board'
import {
  useActiveSeason,
  useAllGroupStandings,
  useKnockoutBracket,
  usePickPlayoffSpinner,
  usePlayoffDraw,
  usePlayers,
  useResetPlayoffDraw,
  useSavePlayoffSetup,
  useSpinPlayoffWheel,
} from '@/hooks/use-data'
import { profileDisplayName, profileFirstName } from '@/lib/format'
import { TOURNAMENT_STRUCTURE } from '@/lib/league-rules'
import {
  emptySlots,
  fieldIsValid,
  pickRandom,
  PLAYOFF_SLOTS,
  qualifierIdsFromGroupLeaders,
  remainingPlayers,
  slotDef,
  type PlayoffEntry,
  type PlayoffSlotKey,
} from '@/lib/playoff-draw'
import { useAuthStore } from '@/stores/auth-store'
import type { Profile } from '@/lib/types'

const GREEN = 'oklch(0.17 0.055 157)'
const GOLD = 'oklch(0.80 0.14 72)'
const EMPTY = '__empty__'
const EMPTY_DRAFT: string[] = ['', '', '', '', '', '', '', '']

type Anim = 'idle' | 'picking' | 'spinning'

function draftFromEntries(entries: PlayoffEntry[]): string[] {
  const ids = entries.map((e) => e.player_id)
  return [...ids, ...EMPTY_DRAFT].slice(0, 8)
}

export function AdminRtdPlayoffsPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const { data: season } = useActiveSeason()
  const { data: bundle, isLoading } = usePlayoffDraw()
  const { data: allPlayers = [] } = usePlayers()
  const { data: standings } = useAllGroupStandings()
  const { data: fixtures = [] } = useKnockoutBracket()
  const saveSetup = useSavePlayoffSetup()
  const resetDraw = useResetPlayoffDraw()
  const pickSpinner = usePickPlayoffSpinner()
  const spinWheel = useSpinPlayoffWheel()

  const [draft, setDraft] = useState<string[]>(() => [...EMPTY_DRAFT])
  const [error, setError] = useState<string | null>(null)
  const [ceremony, setCeremony] = useState(false)
  const [anim, setAnim] = useState<Anim>('idle')
  const [pickWinnerId, setPickWinnerId] = useState<string | null>(null)
  const [spinWinner, setSpinWinner] = useState<PlayoffSlotKey | null>(null)
  const [legalForSpin, setLegalForSpin] = useState(PLAYOFF_SLOTS)
  const [pickerPool, setPickerPool] = useState<Profile[]>([])

  const players = useMemo(
    () => [...allPlayers].sort((a, b) => profileDisplayName(a).localeCompare(profileDisplayName(b))),
    [allPlayers],
  )
  const playerById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players])
  const playerSelectItems = useMemo(() => {
    const items: Record<string, string> = { [EMPTY]: 'None' }
    for (const p of players) items[p.id] = profileDisplayName(p)
    return items
  }, [players])

  const draw = bundle?.draw
  const entries = bundle?.entries ?? []
  const locked = draw?.status === 'drawing' || draw?.status === 'complete'

  useEffect(() => {
    if (!bundle || bundle.draw.status !== 'setup') return
    setDraft(draftFromEntries(bundle.entries))
  }, [bundle])

  useEffect(() => {
    if (draw?.status === 'drawing') setCeremony(true)
  }, [draw?.status])

  const slotPlayers = useMemo(() => {
    const out: Partial<Record<PlayoffSlotKey, Profile>> = {}
    for (const e of entries) {
      if (!e.slot_key || !e.player) continue
      if (anim === 'spinning' && spinWinner === e.slot_key) continue
      out[e.slot_key] = e.player
    }
    return out
  }, [entries, anim, spinWinner])

  const qfLocked = fixtures.some((f) => f.round === 'qf' && f.result)
  const placedCount = entries.filter((e) => e.slot_key).length

  const setSeat = (index: number, playerId: string) => {
    setDraft((prev) => prev.map((id, i) => (i === index ? playerId : id)))
  }

  const loadLeaders = () => {
    if (!standings?.length) {
      setError('No group standings yet.')
      return
    }
    const groups = [...standings]
      .sort((a, b) => a.group.name.localeCompare(b.group.name))
      .map(({ standings: rows }) => ({
        topIds: [...rows]
          .sort((a, b) => b.total_points - a.total_points)
          .slice(0, TOURNAMENT_STRUCTURE.knockoutFromEachGroup)
          .map((r) => r.player.id),
      }))
    const ids = qualifierIdsFromGroupLeaders(groups)
    setDraft([...ids, ...EMPTY_DRAFT].slice(0, 8))
    setError(null)
  }

  const persistSetup = async () => {
    if (!season) throw new Error('No active season')
    const playerIds = draft.filter(Boolean)
    const invalid = fieldIsValid(playerIds)
    if (invalid) throw new Error(invalid)
    return saveSetup.mutateAsync({ seasonId: season.id, playerIds })
  }

  const profilesFor = (list: { player_id: string; player?: Profile }[]) =>
    list
      .map((e) => e.player ?? playerById.get(e.player_id))
      .filter((p): p is Profile => Boolean(p))

  const onSave = async () => {
    setError(null)
    try {
      await persistSetup()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.')
    }
  }

  const beginCeremony = async () => {
    if (!season) return
    setError(null)
    if (qfLocked) {
      setError('Quarter-finals already have results. Clear those on Knockout matchups first.')
      return
    }
    try {
      const playerIds = draft.filter(Boolean)
      const invalid = fieldIsValid(playerIds)
      if (invalid) {
        setError(invalid)
        return
      }
      const saved = await saveSetup.mutateAsync({
        seasonId: season.id,
        playerIds,
      })
      const waiting = remainingPlayers(saved.entries)
      const chosen = pickRandom(waiting)
      if (!chosen) throw new Error('Everyone is already placed.')
      setPickerPool(profilesFor(waiting))
      setPickWinnerId(chosen.player_id)
      setAnim('picking')
      setCeremony(true)
      await pickSpinner.mutateAsync({ drawId: saved.draw.id, playerId: chosen.player_id })
    } catch (e) {
      setAnim('idle')
      setCeremony(false)
      setError(e instanceof Error ? e.message : 'Could not start the draw.')
    }
  }

  const nextPick = async () => {
    if (!draw) return
    setError(null)
    const waiting = remainingPlayers(entries)
    const chosen = pickRandom(waiting)
    if (!chosen) return
    try {
      setPickerPool(profilesFor(waiting))
      setPickWinnerId(chosen.player_id)
      setAnim('picking')
      await pickSpinner.mutateAsync({ drawId: draw.id, playerId: chosen.player_id })
    } catch (e) {
      setAnim('idle')
      setError(e instanceof Error ? e.message : 'Could not pick the next player.')
    }
  }

  const onSpin = async () => {
    if (!draw?.current_spinner_id) return
    const spinner = entries.find((e) => e.player_id === draw.current_spinner_id)
    if (!spinner) return
    const legal = emptySlots(entries)
    const slot = pickRandom(legal)
    if (!slot) {
      setError('No slots left.')
      return
    }
    try {
      setLegalForSpin(legal)
      setSpinWinner(slot.key)
      setAnim('spinning')
    } catch (e) {
      setAnim('idle')
      setError(e instanceof Error ? e.message : 'Could not spin.')
    }
  }

  const onWheelDone = async () => {
    if (!draw || !spinWinner) {
      setAnim('idle')
      return
    }
    try {
      await spinWheel.mutateAsync({ drawId: draw.id, slotKey: spinWinner })
      setAnim('idle')
    } catch (e) {
      setAnim('idle')
      setError(e instanceof Error ? e.message : 'Could not spin.')
    }
  }

  const onReset = async () => {
    if (!season) return
    if (!confirm('Reset the playoff draw? This clears the eight slots and the ceremony.')) return
    setError(null)
    try {
      await resetDraw.mutateAsync(season.id)
      setDraft([...EMPTY_DRAFT])
      setCeremony(false)
      setAnim('idle')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reset.')
    }
  }

  if (!profile?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Admin Access Required</h2>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    )
  }

  const taken = new Set(draft.filter(Boolean))
  const spinner = entries.find((e) => e.player_id === draw?.current_spinner_id)
  const spinnerProfile = spinner?.player ?? (draw?.current_spinner_id ? playerById.get(draw.current_spinner_id) : undefined)
  const lastSlot = draw?.last_assigned_slot ? slotDef(draw.last_assigned_slot) : null
  const lastEntry = lastSlot ? entries.find((e) => e.slot_key === lastSlot.key) : undefined
  const lastPlayer = lastEntry?.player ?? (lastEntry ? playerById.get(lastEntry.player_id) : undefined)
  const phase = draw?.phase ?? 'setup'
  const showPicker = anim === 'picking' && pickWinnerId
  const showWheel = anim === 'spinning' && spinWinner
  const showSpinCta = ceremony && phase === 'await_spin' && anim === 'idle'
  const showRevealed = ceremony && phase === 'revealed' && anim === 'idle'
  const showComplete = ceremony && (draw?.status === 'complete' || phase === 'complete') && anim === 'idle'

  return (
    <div className="py-4">
      <div className="px-4 mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/rtd')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-black">Playoff draw</h1>
          <p className="text-sm text-muted-foreground">
            Set the eight, then pass the phone as the lucky picker names who spins.
          </p>
        </div>
      </div>

      <div className="px-4 space-y-4 max-w-lg mx-auto">
        {isLoading || !season ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Pick the eight who made it through, then start. The lucky picker names who spins, and the
                wheel drops them into one of the eight slots on the two halves.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={loadLeaders} disabled={locked}>
                  Load group leaders
                </Button>
                {draw && (
                  <Button type="button" size="sm" variant="destructive" onClick={onReset} disabled={resetDraw.isPending}>
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </Button>
                )}
                {draw?.status === 'drawing' && (
                  <Button type="button" size="sm" onClick={() => setCeremony(true)}>
                    Resume ceremony
                  </Button>
                )}
                {draw?.status === 'complete' && (
                  <Button type="button" size="sm" variant="secondary" onClick={() => setCeremony(true)}>
                    Show bracket
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h2 className="text-sm font-black uppercase tracking-wide">The eight</h2>
              <div className="grid grid-cols-1 gap-2">
                {draft.map((id, index) => (
                  <Select
                    key={index}
                    items={playerSelectItems}
                    value={id || EMPTY}
                    onValueChange={(v) => setSeat(index, v === EMPTY ? '' : (v ?? ''))}
                    disabled={locked}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={`Qualifier ${index + 1}`}>
                        {(value: string) =>
                          !value || value === EMPTY
                            ? `Qualifier ${index + 1}`
                            : (playerSelectItems[value] ?? 'Unknown')
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value={EMPTY}>None</SelectItem>
                      {players.map((p) => {
                        const selected = id === p.id
                        const used = taken.has(p.id) && !selected
                        return (
                          <SelectItem key={p.id} value={p.id} disabled={used}>
                            {profileDisplayName(p)}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {!locked && (
              <div className="space-y-2 pb-6">
                <Button
                  type="button"
                  className="w-full"
                  variant="secondary"
                  onClick={onSave}
                  disabled={saveSetup.isPending}
                >
                  {saveSetup.isPending ? 'Saving…' : 'Save the eight'}
                </Button>
                <Button
                  type="button"
                  className="w-full h-11 text-base font-bold"
                  onClick={beginCeremony}
                  disabled={saveSetup.isPending || pickSpinner.isPending}
                  style={{ backgroundColor: 'oklch(0.22 0.068 157)' }}
                >
                  <Sparkles className="h-4 w-4" />
                  I’m going to start now
                </Button>
              </div>
            )}

            {draw?.status === 'complete' && (
              <div className="pb-8">
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-2">
                  Drawn bracket
                </h2>
                <PlayoffHalvesBoard slotPlayers={slotPlayers} highlightKey={draw.last_assigned_slot} />
              </div>
            )}
          </>
        )}
      </div>

      {ceremony && (
        <div
          className="fixed inset-0 z-[70] flex flex-col overflow-y-auto"
          style={{ backgroundColor: GREEN }}
        >
          <div className="px-4 pt-3 pb-2 flex items-center justify-between safe-top">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">Playoff draw</p>
            <button
              type="button"
              className="text-xs text-white/50 underline-offset-2 hover:underline"
              onClick={() => setCeremony(false)}
            >
              Exit
            </button>
          </div>
          <div className="px-4 pb-2">
            <h1 className="rtd-display text-[42px] leading-none tracking-wide" style={{ color: GOLD }}>
              ROAD TO DIAS
            </h1>
            <p className="text-sm text-white/60 mt-1">
              {placedCount} of 8 placed
            </p>
          </div>

          <div className="px-4 mb-4">
            <PlayoffHalvesBoard
              slotPlayers={slotPlayers}
              highlightKey={anim === 'spinning' ? null : draw?.last_assigned_slot}
              dark
            />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 gap-6">
            {error && <p className="text-sm text-red-300 text-center">{error}</p>}

            {showPicker && pickWinnerId && (
              <LuckyPicker
                key={pickWinnerId}
                players={
                  pickerPool.length > 0
                    ? pickerPool
                    : [playerById.get(pickWinnerId)].filter((p): p is Profile => Boolean(p))
                }
                winnerId={pickWinnerId}
                onDone={() => setAnim('idle')}
              />
            )}

            {showSpinCta && spinnerProfile && (
              <>
                <div className="text-center space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">
                    Hand the phone to
                  </p>
                  <p className="rtd-display text-6xl text-white leading-none">
                    {profileFirstName(spinnerProfile)}
                  </p>
                  <p className="text-sm text-white/55">Spin for your slot</p>
                </div>
                <Button
                  type="button"
                  className="h-14 px-8 text-lg font-black"
                  onClick={onSpin}
                  disabled={spinWheel.isPending}
                  style={{ backgroundColor: GOLD, color: 'oklch(0.18 0.06 60)' }}
                >
                  <Dices className="h-5 w-5" />
                  Spin the wheel
                </Button>
              </>
            )}

            {showWheel && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-white/70 text-sm">
                  {spinnerProfile ? profileFirstName(spinnerProfile) : 'Spinning'}…
                </p>
                <DrawWheel
                  slots={legalForSpin}
                  winnerKey={spinWinner}
                  spinning
                  onDone={onWheelDone}
                />
              </div>
            )}

            {showRevealed && lastSlot && lastPlayer && (
              <div className="text-center space-y-3">
                <p className="rtd-display text-5xl text-white leading-none">
                  {profileFirstName(lastPlayer)}
                </p>
                <p className="text-base text-white/80">{lastSlot.label}</p>
                <Button
                  type="button"
                  className="h-12 px-8 font-bold"
                  onClick={nextPick}
                  disabled={pickSpinner.isPending}
                  style={{ backgroundColor: GOLD, color: 'oklch(0.18 0.06 60)' }}
                >
                  Next player
                </Button>
              </div>
            )}

            {showComplete && (
              <div className="text-center space-y-3">
                <p className="rtd-display text-5xl leading-none" style={{ color: GOLD }}>
                  That’s the draw
                </p>
                <p className="text-sm text-white/65">Eight slots filled. Two halves. Knockout is live.</p>
                <Button
                  type="button"
                  className="h-12 px-8 font-bold"
                  onClick={() => setCeremony(false)}
                  style={{ backgroundColor: GOLD, color: 'oklch(0.18 0.06 60)' }}
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
