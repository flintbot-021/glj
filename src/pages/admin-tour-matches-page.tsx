import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import type { Profile, TourMatchStatus, TourTeam } from '@/lib/types'

export function AdminTourMatchesPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const { data: ev } = useTourEvent()
  const { data: days } = useTourDays()
  const [dayId, setDayId] = useState('')
  const { data: matches, isLoading: mLoading } = useTourMatchesForDay(dayId || undefined)
  const matchIds = useMemo(() => matches?.map((m) => m.id) ?? [], [matches])
  const { data: allMps, isLoading: mpLoading } = useTourMatchPlayersBatch(matchIds)
  const { data: roster } = useTourPlayers()
  const insertM = useInsertTourMatchMutation()
  const updateM = useUpdateTourMatchMutation()
  const deleteM = useDeleteTourMatchMutation()
  const replaceP = useReplaceTourMatchPlayers()

  useEffect(() => {
    if (days?.length && !dayId) setDayId(days[0].id)
  }, [days, dayId])

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
          <p className="text-sm text-muted-foreground">Pairings and team points for each day</p>
        </div>
      </div>

      {!ev || !days?.length ? (
        <p className="text-sm text-muted-foreground">Create tour days first.</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-3 items-end">
            <div className="space-y-1 max-w-xs flex-1">
              <Label>Day</Label>
              <Select value={dayId} onValueChange={(v) => v != null && setDayId(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      Day {d.day_number} — {d.course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="secondary" onClick={onAddMatch} disabled={insertM.isPending || !dayId}>
              Add match (93s vs 91s)
            </Button>
          </div>

          {loading ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : (
            <ul className="space-y-6">
              {matches?.map((match) => {
                const mps = allMps?.filter((mp) => mp.match_id === match.id) ?? []
                return (
                  <li key={match.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <MatchHeader
                      match={match}
                      roster={roster ?? []}
                      mps={mps}
                      onSaveMeta={(patch) => updateM.mutate({ id: match.id, patch })}
                      onSavePlayers={(rows) => replaceP.mutate({ matchId: match.id, rows })}
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
            <p className="text-sm text-muted-foreground">No matches on this day — add one above.</p>
          )}
        </>
      )}
    </div>
  )
}

type Tp = {
  id: string
  team: TourTeam
  player_id: string
  profile: Profile
}

function MatchHeader({
  match,
  roster,
  mps,
  onSaveMeta,
  onSavePlayers,
  onDelete,
  busy,
}: {
  match: {
    id: string
    team_a: TourTeam
    team_b: TourTeam
    status: TourMatchStatus
    team_a_points: number
    team_b_points: number
  }
  roster: Tp[]
  mps: { tour_player_id: string; team: TourTeam; pair_index: number }[]
  onSaveMeta: (patch: {
    team_a?: TourTeam
    team_b?: TourTeam
    status?: TourMatchStatus
    team_a_points?: number
    team_b_points?: number
  }) => void
  onSavePlayers: (
    rows: { tour_player_id: string; team: TourTeam; pair_index: 0 | 1 }[]
  ) => void
  onDelete: () => void
  busy: boolean
}) {
  const pick = (team: TourTeam, pair: 0 | 1) =>
    mps.find((mp) => mp.team === team && mp.pair_index === pair)?.tour_player_id ?? ''

  const [teamA, setTeamA] = useState<TourTeam>(match.team_a)
  const [teamB, setTeamB] = useState<TourTeam>(match.team_b)
  const [status, setStatus] = useState<TourMatchStatus>(match.status)
  const [pa, setPa] = useState(String(match.team_a_points))
  const [pb, setPb] = useState(String(match.team_b_points))
  const [a0, setA0] = useState(pick(match.team_a, 0))
  const [a1, setA1] = useState(pick(match.team_a, 1))
  const [b0, setB0] = useState(pick(match.team_b, 0))
  const [b1, setB1] = useState(pick(match.team_b, 1))

  const sideA = roster.filter((t) => t.team === teamA)
  const sideB = roster.filter((t) => t.team === teamB)

  const saveLineup = () => {
    const rows: { tour_player_id: string; team: TourTeam; pair_index: 0 | 1 }[] = []
    if (a0) rows.push({ tour_player_id: a0, team: teamA, pair_index: 0 })
    if (a1) rows.push({ tour_player_id: a1, team: teamA, pair_index: 1 })
    if (b0) rows.push({ tour_player_id: b0, team: teamB, pair_index: 0 })
    if (b1) rows.push({ tour_player_id: b1, team: teamB, pair_index: 1 })
    onSavePlayers(rows)
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Team A</Label>
          <Select value={teamA} onValueChange={(v) => setTeamA(v as TourTeam)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="93s">93s</SelectItem>
              <SelectItem value="91s">91s</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="pb-2 text-muted-foreground">vs</span>
        <div className="space-y-1">
          <Label className="text-xs">Team B</Label>
          <Select value={teamB} onValueChange={(v) => setTeamB(v as TourTeam)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="93s">93s</SelectItem>
              <SelectItem value="91s">91s</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as TourMatchStatus)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Pts A</Label>
          <Input className="h-8 w-20" value={pa} onChange={(e) => setPa(e.target.value)} inputMode="decimal" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Pts B</Label>
          <Input className="h-8 w-20" value={pb} onChange={(e) => setPb(e.target.value)} inputMode="decimal" />
        </div>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy || teamA === teamB}
          onClick={() =>
            onSaveMeta({
              team_a: teamA,
              team_b: teamB,
              status,
              team_a_points: Number(pa) || 0,
              team_b_points: Number(pb) || 0,
            })
          }
        >
          Save result
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={onDelete}>
          Delete match
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-border">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Team A players</p>
          <PlayerPick label="Pair 0" value={a0} onChange={setA0} options={sideA} />
          <PlayerPick label="Pair 1" value={a1} onChange={setA1} options={sideA} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Team B players</p>
          <PlayerPick label="Pair 0" value={b0} onChange={setB0} options={sideB} />
          <PlayerPick label="Pair 1" value={b1} onChange={setB1} options={sideB} />
        </div>
      </div>
      <Button size="sm" disabled={busy || teamA === teamB} onClick={saveLineup}>
        Save lineup
      </Button>
    </>
  )
}

function PlayerPick({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Tp[]
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-12 text-muted-foreground">{label}</span>
      <Select
        value={value || '__none__'}
        onValueChange={(v) => onChange(v == null || v === '__none__' ? '' : v)}
      >
        <SelectTrigger className="flex-1 min-w-0">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">—</SelectItem>
          {options.map((tp) => (
            <SelectItem key={tp.id} value={tp.id}>
              {profileDisplayName(tp.profile)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
