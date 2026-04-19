import { useMemo, useState } from 'react'
import {
  useWagers,
  useTeamWagers,
  useAcceptWager,
  useDeclineWager,
  useConfirmWagerOutcome,
  useDisputeWagerOutcome,
  useReopenDisputedWager,
  useAcceptTeamWager,
  useDeclineTeamWager,
  useConfirmTeamWagerOutcome,
  useDisputeTeamWagerOutcome,
  useReopenDisputedTeamWager,
} from '@/hooks/use-data'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { WagerRecordOutcomeDialog } from '@/components/wagers/wager-record-outcome-dialog'
import { TeamWagerRecordDialog } from '@/components/wagers/team-wager-record-dialog'
import { formatRelativeTime, formatDate, formatWalletBalance, profileDisplayName } from '@/lib/format'
import { WAGER_STATUS_LABELS } from '@/lib/constants'
import type { EnrichedTeamWager, EnrichedWager, WagerStatus } from '@/lib/types'
import {
  needsOutcomeConfirmation,
  waitingOnOpponentConfirmation,
  needsTeamOutcomeConfirmation,
  waitingOnOtherTeamConfirmation,
  inTeamA,
  inTeamB,
} from '@/lib/wager-helpers'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import type { Profile } from '@/lib/types'

type FilterTab = 'all' | WagerStatus

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending_acceptance', label: 'Pending' },
  { id: 'active', label: 'Active' },
  { id: 'pending_confirmation', label: 'Confirm' },
  { id: 'settled', label: 'Settled' },
  { id: 'disputed', label: 'Disputed' },
]

const STATUS_COLOR: Record<WagerStatus, string> = {
  pending_acceptance: 'oklch(0.72 0.18 55)',
  active: 'oklch(0.42 0.15 260)',
  pending_confirmation: 'oklch(0.65 0.18 50)',
  settled: 'oklch(0.52 0.17 145)',
  disputed: 'oklch(0.55 0.22 25)',
}

const GREEN = 'oklch(0.22 0.068 157)'
const AMBER = 'oklch(0.65 0.18 50)'

