import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertTriangle, ChevronLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import {
  useTourDays,
  useTourEvent,
  useTourPlayerDayHandicapsQuery,
  useTourPlayers,
  useUpsertTourPlayerDayHandicap,
} from '@/hooks/use-data'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { profileDisplayName } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import type { Profile } from '@/lib/types'

export function AdminTourHandicapsPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const { data: ev } = useTourEvent()
  const { data: days, isLoading: daysLoading } = useTourDays()
  const { data: roster, isLoading: rosterLoading } = useTourPlayers()
  const [dayId, setDayId] = useState('')
  const { data: dayHcs, isLoading: hcLoading } = useTourPlayerDayHandicapsQuery(dayId || undefined)
  const upsert = useUpsertTourPlayerDayHandicap()

  useEffect(() => {
    if (days?.length && !dayId) setDayId(days[0].id)
  }, [days, dayId])

  const hcByTp = useMemo(() => new Map(dayHcs?.map((h) => [h.tour_player_id, h.course_handicap]) ?? []), [dayHcs])

  if (!profile?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Admin Access Required</h2>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    )
  }

  const loading = daysLoading || rosterLoading || (!!dayId && hcLoading)

  return (
    <div className="py-4 px-4">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/tour')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-black tracking-tight">Day handicaps</h1>
          <p className="text-sm text-muted-foreground">Course / playing handicap per day (overrides locked HCP for scoring)</p>
        </div>
      </div>

      {!ev ? (
        <p className="text-sm text-muted-foreground">Create a tour and days first.</p>
      ) : !days?.length ? (
        <p className="text-sm text-muted-foreground">No tour days yet.</p>
      ) : loading && !roster ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <>
          <div className="mb-4 max-w-xs space-y-1">
            <Label>Tour day</Label>
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

          <div className="rounded-xl border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead className="w-[120px]">Locked HCP</TableHead>
                  <TableHead className="w-[140px]">Day HCP</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster?.map((tp) => (
                  <HcpRow
                    key={`${dayId}-${tp.id}`}
                    tourDayId={dayId}
                    locked={tp.locked_handicap}
                    defaultDay={hcByTp.get(tp.id)}
                    profile={tp.profile}
                    onSave={(course_handicap) =>
                      upsert.mutate({ tour_day_id: dayId, tour_player_id: tp.id, course_handicap })
                    }
                    busy={upsert.isPending}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}

function HcpRow({
  tourDayId,
  locked,
  defaultDay,
  profile,
  onSave,
  busy,
}: {
  tourDayId: string
  locked: number
  defaultDay: number | undefined
  profile: Profile
  onSave: (course_handicap: number) => void
  busy: boolean
}) {
  const base = defaultDay ?? locked
  const [v, setV] = useState(String(base))

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <PlayerAvatar player={profile} size="sm" />
          <span className="text-sm font-medium">{profileDisplayName(profile)}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">{locked}</TableCell>
      <TableCell>
        <Input className="h-8 w-24" value={v} onChange={(e) => setV(e.target.value)} inputMode="decimal" />
      </TableCell>
      <TableCell>
        <Button size="sm" variant="secondary" disabled={busy || !tourDayId} onClick={() => onSave(Number(v) || 0)}>
          Save
        </Button>
      </TableCell>
    </TableRow>
  )
}
