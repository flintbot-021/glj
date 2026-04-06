import { useState } from 'react'
import { useWagers, useAcceptWager, useDeclineWager } from '@/hooks/use-data'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime, formatDate } from '@/lib/format'
import { WAGER_STATUS_LABELS } from '@/lib/constants'
import type { WagerStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

type FilterTab = 'all' | WagerStatus

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending_acceptance', label: 'Pending' },
  { id: 'active', label: 'Active' },
  { id: 'pending_confirmation', label: 'Confirm' },
  { id: 'settled', label: 'Settled' },
  { id: 'disputed', label: 'Disputed' },
]

const STATUS_STYLES: Record<WagerStatus, { badge: string; dot: string }> = {
  pending_acceptance: { badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-400' },
  active: { badge: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-400' },
  pending_confirmation: { badge: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-400' },
  settled: { badge: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-400' },
  disputed: { badge: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-400' },
}

export function WagersPage() {
  const currentPlayer = useAuthStore((s) => s.currentPlayer)
  const openScoreSheet = useUIStore((s) => s.openScoreSheet)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const acceptWager = useAcceptWager()
  const declineWager = useDeclineWager()

  const statusFilter = activeTab === 'all' ? undefined : [activeTab]
  const { data: wagers = [], isLoading } = useWagers(currentPlayer?.id, statusFilter as WagerStatus[] | undefined)

  return (
    <div className="py-4">
      <div className="px-4 mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">Wagers</h1>
        <Button
          size="sm"
          className="gap-1.5"
          style={{ backgroundColor: 'oklch(0.91 0.19 106)', color: 'oklch(0.20 0.07 150)' }}
          onClick={openScoreSheet}
        >
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 mb-4 pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
              activeTab === tab.id
                ? 'text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
            style={activeTab === tab.id ? { backgroundColor: 'oklch(0.29 0.072 160)' } : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Wager list */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : wagers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">💰</p>
            <p className="font-semibold text-foreground">No wagers yet</p>
            <p className="text-sm text-muted-foreground mt-1">Challenge a friend to get started</p>
            <Button
              className="mt-4"
              style={{ backgroundColor: 'oklch(0.91 0.19 106)', color: 'oklch(0.20 0.07 150)' }}
              onClick={openScoreSheet}
            >
              New Wager
            </Button>
          </div>
        ) : (
          wagers.map((wager) => {
            const isProposer = wager.proposer_id === currentPlayer?.id
            const counterpart = isProposer ? wager.opponent : wager.proposer
            const styles = STATUS_STYLES[wager.status]

            return (
              <div key={wager.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <PlayerAvatar player={counterpart} size="sm" />
                    <div>
                      <p className="text-sm font-semibold">{counterpart.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {isProposer ? 'You challenged' : 'Challenged you'}
                        {' · '}
                        {formatRelativeTime(wager.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black" style={{ color: 'oklch(0.65 0.18 50)' }}>
                      €{wager.amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Status badge + result info */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn('text-[11px] font-semibold', styles.badge)}
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', styles.dot)} />
                    {WAGER_STATUS_LABELS[wager.status]}
                  </Badge>
                  {wager.result_winner && (
                    <span className="text-xs text-muted-foreground">
                      Won by {wager.result_winner.display_name} · {wager.result_margin}
                      {wager.result_played_at && ` · ${formatDate(wager.result_played_at)}`}
                    </span>
                  )}
                </div>

                {/* Actions */}
                {wager.status === 'pending_acceptance' && !isProposer && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1"
                      style={{ backgroundColor: 'oklch(0.29 0.072 160)' }}
                      onClick={() => acceptWager.mutate(wager.id)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-destructive border-destructive/30"
                      onClick={() => declineWager.mutate(wager.id)}
                    >
                      Decline
                    </Button>
                  </div>
                )}

                {wager.status === 'pending_confirmation' && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1"
                      style={{ backgroundColor: 'oklch(0.29 0.072 160)' }}
                    >
                      Confirm Result
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-destructive border-destructive/30">
                      Dispute
                    </Button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