function StatusPill({ status }: { status: WagerStatus }) {
  const color = STATUS_COLOR[status]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
      style={{ borderColor: `${color}40`, color, backgroundColor: `${color}12` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {WAGER_STATUS_LABELS[status]}
    </span>
  )
}

function teamLabel(p1: Profile, p2: Profile) {
  return `${profileDisplayName(p1)} & ${profileDisplayName(p2)}`
}

type WagerListItem =
  | { kind: 'solo'; created_at: string; wager: EnrichedWager }
  | { kind: 'team'; created_at: string; wager: EnrichedTeamWager }

export function WagersPage() {
  const profile = useAuthStore((s) => s.profile)
  const openScoreSheet = useUIStore((s) => s.openScoreSheet)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [outcomeWager, setOutcomeWager] = useState<EnrichedWager | null>(null)
  const [outcomeTeamWager, setOutcomeTeamWager] = useState<EnrichedTeamWager | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const acceptWager = useAcceptWager()
  const declineWager = useDeclineWager()
  const confirmOutcome = useConfirmWagerOutcome()
  const disputeOutcome = useDisputeWagerOutcome()
  const reopenWager = useReopenDisputedWager()
  const acceptTeamWager = useAcceptTeamWager()
  const declineTeamWager = useDeclineTeamWager()
  const confirmTeamOutcome = useConfirmTeamWagerOutcome()
  const disputeTeamOutcome = useDisputeTeamWagerOutcome()
  const reopenTeamWager = useReopenDisputedTeamWager()

  const statusFilter = activeTab === 'all' ? undefined : [activeTab]
  const { data: wagers = [], isLoading } = useWagers(profile?.id, statusFilter as WagerStatus[] | undefined)
  const { data: teamWagers = [], isLoading: teamLoading } = useTeamWagers(
    profile?.id,
    statusFilter as WagerStatus[] | undefined,
  )

  const combinedItems = useMemo((): WagerListItem[] => {
    const items: WagerListItem[] = [
      ...wagers.map((w) => ({ kind: 'solo' as const, created_at: w.created_at, wager: w })),
      ...teamWagers.map((w) => ({ kind: 'team' as const, created_at: w.created_at, wager: w })),
    ]
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return items
  }, [wagers, teamWagers])

  const listLoading = isLoading || teamLoading
  const clearError = () => setActionError(null)

  return (
    <div className="py-4">
      <WagerRecordOutcomeDialog
        wager={outcomeWager}
        profileId={profile?.id ?? ''}
        open={outcomeWager != null}
        onOpenChange={(open) => { if (!open) setOutcomeWager(null) }}
      />
      <TeamWagerRecordDialog
        wager={outcomeTeamWager}
        profileId={profile?.id ?? ''}
        open={outcomeTeamWager != null}
        onOpenChange={(open) => { if (!open) setOutcomeTeamWager(null) }}
      />

      {/* Header */}
      <div className="mb-4 flex items-center justify-between px-4">
        <h1 className="text-2xl font-black tracking-tight">Wagers</h1>
        <Button
          size="sm"
          className="gap-1.5 rounded-full"
          style={{ backgroundColor: 'oklch(0.80 0.14 72)', color: 'oklch(0.18 0.06 60)' }}
          onClick={openScoreSheet}
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </div>

      {/* Error banner */}
      {actionError && (
        <div className="mx-4 mb-3 rounded-xl border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); clearError() }}
            className={cn(
              'flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
              activeTab === tab.id ? 'text-white' : 'bg-muted text-muted-foreground',
            )}
            style={activeTab === tab.id ? { backgroundColor: GREEN } : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3 px-4">
        {listLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : combinedItems.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-3 text-4xl">💰</p>
            <p className="font-semibold">No wagers yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start a 1v1 or 2v2 challenge from Enter Score
            </p>
            <Button
              className="mt-4"
              style={{ backgroundColor: 'oklch(0.80 0.14 72)', color: 'oklch(0.18 0.06 60)' }}
              onClick={openScoreSheet}
            >
              New Wager
            </Button>
          </div>
        ) : (
          combinedItems.map((item) => {
            /* ── Solo wager ── */
            if (item.kind === 'solo') {
              const w = item.wager
              const isProposer = w.proposer_id === profile?.id
              const counterpart = isProposer ? w.opponent : w.proposer
              const me = isProposer ? w.proposer : w.opponent
              const myConfirm = profile?.id ? needsOutcomeConfirmation(w, profile.id) : false
              const waitingThem = profile?.id ? waitingOnOpponentConfirmation(w, profile.id) : false
              const accentColor = STATUS_COLOR[w.status]

              return (
                <div
                  key={`solo-${w.id}`}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                  style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}
                >
                  <div className="space-y-3 p-4">
                  {/* Players + amount */}
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <PlayerAvatar player={me} size="sm" className="shrink-0" />
                        <p className="truncate text-sm font-semibold">
                          {isProposer ? 'You' : profileDisplayName(me)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pl-0.5">
                        <div className="flex h-4 w-7 shrink-0 items-center justify-center">
                          <div className="h-px w-3 bg-border" />
                          <span className="px-1 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">vs</span>
                          <div className="h-px w-3 bg-border" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PlayerAvatar player={counterpart} size="sm" className="shrink-0" />
                        <p className="truncate text-sm font-semibold">
                          {profileDisplayName(counterpart)}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-base font-black tabular-nums" style={{ color: AMBER }}>
                        {formatWalletBalance(w.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        1v1 · {isProposer ? 'You challenged' : 'Challenged you'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{formatRelativeTime(w.created_at)}</p>
                    </div>
                  </div>

                    {/* Status + result */}
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={w.status} />
                      {w.result_winner && (
                        <span className="text-xs text-muted-foreground">
                          {profileDisplayName(w.result_winner)} won
                          {w.result_margin ? ` · ${w.result_margin}` : ''}
                          {w.result_played_at ? ` · ${formatDate(w.result_played_at)}` : ''}
                        </span>
                      )}
                    </div>

                    {/* Proposed result box */}
                    {w.status === 'pending_confirmation' &&
                      (w.result_margin || w.result_course || w.result_played_at) && (
                        <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs">
                          <p className="font-semibold">Proposed result</p>
                          <p className="mt-0.5 text-muted-foreground">
                            {w.result_winner_id == null
                              ? 'Halved'
                              : `${profileDisplayName(w.result_winner!)} wins`}
                            {w.result_margin ? ` · ${w.result_margin}` : ''}
                            {w.result_course ? ` · ${w.result_course}` : ''}
                            {w.result_played_at ? ` · ${formatDate(w.result_played_at)}` : ''}
                          </p>
                        </div>
                      )}

                    {waitingThem && (
                      <p className="text-xs text-muted-foreground">
                        Waiting for {profileDisplayName(counterpart)} to confirm.
                      </p>
                    )}

                    {/* Actions */}
                    {w.status === 'pending_acceptance' && !isProposer && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-9 flex-1 rounded-lg font-semibold"
                          style={{ backgroundColor: GREEN }}
                          disabled={acceptWager.isPending}
                          onClick={() => { clearError(); acceptWager.mutate(w.id, { onError: (e) => setActionError(e.message) }) }}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 flex-1 rounded-lg border-destructive/30 font-semibold text-destructive hover:bg-destructive/5"
                          disabled={declineWager.isPending}
                          onClick={() => { clearError(); declineWager.mutate(w.id, { onError: (e) => setActionError(e.message) }) }}
                        >
                          Decline
                        </Button>
                      </div>
                    )}

                    {w.status === 'pending_acceptance' && isProposer && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 w-full rounded-lg border-destructive/30 font-semibold text-destructive hover:bg-destructive/5"
                        disabled={declineWager.isPending}
                        onClick={() => { clearError(); declineWager.mutate(w.id, { onError: (e) => setActionError(e.message) }) }}
                      >
                        Cancel challenge
                      </Button>
                    )}

                    {w.status === 'active' && (
                      <Button
                        size="sm"
                        className="h-9 w-full rounded-lg font-semibold"
                        style={{ backgroundColor: GREEN }}
                        onClick={() => { clearError(); setOutcomeWager(w) }}
                      >
                        Record result
                      </Button>
                    )}

                    {w.status === 'pending_confirmation' && myConfirm && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-9 flex-1 rounded-lg font-semibold"
                            style={{ backgroundColor: GREEN }}
                            disabled={confirmOutcome.isPending}
                            onClick={() => { clearError(); confirmOutcome.mutate(w.id, { onError: (e) => setActionError(e.message) }) }}
                          >
                            Confirm result
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 flex-1 rounded-lg border-destructive/30 font-semibold text-destructive hover:bg-destructive/5"
                            disabled={disputeOutcome.isPending}
                            onClick={() => { clearError(); disputeOutcome.mutate(w.id, { onError: (e) => setActionError(e.message) }) }}
                          >
                            Dispute
                          </Button>
                        </div>
                        <p className="text-[11px] leading-snug text-muted-foreground">
                          Confirming moves R {w.amount.toFixed(2)} from loser to winner.
                        </p>
                      </div>
                    )}

                    {w.status === 'disputed' && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Disputed — clear to submit a new result.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 w-full rounded-lg"
                          disabled={reopenWager.isPending}
                          onClick={() => { clearError(); reopenWager.mutate(w.id, { onError: (e) => setActionError(e.message) }) }}
                        >
                          Clear dispute &amp; retry
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            }

            /* ── Team wager ── */
            const w = item.wager
            const pid = profile?.id
            const onB = pid ? inTeamB(w, pid) : false
            const isCreator = pid != null && w.created_by === pid
            const myTeamConfirm = pid ? needsTeamOutcomeConfirmation(w, pid) : false
            const waitingOther = pid ? waitingOnOtherTeamConfirmation(w, pid) : false
            const aLabel = teamLabel(w.team_a_p1_profile, w.team_a_p2_profile)
            const bLabel = teamLabel(w.team_b_p1_profile, w.team_b_p2_profile)
            const onA = pid ? inTeamA(w, pid) : false
            const accentColor = STATUS_COLOR[w.status]

            return (
              <div
                key={`team-${w.id}`}
                className="overflow-hidden rounded-xl border border-border bg-card"
                style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}
              >
                <div className="space-y-3 p-4">
                  {/* Teams + amount */}
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Team A */}
                      <div className="flex items-center gap-2">
                        <div className="flex shrink-0 -space-x-1.5">
                          <PlayerAvatar player={w.team_a_p1_profile} size="sm" className="ring-2 ring-card" />
                          <PlayerAvatar player={w.team_a_p2_profile} size="sm" className="ring-2 ring-card" />
                        </div>
                        <p className="truncate text-sm font-semibold">{aLabel}</p>
                      </div>
                      {/* vs divider */}
                      <div className="flex items-center gap-2 pl-0.5">
                        <div className="flex h-4 w-7 shrink-0 items-center justify-center">
                          <div className="h-px w-3 bg-border" />
                          <span className="px-1 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">vs</span>
                          <div className="h-px w-3 bg-border" />
                        </div>
                      </div>
                      {/* Team B */}
                      <div className="flex items-center gap-2">
                        <div className="flex shrink-0 -space-x-1.5">
                          <PlayerAvatar player={w.team_b_p1_profile} size="sm" className="ring-2 ring-card" />
                          <PlayerAvatar player={w.team_b_p2_profile} size="sm" className="ring-2 ring-card" />
                        </div>
                        <p className="truncate text-sm font-semibold">{bLabel}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-base font-black tabular-nums" style={{ color: AMBER }}>
                        R {w.amount.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">2v2 / loser</p>
                      <p className="text-[10px] text-muted-foreground">{formatRelativeTime(w.created_at)}</p>
                    </div>
                  </div>

                  {/* Status + result */}
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={w.status} />
                    {w.status === 'settled' && w.result_winner_team != null && (
                      <span className="text-xs text-muted-foreground">
                        {w.result_winner_team === 'a' ? aLabel : bLabel} won
                        {w.result_played_at ? ` · ${formatDate(w.result_played_at)}` : ''}
                      </span>
                    )}
                    {w.status === 'settled' && w.result_winner_team == null && (
                      <span className="text-xs text-muted-foreground">Halved</span>
                    )}
                  </div>

                  {/* Proposed result box */}
                  {w.status === 'pending_confirmation' &&
                    (w.result_margin || w.result_course || w.result_played_at) && (
                      <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs">
                        <p className="font-semibold">Proposed result</p>
                        <p className="mt-0.5 text-muted-foreground">
                          {w.result_winner_team == null
                            ? 'Halved'
                            : w.result_winner_team === 'a'
                              ? `${aLabel} win`
                              : `${bLabel} win`}
                          {w.result_margin ? ` · ${w.result_margin}` : ''}
                          {w.result_course ? ` · ${w.result_course}` : ''}
                          {w.result_played_at ? ` · ${formatDate(w.result_played_at)}` : ''}
                        </p>
                      </div>
                    )}

                  {waitingOther && pid && (
                    <p className="text-xs text-muted-foreground">
                      Waiting for the other team to confirm.
                    </p>
                  )}

                  {/* Actions */}
                  {w.status === 'pending_acceptance' && onB && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-9 flex-1 rounded-lg font-semibold"
                        style={{ backgroundColor: GREEN }}
                        disabled={acceptTeamWager.isPending}
                        onClick={() => { clearError(); acceptTeamWager.mutate(w.id, { onError: (e) => setActionError(e.message) }) }}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 flex-1 rounded-lg border-destructive/30 font-semibold text-destructive hover:bg-destructive/5"
                        disabled={declineTeamWager.isPending}
                        onClick={() => { clearError(); declineTeamWager.mutate(w.id, { onError: (e) => setActionError(e.message) }) }}
                      >
                        Decline
                      </Button>
                    </div>
                  )}

                  {w.status === 'pending_acceptance' && (isCreator || (onA && !onB)) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 w-full rounded-lg border-destructive/30 font-semibold text-destructive hover:bg-destructive/5"
                      disabled={declineTeamWager.isPending}
                      onClick={() => { clearError(); declineTeamWager.mutate(w.id, { onError: (e) => setActionError(e.message) }) }}
                    >
                      Cancel challenge
                    </Button>
                  )}

                  {w.status === 'active' && pid && (
                    <Button
                      size="sm"
                      className="h-9 w-full rounded-lg font-semibold"
                      style={{ backgroundColor: GREEN }}
                      onClick={() => { clearError(); setOutcomeTeamWager(w) }}
                    >
                      Record result
                    </Button>
                  )}

                  {w.status === 'pending_confirmation' && myTeamConfirm && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-9 flex-1 rounded-lg font-semibold"
                          style={{ backgroundColor: GREEN }}
                          disabled={confirmTeamOutcome.isPending}
                          onClick={() => { clearError(); confirmTeamOutcome.mutate(w.id, { onError: (e) => setActionError(e.message) }) }}
                        >
                          Confirm result
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 flex-1 rounded-lg border-destructive/30 font-semibold text-destructive hover:bg-destructive/5"
                          disabled={disputeTeamOutcome.isPending}
                          onClick={() => { clearError(); disputeTeamOutcome.mutate(w.id, { onError: (e) => setActionError(e.message) }) }}
                        >
                          Dispute
                        </Button>
                      </div>
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        Each winner receives R {w.amount.toFixed(2)}; each loser is debited the same.
                      </p>
                    </div>
                  )}

                  {w.status === 'disputed' && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Disputed — clear to submit a new result.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 w-full rounded-lg"
                        disabled={reopenTeamWager.isPending}
                        onClick={() => { clearError(); reopenTeamWager.mutate(w.id, { onError: (e) => setActionError(e.message) }) }}
                      >
                        Clear dispute &amp; retry
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
