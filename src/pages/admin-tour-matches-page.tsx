import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, ChevronLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import {
  useDeleteTourMatchMutation,
  useInsertTourMatchMutation,
  useReplaceTourMatchPlayers,
  useTourDays,
  useTourEvent,
  useTourMatchPlayersBatch,
  useTourMatchesForDay,
  useTourPlayers,
  useUpdateTourMatchMutation,
} from '@/hooks/use-data'
import { Skeleton } from '@/components/ui/skeleton'
import { profileDisplayName } from '@/lib/format'
import { expectedMatchCount, matchFormatFromTourFormat } from '@/lib/tour-scoring'
import { TEAM_BLUE, TEAM_RED } from '@/lib/tour-colors'
import { cn } from '@/lib/utils'
import type { Profile, TourMatchStatus, TourTeam } from '@/lib/types'

export function AdminTourMatchesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const profile = useAuthStore((s) => s.profile)
  const { data: ev } = useTourEvent()
  const { data: days } = useTourDays()
  const dayId = searchParams.get('day') ?? ''
  const setDayId = (id: string) => setSearchParams({ day: id }, { replace: true })
  const { data: matches, isLoading: mLoading } = useTourMatchesForDay(dayId || undefined)
  const matchIds = useMemo(() => matches?.map((m) => m.id) ?? [], [matches])
  const { data: allMps, isLoading: mpLoading } = useTourMatchPlayersBatch(matchIds)
  const { data: roster } = useTourPlayers()
  const insertM = useInsertTourMatchMutation()
  const updateM = useUpdateTourMatchMutation()
  const deleteM = useDeleteTourMatchMutation()
  const replaceP = useReplaceTourMatchPlayers()

  useEffect(() => {
    if (!days?.length) return
    if (dayId && days.some((d) => d.id === dayId)) return
    setDayId(days[0]!.id)
  }, [days, dayId])

  const day = days?.find((d) => d.id === dayId)
  const spec = matchFormatFromTourFormat(day?.format)
  const singles = spec.expectedMatches === 8 || spec.compare === 'lower_net'
  const want = expectedMatchCount(day?.format, day?.day_number)
  const have = matches?.length ?? 0

  if (!profile?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Admin Access Required</h2>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    )
  }

  const loading = mLoading || mpLoading

  const onAddMatch = () => {
    if (!dayId) return
    insertM.mutate({
      tour_day_id: dayId,
      team_a: '93s',
      team_b: '91s',
      status: 'scheduled',
      team_a_points: 0,
      team_b_points: 0,
    })
  }

  return (
    <div className="py-4 px-4 pb-12">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/tour')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-black tracking-tight">Tour matches</h1>
          <p className="text-sm text-muted-foreground">Set pairings. Scores come from the live scoring screen.</p>
        </div>
      </div>

      {!ev || !days?.length ? (
        <p className="text-sm text-muted-foreground">Create tour days first.</p>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
            {days.map((d) => {
              const on = d.id === dayId
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDayId(d.id)}
                  className={cn(
                    'shrink-0 rounded-xl border px-3 py-2 text-left min-w-[9.5rem]',
                    on ? 'bg-card border-foreground/20 shadow-sm' : 'border-border bg-muted/40',
                  )}
                >
                  <p className="text-sm font-black">Day {d.day_number}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{d.format.name}</p>
                </button>
              )
            })}
          </div>

          {day && (
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="text-xs text-muted-foreground">
                {singles ? 'Singles · 1v1' : 'Fourball · 2v2'}
                {' · '}
                {have} of {want} matches
                {day.course?.name ? ` · ${day.course.name}` : ' · Course TBC'}
              </p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onAddMatch}
                disabled={insertM.isPending || !dayId}
              >
                {insertM.isPending ? 'Adding…' : singles ? 'Add singles' : 'Add fourball'}
              </Button>
            </div>
          )}

          {loading ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : (
            <ul className="space-y-3">
              {matches?.map((match, i) => {
                const mps = allMps?.filter((mp) => mp.match_id === match.id) ?? []
                const taken = new Set(
                  (allMps ?? [])
                    .filter((mp) => mp.match_id !== match.id)
                    .map((mp) => mp.tour_player_id),
                )
                return (
                  <li key={match.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <MatchCard
                      index={i + 1}
                      match={match}
                      roster={roster ?? []}
                      mps={mps}
                      taken={taken}
                      singles={singles}
                      onSavePlayers={(rows) => replaceP.mutate({ matchId: match.id, rows })}
                      onSaveStatus={(status) => updateM.mutate({ id: match.id, patch: { status } })}
                      onDelete={() => {
                        if (confirm('Delete this match and its scores?')) deleteM.mutate(match.id)
                      }}
                      busy={updateM.isPending || replaceP.isPending || deleteM.isPending}
                    />
                  </li>
                )
              })}
            </ul>
          )}
          {!loading && matches?.length === 0 && (
            <p className="text-sm text-muted-foreground">No matches on this day yet.</p>
          )}
        </>
      )}
    </div>
  )
}

type Tp = {
  id: string
  team: TourTeam
  seed: number
  player_id: string
  profile: Profile
}

