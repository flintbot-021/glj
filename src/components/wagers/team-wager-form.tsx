import { useState } from 'react'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, CheckCircle2, UserPlus, X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { usePlayers, useCreateTeamWager } from '@/hooks/use-data'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { formatWalletBalance, profileDisplayName } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Profile } from '@/lib/types'

interface Props {
  onClose: () => void
  onBack: () => void
}

const ACCENT = 'oklch(0.65 0.18 50)'

type Slot = 'partner' | 'opp1' | 'opp2'

const SLOT_NEXT: Record<Slot, Slot | null> = {
  partner: 'opp1',
  opp1: 'opp2',
  opp2: null,
}

function SlotButton({
  player,
  isMe,
  isActive,
  isEmpty,
  emptyLabel,
  onClick,
  onClear,
}: {
  player?: Profile
  isMe?: boolean
  isActive?: boolean
  isEmpty?: boolean
  emptyLabel: string
  onClick: () => void
  onClear?: () => void
}) {
  return (
    <button
      type="button"
      onClick={isMe ? undefined : onClick}
      disabled={isMe}
      className={cn(
        'relative flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors',
        isMe && 'cursor-default opacity-100',
        isEmpty && !isActive && 'border-dashed border-muted-foreground/30 bg-muted/20 hover:border-muted-foreground/50',
        isEmpty && isActive && 'border-dashed border-2',
        !isEmpty && !isActive && 'border-border bg-card hover:border-border',
        !isEmpty && isActive && 'border-2 bg-card',
      )}
      style={isActive ? { borderColor: ACCENT } : undefined}
    >
      {isEmpty ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-dashed',
              isActive ? 'border-current' : 'border-muted-foreground/40',
            )}
            style={isActive ? { borderColor: ACCENT, color: ACCENT } : undefined}
          >
            <UserPlus className="h-3 w-3" />
          </div>
          <span
            className="text-xs font-medium"
            style={isActive ? { color: ACCENT } : undefined}
          >
            {emptyLabel}
          </span>
        </div>
      ) : (
        <>
          <PlayerAvatar player={player!} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold leading-tight">
              {isMe ? 'You' : profileDisplayName(player!)}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {isMe ? 'Team lead' : formatWalletBalance(player!.wallet_balance)}
            </p>
          </div>
          {!isMe && onClear && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClear()
              }}
              className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </>
      )}
    </button>
  )
}

