import { useState } from 'react'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { usePlayers, useCreateWager, useWalletBalance } from '@/hooks/use-data'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { formatWalletBalance, profileDisplayName } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Props {
  onClose: () => void
  onBack: () => void
}

const WAGER_ACCENT = 'oklch(0.65 0.18 50)'

const amountInputClass =
  'h-12 min-h-12 w-full rounded-xl border-2 border-border bg-card pl-9 pr-3 text-base tabular-nums placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 md:text-sm'

export function WagerMatchForm({ onClose, onBack }: Props) {
  const profile = useAuthStore((s) => s.profile)
  const { data: players = [] } = usePlayers()
  const { data: walletBalance = 0 } = useWalletBalance(profile?.id ?? '')
  const createWager = useCreateWager()

  const [opponentId, setOpponentId] = useState('')
  const [amount, setAmount] = useState('')
  const [success, setSuccess] = useState(false)

  const opponents = players.filter((p) => p.id !== profile?.id)
  const selectedOpponent = opponents.find((o) => o.id === opponentId)
  const amountNum = Number(amount)
  const isAmountValid = amountNum > 0 && amountNum <= walletBalance

  const handleSubmit = async () => {
    if (!profile || !opponentId) return
    await createWager.mutateAsync({
      proposer_id: profile.id,
      opponent_id: opponentId,
      amount: amountNum,
    })
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="flex w-full flex-col items-center gap-4 px-1 pb-2 pt-10">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: 'oklch(0.65 0.18 50 / 0.2)' }}
        >
          <CheckCircle2 className="h-10 w-10" style={{ color: WAGER_ACCENT }} />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-bold">Wager sent</h3>
          <p className="text-sm leading-snug text-muted-foreground">
            {selectedOpponent ? profileDisplayName(selectedOpponent) : ''} has been notified. The
            wager will be active once they accept.
          </p>
        </div>
        <Button
          onClick={onClose}
          className="mt-1 h-auto min-h-12 w-full rounded-xl px-3 py-3 text-center text-sm font-bold leading-snug shadow-none active:translate-y-0 [box-shadow:none]"
          style={{ backgroundColor: WAGER_ACCENT, color: 'white' }}
        >
          Done
        </Button>
      </div>
    )
  }

  return (
    <>
      <SheetHeader className="mb-0 px-0 pt-3 pb-2">
        <div className="relative flex h-11 items-center justify-center pr-10">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="absolute left-0 top-1/2 h-8 w-8 -translate-y-1/2"
            aria-label="Back"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <SheetTitle className="text-lg font-bold">New Wager</SheetTitle>
        </div>
      </SheetHeader>

      <div className="space-y-4">
        <div
          className="flex items-center justify-between rounded-xl border-2 px-3 py-3"
          style={{
            borderColor: 'oklch(0.65 0.18 50 / 0.35)',
            backgroundColor: 'oklch(0.65 0.18 50 / 0.08)',
          }}
        >
          <span className="text-sm font-semibold text-foreground">Your wallet</span>
          <span
            className="text-sm font-black tabular-nums tracking-tight"
            style={{ color: WAGER_ACCENT }}
          >
            {formatWalletBalance(walletBalance)}
          </span>
        </div>

        <div>
          <p className="text-sm font-semibold">Choose opponent</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Select a player to challenge — they&apos;ll get a notification to accept.
          </p>
          {opponents.length === 0 ? (
            <div className="mt-3 rounded-xl border border-border bg-muted/30 px-3 py-6 text-center">
              <p className="text-sm font-semibold">No other players yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Players need to be in the league before you can send a wager.
              </p>
            </div>
          ) : (
            <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
              {opponents.map((opp) => {
                const selected = opponentId === opp.id
                return (
                  <button
                    key={opp.id}
                    type="button"
                    onClick={() => setOpponentId(opp.id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 text-left transition-all active:scale-[0.98]',
                      selected
                        ? 'border-2 shadow-sm'
                        : 'border border-border hover:border-primary/30',
                    )}
                    style={
                      selected
                        ? {
                            borderColor: 'oklch(0.65 0.18 50)',
                            backgroundColor: 'oklch(0.65 0.18 50 / 0.08)',
                          }
                        : undefined
                    }
                  >
                    <PlayerAvatar player={opp} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{profileDisplayName(opp)}</p>
                      <p className="text-xs text-muted-foreground">
                        Wallet {formatWalletBalance(opp.wallet_balance)}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card px-3 py-3">
          <Label htmlFor="wager-amount" className="text-sm font-semibold">
            Wager amount
          </Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Enter an amount up to {formatWalletBalance(walletBalance)}.
          </p>
          <div className="relative mt-2">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold tabular-nums text-muted-foreground"
              aria-hidden
            >
              R
            </span>
            <Input
              id="wager-amount"
              type="number"
              inputMode="decimal"
              className={amountInputClass}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={0}
              step="0.01"
              max={walletBalance}
            />
          </div>
          {amount !== '' && !isAmountValid ? (
            <p className="mt-2 text-xs text-destructive">
              {amountNum <= 0 ? 'Enter a valid amount' : 'Exceeds your wallet balance'}
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={
            !opponentId || !isAmountValid || createWager.isPending || opponents.length === 0
          }
          className="h-auto min-h-12 w-full rounded-xl px-3 py-3 text-center text-sm font-bold leading-snug"
          style={{ backgroundColor: WAGER_ACCENT, color: 'white' }}
        >
          {createWager.isPending ? 'Sending…' : 'Send wager challenge'}
        </Button>
      </div>
    </>
  )
}