function MatchCard({
  index,
  match,
  roster,
  mps,
  taken,
  singles,
  onSavePlayers,
  onSaveStatus,
  onDelete,
  busy,
}: {
  index: number
  match: {
    id: string
    team_a: TourTeam
    team_b: TourTeam
    status: TourMatchStatus
  }
  roster: Tp[]
  mps: { tour_player_id: string; team: TourTeam; pair_index: number }[]
  taken: Set<string>
  singles: boolean
  onSavePlayers: (rows: { tour_player_id: string; team: TourTeam; pair_index: 0 | 1 }[]) => void
  onSaveStatus: (status: TourMatchStatus) => void
  onDelete: () => void
  busy: boolean
}) {
  const pick = (team: TourTeam, pair: 0 | 1) =>
    mps.find((mp) => mp.team === team && mp.pair_index === pair)?.tour_player_id ?? ''

  const [status, setStatus] = useState<TourMatchStatus>(match.status)
  const [a0, setA0] = useState(pick('93s', 0))
  const [a1, setA1] = useState(pick('93s', 1))
  const [b0, setB0] = useState(pick('91s', 0))
  const [b1, setB1] = useState(pick('91s', 1))

  useEffect(() => {
    setStatus(match.status)
    setA0(pick('93s', 0))
    setA1(pick('93s', 1))
    setB0(pick('91s', 0))
    setB1(pick('91s', 1))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remount lineup when server pairings change
  }, [match.id, match.status, mps])

  const side93 = roster.filter((t) => t.team === '93s').sort((a, b) => a.seed - b.seed)
  const side91 = roster.filter((t) => t.team === '91s').sort((a, b) => a.seed - b.seed)
  const usedHere = new Set([a0, a1, b0, b1].filter(Boolean))

  const saveLineup = () => {
    const rows: { tour_player_id: string; team: TourTeam; pair_index: 0 | 1 }[] = []
    if (a0) rows.push({ tour_player_id: a0, team: '93s', pair_index: 0 })
    if (!singles && a1) rows.push({ tour_player_id: a1, team: '93s', pair_index: 1 })
    if (b0) rows.push({ tour_player_id: b0, team: '91s', pair_index: 0 })
    if (!singles && b1) rows.push({ tour_player_id: b1, team: '91s', pair_index: 1 })
    onSavePlayers(rows)
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black">Match {index}</p>
        <div className="flex items-center gap-2">
          <Select
            value={status}
            onValueChange={(v) => {
              if (!v) return
              const next = v as TourMatchStatus
              setStatus(next)
              onSaveStatus(next)
            }}
          >
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue>{statusLabel(status)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="ghost" className="text-destructive h-8 px-2" disabled={busy} onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SidePicks
          team="93s"
          slots={singles ? 1 : 2}
          values={[a0, a1]}
          onChange={(pair, id) => (pair === 0 ? setA0(id) : setA1(id))}
          options={side93}
          taken={taken}
          usedHere={usedHere}
        />
        <SidePicks
          team="91s"
          slots={singles ? 1 : 2}
          values={[b0, b1]}
          onChange={(pair, id) => (pair === 0 ? setB0(id) : setB1(id))}
          options={side91}
          taken={taken}
          usedHere={usedHere}
        />
      </div>

      <Button size="sm" disabled={busy} onClick={saveLineup}>
        Save lineup
      </Button>
    </>
  )
}

function SidePicks({
  team,
  slots,
  values,
  onChange,
  options,
  taken,
  usedHere,
}: {
  team: TourTeam
  slots: 1 | 2
  values: [string, string]
  onChange: (pair: 0 | 1, id: string) => void
  options: Tp[]
  taken: Set<string>
  usedHere: Set<string>
}) {
  const color = team === '93s' ? TEAM_BLUE : TEAM_RED
  return (
    <div className="space-y-2">
      <span
        className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded text-white"
        style={{ backgroundColor: color }}
      >
        {team}
      </span>
      {Array.from({ length: slots }, (_, i) => {
        const pair = i as 0 | 1
        const value = values[pair] ?? ''
        return (
          <PlayerPick
            key={pair}
            label={slots === 1 ? 'Player' : `Player ${pair + 1}`}
            value={value}
            onChange={(id) => onChange(pair, id)}
            options={options}
            disabledIds={new Set([...taken, ...[...usedHere].filter((id) => id !== value)])}
          />
        )
      })}
    </div>
  )
}

function PlayerPick({
  label,
  value,
  onChange,
  options,
  disabledIds,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Tp[]
  disabledIds: Set<string>
}) {
  const selected = options.find((tp) => tp.id === value)
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Select value={value || '__none__'} onValueChange={(v) => onChange(v == null || v === '__none__' ? '' : v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose player">
            {selected ? playerLabel(selected) : 'Choose player'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Choose player</SelectItem>
          {options.map((tp) => (
            <SelectItem key={tp.id} value={tp.id} disabled={disabledIds.has(tp.id)}>
              {playerLabel(tp)}
              {disabledIds.has(tp.id) ? ' · in another match' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function playerLabel(tp: Tp) {
  return `#${tp.seed} ${profileDisplayName(tp.profile)}`
}

function statusLabel(status: TourMatchStatus) {
  if (status === 'in_progress') return 'In progress'
  if (status === 'complete') return 'Complete'
  return 'Scheduled'
}
