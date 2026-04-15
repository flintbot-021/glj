import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useActiveSeason,
  useDeleteKnockoutFixture,
  useInsertKnockoutFixture,
  useKnockoutBracket,
  usePlayers,
  useUpdateKnockoutFixture,
} from '@/hooks/use-data'
import { profileDisplayName } from '@/lib/format'
import type { KnockoutFixture, KnockoutRound, Profile } from '@/lib/types'

const NONE = '__none__'

/** Fixed draw slots per round (order matters). */
const KNOCKOUT_SLOTS: { round: KnockoutRound; indices: number[] }[] = [
  { round: 'qf', indices: [1, 2, 3, 4] },
  { round: 'sf', indices: [1, 2] },
  { round: 'final', indices: [1] },
]

const ROUND_TITLE: Record<KnockoutRound, string> = {
  qf: 'Quarter-finals',
  sf: 'Semi-finals',
  final: 'Final',
}

function slotTitle(round: KnockoutRound, slot: number): string {
  if (round === 'final') return 'Final'
  return `${round === 'qf' ? 'QF' : 'SF'} ${slot}`
}

type Enriched = KnockoutFixture & { player_a?: Profile; player_b?: Profile }

export function AdminRtdKnockoutPage() {
  const navigate = useNavigate()
  const { data: season } = useActiveSeason()
  const { data: fixtures = [], isLoading: fxLoading } = useKnockoutBracket()
  const { data: allPlayers = [], isLoading: plLoading } = usePlayers()
  const insertFx = useInsertKnockoutFixture()
  const updateFx = useUpdateKnockoutFixture()
  const deleteFx = useDeleteKnockoutFixture()

  const sortedPlayers = useMemo(
    () => [...allPlayers].sort((a, b) => profileDisplayName(a).localeCompare(profileDisplayName(b))),
    [allPlayers]
  )

  const fixtureByKey = useMemo(() => {
    const m = new Map<string, Enriched>()
    for (const f of fixtures as Enriched[]) {
      m.set(`${f.round}-${f.slot_index}`, f)
    }
    return m
  }, [fixtures])

  const loading = fxLoading || plLoading || !season

  return (
    <div className="py-4">
      <div className="px-4 mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/rtd')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-black">Knockout matchups</h1>
          <p className="text-sm text-muted-foreground">
            Set pairings for each numbered slot, then add results when matches are played.
          </p>
        </div>
      </div>

      <div className="px-4 space-y-8 max-w-lg mx-auto">
        {loading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          KNOCKOUT_SLOTS.map(({ round, indices }) => (
            <section key={round} className="space-y-3">
              <div>
                <h2 className="text-base font-black tracking-tight">{ROUND_TITLE[round]}</h2>
                <p className="text-xs text-muted-foreground">
                  {round === 'qf' && 'Four draws — label QF 1 through QF 4.'}
                  {round === 'sf' && 'Two semi-finals — SF 1 and SF 2.'}
                  {round === 'final' && 'Championship match.'}
                </p>
              </div>
              <div className="space-y-4">
                {indices.map((slotIndex) => (
                  <KnockoutSlotCard
                    key={`${round}-${slotIndex}`}
                    seasonId={season!.id}
                    round={round}
                    slotIndex={slotIndex}
                    title={slotTitle(round, slotIndex)}
                    fixture={fixtureByKey.get(`${round}-${slotIndex}`)}
                    players={sortedPlayers}
                    insertFx={insertFx}
                    updateFx={updateFx}
                    deleteFx={deleteFx}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

function KnockoutSlotCard({
  seasonId,
  round,
  slotIndex,
  title,
  fixture,
  players,
  insertFx,
  updateFx,
  deleteFx,
}: {
  seasonId: string
  round: KnockoutRound
  slotIndex: number
  title: string
  fixture: Enriched | undefined
  players: Profile[]
  insertFx: ReturnType<typeof useInsertKnockoutFixture>
  updateFx: ReturnType<typeof useUpdateKnockoutFixture>
  deleteFx: ReturnType<typeof useDeleteKnockoutFixture>
}) {
  const [pairA, setPairA] = useState(NONE)
  const [pairB, setPairB] = useState(NONE)
  const [result, setResult] = useState<'unset' | 'win_a' | 'win_b'>('unset')
  const [margin, setMargin] = useState('')
  const [course, setCourse] = useState('')
  const [played, setPlayed] = useState('')

  useEffect(() => {
    if (!fixture) {
      setPairA(NONE)
      setPairB(NONE)
      setResult('unset')
      setMargin('')
      setCourse('')
      setPlayed('')
      return
    }
    setPairA(fixture.player_a_id ?? NONE)
    setPairB(fixture.player_b_id ?? NONE)
    setResult(fixture.result ? fixture.result : 'unset')
    setMargin(fixture.margin ?? '')
    setCourse(fixture.course_name ?? '')
    setPlayed(fixture.played_at?.slice(0, 10) ?? '')
  }, [fixture?.id, fixture?.player_a_id, fixture?.player_b_id, fixture?.result, fixture?.margin, fixture?.course_name, fixture?.played_at])

  const savePairing = () => {
    const payload = {
      season_id: seasonId,
      round,
      slot_index: slotIndex,
      player_a_id: pairA === NONE ? null : pairA,
      player_b_id: pairB === NONE ? null : pairB,
    }
    if (!fixture) {
      insertFx.mutate(payload)
    } else {
      updateFx.mutate({
        id: fixture.id,
        patch: {
          player_a_id: pairA === NONE ? null : pairA,
          player_b_id: pairB === NONE ? null : pairB,
        },
      })
    }
  }

  const saveResult = () => {
    if (!fixture) return
    updateFx.mutate({
      id: fixture.id,
      patch: {
        result: result === 'unset' ? null : result,
        margin: margin.trim() || null,
        course_name: course.trim() || null,
        played_at: played || null,
      },
    })
  }

  const clearSlot = () => {
    if (!fixture) return
    if (confirm(`Clear ${title}? This removes the pairing and result for this slot.`)) {
      deleteFx.mutate(fixture.id)
    }
  }

  const pairingPending = insertFx.isPending || updateFx.isPending
  const hasPairingRow = !!fixture

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-3 py-2 bg-muted/40 border-b border-border flex items-center justify-between gap-2">
        <span className="text-sm font-bold">{title}</span>
        {fixture && (
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={clearSlot}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="p-4 space-y-5">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">1. Pairing</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Player A</Label>
              <PlayerSelect value={pairA} onChange={setPairA} players={players} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Player B</Label>
              <PlayerSelect value={pairB} onChange={setPairB} players={players} />
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            className="w-full"
            onClick={savePairing}
            disabled={pairingPending}
            style={{ backgroundColor: 'oklch(0.60 0.18 330)' }}
          >
            {!fixture ? (insertFx.isPending ? 'Saving…' : 'Save pairing') : updateFx.isPending ? 'Saving…' : 'Update pairing'}
          </Button>
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">2. Result</p>
          {!hasPairingRow ? (
            <p className="text-sm text-muted-foreground">Save the pairing above first; then you can record the result.</p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Winner</Label>
                <Select
                  value={result}
                  onValueChange={(v) => setResult((v ?? 'unset') as 'unset' | 'win_a' | 'win_b')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Not played yet</SelectItem>
                    <SelectItem value="win_a">{fixture.player_a ? profileDisplayName(fixture.player_a) : 'Player A'} wins</SelectItem>
                    <SelectItem value="win_b">{fixture.player_b ? profileDisplayName(fixture.player_b) : 'Player B'} wins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Margin</Label>
                  <Input value={margin} onChange={(e) => setMargin(e.target.value)} placeholder="e.g. 2 up" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Course</Label>
                  <Input value={course} onChange={(e) => setCourse(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Played</Label>
                <Input type="date" value={played} onChange={(e) => setPlayed(e.target.value)} />
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={saveResult}
                disabled={updateFx.isPending}
              >
                {updateFx.isPending ? 'Saving…' : 'Save result'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function PlayerSelect({
  value,
  onChange,
  players,
}: {
  value: string
  onChange: (v: string) => void
  players: Profile[]
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? NONE)}>
      <SelectTrigger size="sm">
        <SelectValue placeholder="TBD" />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        <SelectItem value={NONE}>TBD</SelectItem>
        {players.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {profileDisplayName(p)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
