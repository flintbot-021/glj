import { useMemo, useState } from 'react'
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
import { buildPodiumPlan, rankPlayersForBonusLeg } from '@/lib/bonus-ladder'
import type { BonusTieContest } from '@/lib/bonus-ladder'
import { profileDisplayName, formatPoints } from '@/lib/format'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { BonusTieWheel } from '@/components/admin/bonus-tie-wheel'
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
  const [resolutions, setResolutions] = useState<Record<string, string[]>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [activeContest, setActiveContest] = useState<BonusTieContest | null>(null)

  // Default to first open leg without an effect once options load.
  const effectiveSelectedId = selectedId ?? openSubs[0]?.id

  const selected: SubSeason | undefined = useMemo(() => {
    if (!subSeasons?.length) return undefined
    if (effectiveSelectedId) return subSeasons.find((s) => s.id === effectiveSelectedId)
    return openSubs[0] ?? subSeasons.find((s) => s.status === 'open')
  }, [subSeasons, effectiveSelectedId, openSubs])

  const { data: rounds = [] } = useStrokeplayRoundsForSubSeason(selected?.id)

  const ranked = useMemo(() => {
    if (!selected) return []
    return rankPlayersForBonusLeg(players, rounds, selected)
  }, [players, rounds, selected])

  const bonusPts = useMemo((): [number, number, number] => {
    if (!selected) return [1.5, 1.0, 0.5]
    return [selected.bonus_1st, selected.bonus_2nd, selected.bonus_3rd]
  }, [selected])

  const podiumPlan = useMemo(() => {
    if (!selected) {
      return { awards: [], contests: [], unresolvedContests: [] }
    }
    return buildPodiumPlan(ranked, bonusPts, resolutions)
  }, [selected, ranked, bonusPts, resolutions])

  const eligibleCount = useMemo(
    () => ranked.filter((r) => r.combined_net < Number.POSITIVE_INFINITY).length,
    [ranked]
  )

  const tiesResolved = podiumPlan.unresolvedContests.length === 0
  const hasTies = podiumPlan.contests.length > 0

  const resetTieState = () => {
    setResolutions({})
    setActiveContest(null)
    setConfirmOpen(false)
  }

  const handleSelectLeg = (id: string | undefined) => {
    setSelectedId(id)
    resetTieState()
  }

  const handleReview = () => {
    if (!tiesResolved) {
      const next = podiumPlan.unresolvedContests[0]
      if (next) setActiveContest(next)
      return
    }
    setConfirmOpen(true)
  }

  const handleContestResolved = (orderedPlayerIds: string[]) => {
    if (!activeContest) return
    const contestId = activeContest.id
    const nextResolutions = { ...resolutions, [contestId]: orderedPlayerIds }
    setResolutions(nextResolutions)
    setActiveContest(null)
    const plan = buildPodiumPlan(ranked, bonusPts, nextResolutions)
    const nextContest = plan.unresolvedContests[0]
    if (nextContest) {
      // Defer so the current dialog can close cleanly before opening the next.
      window.setTimeout(() => setActiveContest(nextContest), 0)
    } else {
      window.setTimeout(() => setConfirmOpen(true), 0)
    }
  }

  const handleConfirm = async () => {
    if (!season || !selected) return
    const { awards } = buildPodiumPlan(ranked, bonusPts, resolutions)
    if (awards.length === 0 && eligibleCount > 0 && !tiesResolved) return
    await closeLeg.mutateAsync({
      subSeasonId: selected.id,
      seasonId: season.id,
      awards: awards.map(({ player_id, position, points_awarded }) => ({
        player_id,
        position,
        points_awarded,
      })),
    })
    setConfirmOpen(false)
    resetTieState()
    setSelectedId(undefined)
  }

  const tiedPlayerIds = useMemo(() => {
    const ids = new Set<string>()
    for (const c of podiumPlan.contests) {
      for (const p of c.players) ids.add(p.player.id)
    }
    return ids
  }, [podiumPlan.contests])

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
              Only <strong>open</strong> legs can be closed. Each player needs <strong>two</strong> rounds in
              the leg to rank — only rounds with a play date inside the leg&apos;s date window count.
              Eligible order is by <strong>lowest combined</strong> net (sum of your two lowest rounds).
              Equal combined nets on the podium are broken by spinning a wheel — not by secondary scores.
            </p>
            <select
              className="w-full h-9 rounded-lg border border-input bg-background px-2 text-sm"
              value={selected?.id ?? ''}
              onChange={(e) => handleSelectLeg(e.target.value || undefined)}
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
                  {tiedPlayerIds.has(row.player.id) && (
                    <span
                      className="shrink-0 text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: 'oklch(0.80 0.14 72)' }}
                    >
                      Tie
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground tabular-nums text-right">
                    {row.combined_net < Number.POSITIVE_INFINITY ? (
                      <>
                        <span className="font-semibold text-foreground">{row.combined_net.toFixed(1)}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          ({row.best_net.toFixed(1)}+{row.second_net.toFixed(1)})
                        </span>
                      </>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
              ))}
              {ranked.length === 0 && <p className="text-sm text-muted-foreground">No stroke rounds yet.</p>}
            </CardContent>
          </Card>
        )}

        {selected && hasTies && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Podium ties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Spin the wheel to decide place order among tied players before closing the leg.
              </p>
              {podiumPlan.contests.map((contest) => {
                const resolved = resolutions[contest.id]
                const places =
                  contest.positions.length === 1
                    ? `#${contest.positions[0]}`
                    : `#${contest.positions[0]}–#${contest.positions[contest.positions.length - 1]}`
                return (
                  <div
                    key={contest.id}
                    className="flex flex-col gap-2 rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">
                          Tie for {places}{' '}
                          <span className="font-normal text-muted-foreground">
                            ({contest.combined_net.toFixed(1)} combined)
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {contest.players.map((r) => profileDisplayName(r.player)).join(', ')}
                        </p>
                      </div>
                      {resolved ? (
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          Resolved
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          style={{
                            backgroundColor: 'oklch(0.80 0.14 72)',
                            color: 'oklch(0.18 0.06 60)',
                          }}
                          onClick={() => setActiveContest(contest)}
                        >
                          Spin
                        </Button>
                      )}
                    </div>
                    {resolved && (
                      <ol className="space-y-1 text-xs">
                        {resolved.map((id, i) => {
                          const row = contest.players.find((r) => r.player.id === id)
                          const pos = contest.positions[i]
                          if (!row || pos == null) return null
                          return (
                            <li key={id} className="flex items-center gap-2">
                              <span className="w-6 font-bold">#{pos}</span>
                              <PlayerAvatar player={row.player} size="xs" />
                              <span className="truncate">{profileDisplayName(row.player)}</span>
                              <span
                                className="ml-auto font-bold tabular-nums"
                                style={{ color: 'oklch(0.80 0.14 72)' }}
                              >
                                +{formatPoints(bonusPts[pos - 1]!)}
                              </span>
                            </li>
                          )
                        })}
                      </ol>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        <Button
          className="w-full"
          style={{ backgroundColor: 'oklch(0.80 0.14 72)', color: 'oklch(0.18 0.06 60)' }}
          disabled={!selected || openSubs.length === 0 || closeLeg.isPending}
          onClick={handleReview}
        >
          {!tiesResolved ? 'Resolve ties to continue' : 'Review & close leg'}
        </Button>

        {selected && eligibleCount < 3 && eligibleCount > 0 && (
          <p className="text-xs text-amber-700 dark:text-amber-500">
            Fewer than three eligible players — only {Math.min(eligibleCount, podiumPlan.awards.length || eligibleCount)}{' '}
            bonus row
            {eligibleCount === 1 ? '' : 's'} will be recorded
            {hasTies && !tiesResolved ? ' after ties are resolved' : ''}.
          </p>
        )}
        {selected && eligibleCount === 0 && (
          <p className="text-xs text-muted-foreground">
            No one has two counting rounds in this leg yet — you can still close it to open the next (no bonus
            rows written).
          </p>
        )}
      </div>

      <Dialog
        open={activeContest != null}
        onOpenChange={(open) => {
          if (!open) setActiveContest(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Spin to break the tie</DialogTitle>
            <DialogDescription>
              Each spin awards the next place. Keep spinning until every contested place is filled.
            </DialogDescription>
          </DialogHeader>
          {activeContest && (
            <BonusTieWheel
              key={activeContest.id}
              contest={activeContest}
              onResolved={handleContestResolved}
              onCancel={() => setActiveContest(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm bonus points</DialogTitle>
            <DialogDescription>
              This will record awards for <strong>{selected?.name}</strong>, mark it closed, and open the next
              dated leg. Group standings will pick up these points immediately.
            </DialogDescription>
          </DialogHeader>
          {podiumPlan.awards.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No bonus rows — leg will still be closed and the next opened.
            </p>
          ) : (
            <ul className="space-y-2 py-2">
              {podiumPlan.awards.map((a) => (
                <li key={a.player_id} className="flex items-center gap-2 text-sm">
                  <span className="font-bold w-8">#{a.position}</span>
                  <PlayerAvatar player={a.player} size="xs" />
                  <span className="min-w-0 flex-1 truncate">{profileDisplayName(a.player)}</span>
                  <span
                    className="shrink-0 text-xs tabular-nums text-muted-foreground"
                    title="Sum of two lowest net scores this leg"
                  >
                    {a.combined_net.toFixed(1)}
                  </span>
                  <span className="shrink-0 font-bold tabular-nums" style={{ color: 'oklch(0.80 0.14 72)' }}>
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
            <Button onClick={() => void handleConfirm()} disabled={closeLeg.isPending || !tiesResolved}>
              {closeLeg.isPending ? 'Saving…' : 'Confirm & close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
