import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronLeft } from 'lucide-react'
import {
  useActiveSeason,
  usePlayers,
  useStrokeplayRoundsForSubSeason,
  useSubSeasons,
  useCloseBonusLeg,
} from '@/hooks/use-data'
import { rankPlayersForBonusLeg } from '@/lib/bonus-ladder'
import { profileDisplayName, formatPoints } from '@/lib/format'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import type { SubSeason } from '@/lib/types'

export function AdminRtdBonusPage() {
  const navigate = useNavigate()
  const { data: season } = useActiveSeason()
  const { data: subSeasons } = useSubSeasons()
  const { data: players = [] } = usePlayers()
  const closeLeg = useCloseBonusLeg()

  const openSubs = useMemo(
    () => subSeasons?.filter((s) => s.status === 'open') ?? [],
    [subSeasons]
  )

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (selectedId) return
    const first = openSubs[0]?.id
    if (first) setSelectedId(first)
  }, [openSubs, selectedId])
  const selected: SubSeason | undefined = useMemo(() => {
    if (!subSeasons?.length) return undefined
    if (selectedId) return subSeasons.find((s) => s.id === selectedId)
    return openSubs[0] ?? subSeasons.find((s) => s.status === 'open')
  }, [subSeasons, selectedId, openSubs])

  const { data: rounds = [] } = useStrokeplayRoundsForSubSeason(selected?.id)

  const ranked = useMemo(() => {
    if (!selected) return []
    return rankPlayersForBonusLeg(players, rounds, selected.id)
  }, [players, rounds, selected])

  const top3 = useMemo(() => {
    const finite = ranked.filter((r) => r.best_net < Number.POSITIVE_INFINITY).slice(0, 3)
    return finite
  }, [ranked])

  const [confirmOpen, setConfirmOpen] = useState(false)

  const previewAwards = useMemo(() => {
    if (!selected || top3.length === 0) return []
    const pts = [selected.bonus_1st, selected.bonus_2nd, selected.bonus_3rd]
    return top3.map((row, i) => ({
      player_id: row.player.id,
      position: (i + 1) as 1 | 2 | 3,
      points_awarded: pts[i]!,
      player: row.player,
      best_net: row.best_net,
      second_net: row.second_net,
    }))
  }, [selected, top3])

  const handleConfirm = async () => {
    if (!season || !selected || previewAwards.length === 0) return
    await closeLeg.mutateAsync({
      subSeasonId: selected.id,
      seasonId: season.id,
      awards: previewAwards.map(({ player_id, position, points_awarded }) => ({
        player_id,
        position,
        points_awarded,
      })),
    })
    setConfirmOpen(false)
    setSelectedId(undefined)
  }

  return (
    <div className="py-4">
      <div className="px-4 mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/rtd')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-black">Close bonus leg</h1>
          <p className="text-sm text-muted-foreground">Assign top 3, then open the next leg</p>
        </div>
      </div>

      <div className="px-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Which leg?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Only <strong>open</strong> legs can be closed. Ranking uses best net, then second-best net, from
              rounds in that leg only (same as the app ladder).
            </p>
            <select
              className="w-full h-9 rounded-lg border border-input bg-background px-2 text-sm"
              value={selected?.id ?? ''}
              onChange={(e) => setSelectedId(e.target.value || undefined)}
            >
              {openSubs.length === 0 ? (
                <option value="">No open legs</option>
              ) : (
                openSubs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.start_date} → {s.end_date})
                  </option>
                ))
              )}
            </select>
          </CardContent>
        </Card>

        {selected && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Provisional ranking — {selected.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ranked.slice(0, 12).map((row, i) => (
                <div key={row.player.id} className="flex items-center gap-2 text-sm">
                  <span className="w-6 text-muted-foreground tabular-nums">{i + 1}</span>
                  <PlayerAvatar player={row.player} size="xs" />
                  <span className="flex-1 font-medium truncate">{profileDisplayName(row.player)}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {row.best_net < Number.POSITIVE_INFINITY ? row.best_net.toFixed(1) : '—'} /{' '}
                    {row.second_net < Number.POSITIVE_INFINITY ? row.second_net.toFixed(1) : '—'}
                  </span>
                </div>
              ))}
              {ranked.length === 0 && <p className="text-sm text-muted-foreground">No stroke rounds yet.</p>}
            </CardContent>
          </Card>
        )}

        <Button
          className="w-full"
          style={{ backgroundColor: 'oklch(0.91 0.19 106)', color: 'oklch(0.20 0.07 150)' }}
          disabled={!selected || openSubs.length === 0 || closeLeg.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          Review &amp; close leg
        </Button>

        {selected && top3.length < 3 && top3.length > 0 && (
          <p className="text-xs text-amber-700 dark:text-amber-500">
            Fewer than three eligible players — only {top3.length} bonus row
            {top3.length === 1 ? '' : 's'} will be recorded.
          </p>
        )}
        {selected && top3.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No counting rounds yet — you can still close the leg to open the next (no bonus rows written).
          </p>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm bonus points</DialogTitle>
            <DialogDescription>
              This will record awards for <strong>{selected?.name}</strong>, mark it closed, and open the next
              dated leg. Group standings will pick up these points immediately.
            </DialogDescription>
          </DialogHeader>
          {previewAwards.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No bonus rows — leg will still be closed and the next opened.</p>
          ) : (
            <ul className="space-y-2 py-2">
              {previewAwards.map((a) => (
                <li key={a.player_id} className="flex items-center gap-2 text-sm">
                  <span className="font-bold w-8">#{a.position}</span>
                  <PlayerAvatar player={a.player} size="xs" />
                  <span className="flex-1">{profileDisplayName(a.player)}</span>
                  <span className="font-bold tabular-nums" style={{ color: 'oklch(0.91 0.19 106)' }}>
                    +{formatPoints(a.points_awarded)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleConfirm()}
              disabled={closeLeg.isPending}
            >
              {closeLeg.isPending ? 'Saving…' : 'Confirm & close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
