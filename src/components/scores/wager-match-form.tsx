import { useState } from 'react'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, CheckCircle2, DollarSign } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { usePlayers, useCreateWager, useWalletBalance } from '@/hooks/use-data'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { formatWalletBalance, profileDisplayName } from '@/lib/format'

interface Props {
  onClose: () => void
  onBack: () => void
}

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
          <CheckCircle2 className="h-10 w-10" style={{ color: 'oklch(0.65 0.18 50)' }} />
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
          className="mt-1 h-auto min-h-12 w-full rounded-xl px-3 py-3 text-center text-sm font-bold leading-snug text-primary-foreground shadow-none active:translate-y-0 [box-shadow:none]"
          style={{ backgroundColor: 'oklch(0.65 0.18 50)' }}
        >
          Done
        </Button>
      </div>
    )
  }

  return (
    <>
      <SheetHeader className="mb-0 px-0 pt-3 pb-1">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <SheetTitle className="text-lg font-bold">New Wager</SheetTitle>
        </div>
      </SheetHeader>

      <div className="space-y-4">
        {/* Wallet balance */}
        <div
          className="flex items-center justify-between p-3 rounded-xl"
          style={{ backgroundColor: 'oklch(0.65 0.18 50 / 0.1)', border: '1px solid oklch(0.65 0.18 50 / 0.3)' }}
        >
          <span className="text-sm text-muted-foreground">Your wallet</span>
          <span className="font-bold" style={{ color: 'oklch(0.65 0.18 50)' }}>
            {formatWalletBalance(walletBalance)}
          </span>
        </div>

        {/* Opponent selector */}
        <div>
          <Label className="mb-2 block">Choose opponent</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {opponents.map((opp) => (
              <button
                key={opp.id}
                onClick={() => setOpponentId(opp.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all text-left ${
                  opponentId === opp.id
                    ? 'border-[oklch(0.65_0.18_50)] bg-[oklch(0.65_0.18_50/0.1)]'
                    : 'border-border bg-card'
                }`}
              >
                <PlayerAvatar player={opp} size="sm" />
                <div>
                  <p className="font-semibold text-sm">{profileDisplayName(opp)}</p>
                  <p className="text-xs text-muted-foreground">
                    Wallet: {formatWalletBalance(opp.wallet_balance)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <Label>Wager amount</Label>
          <div className="relative mt-1.5">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              className="pl-9"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
              max={walletBalance}
            />
          </div>
          {amount && !isAmountValid && (
            <p className="text-xs text-destructive mt-1">
              {amountNum <= 0 ? 'Enter a valid amount' : 'Exceeds your wallet balance'}
            </p>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!opponentId || !isAmountValid || createWager.isPending}
          className="w-full"
          style={{ backgroundColor: 'oklch(0.91 0.19 106)', color: 'oklch(0.20 0.07 150)' }}
        >
          {createWager.isPending ? 'Sending...' : 'Send Wager Challenge'}
        </Button>
      </div>
    </>
  )
}