export function TeamWagerForm({ onClose, onBack }: Props) {
  const profile = useAuthStore((s) => s.profile)
  const { data: players = [] } = usePlayers()
  const createTeam = useCreateTeamWager()

  const [slots, setSlots] = useState<Record<Slot, string>>({
    partner: '',
    opp1: '',
    opp2: '',
  })
  const [activeSlot, setActiveSlot] = useState<Slot>('partner')
  const [amount, setAmount] = useState('')
  const [success, setSuccess] = useState(false)

  const amountNum = Number(amount)
  const getPlayer = (id: string) => players.find((p) => p.id === id)

  const eligibleFor = (slot: Slot): Profile[] => {
    const taken = new Set(
      (Object.entries(slots) as [Slot, string][])
        .filter(([k]) => k !== slot)
        .map(([, v]) => v)
        .filter(Boolean),
    )
    taken.add(profile?.id ?? '')
    return players.filter((p) => !taken.has(p.id))
  }

  const pick = (id: string) => {
    const next = SLOT_NEXT[activeSlot]
    setSlots((prev) => ({ ...prev, [activeSlot]: id }))
    if (next && !slots[next]) setActiveSlot(next)
  }

  const clear = (slot: Slot) => {
    setSlots((prev) => ({ ...prev, [slot]: '' }))
    setActiveSlot(slot)
  }

  const allPicked = !!(profile && slots.partner && slots.opp1 && slots.opp2)
  const canSubmit = allPicked && amountNum > 0 && !createTeam.isPending

  const handleSubmit = async () => {
    if (!profile || !allPicked) return
    await createTeam.mutateAsync({
      created_by: profile.id,
      team_a_p1: profile.id,
      team_a_p2: slots.partner,
      team_b_p1: slots.opp1,
      team_b_p2: slots.opp2,
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
          <CheckCircle2 className="h-10 w-10" style={{ color: ACCENT }} />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-bold">Team challenge sent</h3>
          <p className="text-sm leading-snug text-muted-foreground">
            The other team gets a notification. Any one of them can accept in Wagers.
          </p>
        </div>
        <Button
          onClick={onClose}
          className="mt-1 h-auto min-h-12 w-full rounded-xl px-3 py-3 text-center text-sm font-bold leading-snug shadow-none [box-shadow:none]"
          style={{ backgroundColor: ACCENT, color: 'white' }}
        >
          Done
        </Button>
      </div>
    )
  }

  const eligible = eligibleFor(activeSlot)
  const activeSlotLabel =
    activeSlot === 'partner'
      ? 'Picking your partner'
      : activeSlot === 'opp1'
        ? 'Picking Team B · player 1'
        : 'Picking Team B · player 2'

  return (
    <>
      <SheetHeader className="mb-0 px-0 pb-2 pt-3">
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
          <SheetTitle className="text-lg font-bold">New 2v2 wager</SheetTitle>
        </div>
      </SheetHeader>

      <div className="space-y-4">
        {/* Team matchup builder */}
        <div className="grid grid-cols-[1fr_28px_1fr] items-center gap-1.5">
          {/* Team A */}
          <div className="space-y-1.5">
            <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Team A
            </p>
            <SlotButton
              player={profile ?? undefined}
              isMe
              isEmpty={false}
              emptyLabel="You"
              onClick={() => {}}
            />
            <SlotButton
              player={getPlayer(slots.partner)}
              isActive={activeSlot === 'partner'}
              isEmpty={!slots.partner}
              emptyLabel="Partner"
              onClick={() => setActiveSlot('partner')}
              onClear={slots.partner ? () => clear('partner') : undefined}
            />
          </div>

          {/* VS divider */}
          <div className="flex flex-col items-center gap-1 pt-5">
            <div className="h-px w-full bg-border" />
            <span className="text-[10px] font-bold text-muted-foreground">vs</span>
            <div className="h-px w-full bg-border" />
          </div>

          {/* Team B */}
          <div className="space-y-1.5">
            <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Team B
            </p>
            <SlotButton
              player={getPlayer(slots.opp1)}
              isActive={activeSlot === 'opp1'}
              isEmpty={!slots.opp1}
              emptyLabel="Player 1"
              onClick={() => setActiveSlot('opp1')}
              onClear={slots.opp1 ? () => clear('opp1') : undefined}
            />
            <SlotButton
              player={getPlayer(slots.opp2)}
              isActive={activeSlot === 'opp2'}
              isEmpty={!slots.opp2}
              emptyLabel="Player 2"
              onClick={() => setActiveSlot('opp2')}
              onClear={slots.opp2 ? () => clear('opp2') : undefined}
            />
          </div>
        </div>

        {/* Player picker */}
        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">{activeSlotLabel}</p>
          <div className="space-y-1.5">
            {eligible.length === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">No players available</p>
            ) : (
              eligible.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pick(p.id)}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/30 active:scale-[0.98]"
                >
                  <PlayerAvatar player={p} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{profileDisplayName(p)}</p>
                    <p className="text-xs text-muted-foreground">
                      Wallet {formatWalletBalance(p.wallet_balance)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Stake input */}
        <div className="rounded-xl border border-border bg-card px-3 py-3">
          <p className="text-sm font-semibold">Stake per losing player</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Each loser pays this amount · each winner receives the same
          </p>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              R
            </span>
            <Input
              id="team-wager-amt"
              type="number"
              inputMode="decimal"
              className="h-12 min-h-12 w-full rounded-xl border-2 border-border bg-card pl-9 pr-3 text-base tabular-nums placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 md:text-sm"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={0}
              step="0.01"
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="h-auto min-h-12 w-full rounded-xl px-3 py-3 text-center text-sm font-bold leading-snug"
          style={{ backgroundColor: ACCENT, color: 'white' }}
        >
          {createTeam.isPending ? 'Sending…' : 'Send team challenge'}
        </Button>
      </div>
    </>
  )
}
