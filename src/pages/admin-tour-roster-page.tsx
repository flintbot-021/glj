import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertTriangle, ChevronLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import {
  useDeleteTourPlayer,
  useInsertTourPlayer,
  usePlayers,
  useTourEvent,
  useTourPlayers,
  useUpdateTourPlayer,
} from '@/hooks/use-data'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { profileDisplayName } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import type { Profile, TourTeam } from '@/lib/types'

export function AdminTourRosterPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const { data: ev, isLoading: evLoading } = useTourEvent()
  const { data: roster, isLoading: rosterLoading } = useTourPlayers()
  const { data: allPlayers } = usePlayers()
  const insertTp = useInsertTourPlayer()
  const updateTp = useUpdateTourPlayer()
  const deleteTp = useDeleteTourPlayer()

  const [addPlayerId, setAddPlayerId] = useState('')
  const [addTeam, setAddTeam] = useState<TourTeam>('93s')
  const [addSeed, setAddSeed] = useState('1')
  const [addHcp, setAddHcp] = useState('18')

  if (!profile?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Admin Access Required</h2>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    )
  }

  const taken = new Set(roster?.map((r) => r.player_id) ?? [])
  const available =
    allPlayers?.filter((p) => !taken.has(p.id)).sort((a, b) => profileDisplayName(a).localeCompare(profileDisplayName(b))) ?? []

  const onAdd = () => {
    if (!ev || !addPlayerId) return
    insertTp.mutate(
      {
        tour_id: ev.id,
        player_id: addPlayerId,
        team: addTeam,
        seed: Math.min(32, Math.max(1, Number(addSeed) || 1)),
        locked_handicap: Number(addHcp) || 0,
      },
      {
        onSuccess: () => {
          setAddPlayerId('')
          setAddSeed('1')
        },
      }
    )
  }

  return (
    <div className="py-4 px-4">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/tour')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-black tracking-tight">Tour roster</h1>
          <p className="text-sm text-muted-foreground">Seeds, teams, locked handicaps</p>
        </div>
      </div>

      {!ev ? (
        <p className="text-sm text-muted-foreground">Create a tour under Event first.</p>
      ) : evLoading || rosterLoading ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-4 mb-4 space-y-3">
            <p className="text-sm font-semibold">Add player</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label>Profile</Label>
                <Select value={addPlayerId} onValueChange={(v) => v != null && setAddPlayerId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose…" />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {profileDisplayName(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Team</Label>
                <Select value={addTeam} onValueChange={(v) => setAddTeam(v as TourTeam)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="93s">93s</SelectItem>
                    <SelectItem value="91s">91s</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Seed</Label>
                <Input value={addSeed} onChange={(e) => setAddSeed(e.target.value)} inputMode="numeric" />
              </div>
              <div className="space-y-1">
                <Label>Locked HCP</Label>
                <Input value={addHcp} onChange={(e) => setAddHcp(e.target.value)} inputMode="decimal" />
              </div>
            </div>
            <Button onClick={onAdd} disabled={!addPlayerId || insertTp.isPending} size="sm">
              {insertTp.isPending ? 'Adding…' : 'Add to tour'}
            </Button>
          </div>

          <div className="rounded-xl border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead className="w-[100px]">Team</TableHead>
                  <TableHead className="w-[80px]">Seed</TableHead>
                  <TableHead className="w-[100px]">HCP</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster?.map((row) => (
                  <RosterRow
                    key={row.id}
                    row={row}
                    onSave={(patch) => updateTp.mutate({ id: row.id, patch })}
                    onDelete={() => {
                      if (confirm('Remove this player from the tour?')) deleteTp.mutate(row.id)
                    }}
                    busy={updateTp.isPending || deleteTp.isPending}
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

function RosterRow({
  row,
  onSave,
  onDelete,
  busy,
}: {
  row: { id: string; team: TourTeam; seed: number; locked_handicap: number; profile: Profile }
  onSave: (patch: { team?: TourTeam; seed?: number; locked_handicap?: number }) => void
  onDelete: () => void
  busy: boolean
}) {
  const [team, setTeam] = useState(row.team)
  const [seed, setSeed] = useState(String(row.seed))
  const [hcp, setHcp] = useState(String(row.locked_handicap))

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <PlayerAvatar player={row.profile} size="sm" />
          <div>
            <p className="text-sm font-medium">{profileDisplayName(row.profile)}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{row.profile.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Select value={team} onValueChange={(v) => setTeam(v as TourTeam)}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="93s">93s</SelectItem>
            <SelectItem value="91s">91s</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input className="h-8" value={seed} onChange={(e) => setSeed(e.target.value)} inputMode="numeric" />
      </TableCell>
      <TableCell>
        <Input className="h-8" value={hcp} onChange={(e) => setHcp(e.target.value)} inputMode="decimal" />
      </TableCell>
      <TableCell className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() =>
            onSave({
              team,
              seed: Math.min(32, Math.max(1, Number(seed) || 1)),
              locked_handicap: Number(hcp) || 0,
            })
          }
        >
          Save
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={onDelete}>
          Remove
        </Button>
      </TableCell>
    </TableRow>
  )
}
