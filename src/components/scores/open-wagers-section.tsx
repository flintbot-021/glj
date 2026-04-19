import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { User, Users } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useWagers, useTeamWagers } from '@/hooks/use-data'
import { WagerRecordOutcomeDialog } from '@/components/wagers/wager-record-outcome-dialog'
import { TeamWagerRecordDialog } from '@/components/wagers/team-wager-record-dialog'
import { needsOutcomeConfirmation, needsTeamOutcomeConfirmation } from '@/lib/wager-helpers'
import { formatWalletBalance, profileDisplayName } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { WAGER_STATUS_LABELS } from '@/lib/constants'
import type { WagerStatus } from '@/lib/types'

const OPEN_STATUSES: WagerStatus[] = [
  'active',
  'pending_confirmation',
  'pending_acceptance',
]

interface Props {
  /** e.g. close the score sheet before navigating to /wagers */
  onNavigateAway?: () => void
  /** Receive the open-wagers block to place it in layout (e.g. after intro or after score cards). */
  children: (openWagersList: ReactNode) => ReactNode
}

export function OpenWagersSection({ onNavigateAway, children }: Props) {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const [soloOutcomeId, setSoloOutcomeId] = useState<string | null>(null)
  const [teamOutcomeId, setTeamOutcomeId] = useState<string | null>(null)

  const { data: solo = [] } = useWagers(profile?.id)
  const { data: team = [] } = useTeamWagers(profile?.id)

  const openSolo = useMemo(() => {
    if (!profile?.id) return []
    return solo.filter((w) => OPEN_STATUSES.includes(w.status))
  }, [solo, profile?.id])

  const openTeam = useMemo(() => {
    if (!profile?.id) return []
    return team.filter((w) => OPEN_STATUSES.includes(w.status))
  }, [team, profile?.id])

  const soloOutcomeWager = soloOutcomeId ? (solo.find((w) => w.id === soloOutcomeId) ?? null) : null
  const teamOutcomeWager = teamOutcomeId ? (team.find((w) => w.id === teamOutcomeId) ?? null) : null

  const goWagers = () => {
    onNavigateAway?.()
    navigate('/wagers')
  }

  const hasRows = openSolo.length > 0 || openTeam.length > 0

  const openWagersList = hasRows ? (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Your open wagers
      </p>
      <div className="max-h-56 space-y-2 overflow-y-auto pr-0.5">
        {openSolo.map((w) => {
          const counterpart = w.proposer_id === profile?.id ? w.opponent : w.proposer
          const openRecord = w.status === 'active'
          const subtitleNeedConfirm =
            profile?.id && needsOutcomeConfirmation(w, profile.id) ? ' · Confirm on Wagers' : ''
          const subtitlePending = w.status === 'pending_acceptance' ? ' · Accept on Wagers' : ''
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => {
                if (openRecord) setSoloOutcomeId(w.id)
                else goWagers()
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
            >
              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">vs {profileDisplayName(counterpart)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatWalletBalance(w.amount)} · {WAGER_STATUS_LABELS[w.status]}
                  {subtitleNeedConfirm}
                  {subtitlePending}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                1v1
              </Badge>
            </button>
          )
        })}
        {openTeam.map((w) => {
          const openRecord = w.status === 'active'
          const subtitleNeedConfirm =
            profile?.id && needsTeamOutcomeConfirmation(w, profile.id) ? ' · Confirm on Wagers' : ''
          const subtitlePending = w.status === 'pending_acceptance' ? ' · Accept on Wagers' : ''
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => {
                if (openRecord) setTeamOutcomeId(w.id)
                else goWagers()
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
            >
              <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">
                  2v2 · R {w.amount.toFixed(2)} / loser
                </p>
                <p className="text-xs text-muted-foreground">
                  {WAGER_STATUS_LABELS[w.status]}
                  {subtitleNeedConfirm}
                  {subtitlePending}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                Team
              </Badge>
            </button>
          )
        })}
      </div>
    </div>
  ) : null

  return (
    <>
      <WagerRecordOutcomeDialog
        wager={soloOutcomeWager}
        profileId={profile?.id ?? ''}
        open={soloOutcomeWager != null}
        onOpenChange={(o) => {
          if (!o) setSoloOutcomeId(null)
        }}
      />
      <TeamWagerRecordDialog
        wager={teamOutcomeWager}
        profileId={profile?.id ?? ''}
        open={teamOutcomeWager != null}
        onOpenChange={(o) => {
          if (!o) setTeamOutcomeId(null)
        }}
      />
      {children(openWagersList)}
    </>
  )
}
