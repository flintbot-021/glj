import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, Shield } from 'lucide-react'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import {
  useAdminWalletLedger,
  useApplyAdminWalletCredit,
  usePlayers,
} from '@/hooks/use-data'
import { formatCurrency, formatDate, formatWalletBalance, profileDisplayName } from '@/lib/format'

const NONE = '__none__'

export function AdminPlayersPage() {
  const navigate = useNavigate()
  const { data: players = [], isLoading } = usePlayers()
  const { data: ledger = [], isLoading: ledgerLoading } = useAdminWalletLedger()
  const credit = useApplyAdminWalletCredit()

  const [playerId, setPlayerId] = useState(NONE)
  const [amountStr, setAmountStr] = useState('')
  const [note, setNote] = useState('')
  const [formHint, setFormHint] = useState<string | null>(null)

  const sorted = [...players].sort((a, b) => profileDisplayName(a).localeCompare(profileDisplayName(b)))

  const onAddCredit = () => {
    setFormHint(null)
    if (playerId === NONE) {
      setFormHint('Choose a player.')
      return
    }
    const n = parseFloat(amountStr.replace(',', '.'))
    if (!Number.isFinite(n) || n <= 0) {
      setFormHint('Enter a valid amount greater than zero.')
      return
    }
    credit.mutate(
      { playerId, amount: n, note: note.trim() || undefined },
      {
        onSuccess: () => {
          setAmountStr('')
          setNote('')
          setFormHint(null)
        },
        onError: (e) => {
          setFormHint(e instanceof Error ? e.message : 'Something went wrong.')
        },
      }
    )
  }

  return (
    <div className="py-4">
      <div className="px-4 mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/rtd')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-black">Players</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? '…' : `${players.length} registered players`}
          </p>
        </div>
      </div>

      <div className="px-4 space-y-6 max-w-lg mx-auto">
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold">Add wallet credit</p>
          <p className="text-xs text-muted-foreground">
            Records an admin deposit and increases the player&apos;s balance. History below shows admin credits and
            debits only (not wagers).
          </p>
          <div className="space-y-2">
            <Label>Player</Label>
            <Select value={playerId} onValueChange={(v) => setPlayerId(v ?? NONE)}>
              <SelectTrigger>
                <SelectValue placeholder="Select player" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value={NONE}>Choose…</SelectItem>
                {sorted.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {profileDisplayName(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Amount (ZAR)</Label>
            <Input
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Bank transfer — Mar" />
          </div>
          <Button
            type="button"
            className="w-full"
            disabled={playerId === NONE || credit.isPending}
            onClick={onAddCredit}
            style={{ backgroundColor: 'oklch(0.65 0.18 50)' }}
          >
            {credit.isPending ? 'Applying…' : 'Apply credit'}
          </Button>
          {formHint && (
            <p className="text-sm text-destructive whitespace-pre-wrap" role="alert">
              {formHint}
            </p>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Admin deposit history</p>
          {ledgerLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : ledger.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admin credits or debits recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {ledger.map((row) => {
                const who = players.find((p) => p.id === row.player_id)
                const label = who ? profileDisplayName(who) : row.player_id
                const signed =
                  row.type === 'admin_credit' ? row.amount : -row.amount
                return (
                  <li
                    key={row.id}
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm flex flex-wrap justify-between gap-2"
                  >
                    <div>
                      <span className="font-medium">{label}</span>
                      <span className="text-muted-foreground text-xs block">
                        {formatDate(row.created_at, 'MMM d, yyyy HH:mm')}
                        {row.note ? ` · ${row.note}` : ''}
                      </span>
                    </div>
                    <span className="font-semibold tabular-nums">{formatCurrency(signed)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="px-4 mt-8 space-y-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">All players</p>
        {players.map((player) => (
          <div key={player.id} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
            <PlayerAvatar player={player} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{profileDisplayName(player)}</p>
                {player.is_admin && <Shield className="h-3.5 w-3.5 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground">{player.email}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold" style={{ color: 'oklch(0.65 0.18 50)' }}>
                {formatWalletBalance(player.wallet_balance)}
              </p>
              <p className="text-xs text-muted-foreground">wallet</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
