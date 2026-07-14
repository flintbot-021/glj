import { useState, type ReactNode } from 'react'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, CheckCircle2, Swords } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import {
  usePlayers,
  useGroupForPlayer,
  useGroupsWithMembers,
  useGrudgeMatches,
  useCreateGrudgeMatch,
  useCancelGrudgeMatch,
  useSubmitGrudgeMatchResult,
  useConfirmGrudgeMatchResult,
} from '@/hooks/use-data'
import { GRUDGE_MATCH_COPY, GRUDGE_MATCH_LIMITS, GRUDGE_MATCH_POINTS } from '@/lib/league-rules'
import { KNOWN_COURSES } from '@/lib/constants'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { profileDisplayName } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { EnrichedGrudgeMatch, GrudgeMatchResult } from '@/lib/types'

type Step = 'hub' | 'challenge' | 'result' | 'success'

const fieldClass =
  'mt-2 h-12 min-h-12 w-full rounded-xl border-2 border-border bg-card px-3 text-base placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 md:text-sm'

function needsMyConfirm(g: EnrichedGrudgeMatch, myId: string): boolean {
  if (g.status !== 'pending_confirmation') return false
  if (g.challenger_id === myId) return !g.challenger_confirmed
  if (g.challenged_id === myId) return !g.challenged_confirmed
  return false
}

function resultLabel(g: EnrichedGrudgeMatch, myId: string): string {
  if (!g.result) return ''
  if (g.result === 'draw') return 'Halved'
  const iAmChallenger = g.challenger_id === myId
  if (g.result === 'win_challenger') return iAmChallenger ? 'You won' : 'They won'
  return iAmChallenger ? 'They won' : 'You won'
}

interface Props {
  onClose: () => void
  onBack: () => void
}

export function GrudgeEntryFlow({ onClose, onBack }: Props) {
  const profile = useAuthStore((s) => s.profile)
  const { data: players = [] } = usePlayers()
  const { data: myGroup } = useGroupForPlayer(profile?.id ?? '')
  const { data: groupsWithMembers } = useGroupsWithMembers()
  const { data: grudges = [] } = useGrudgeMatches()
  const createGrudge = useCreateGrudgeMatch()
  const cancelGrudge = useCancelGrudgeMatch()
  const submitResult = useSubmitGrudgeMatchResult()
  const confirmResult = useConfirmGrudgeMatchResult()

  const [step, setStep] = useState<Step>('hub')
  const [opponentId, setOpponentId] = useState('')
  const [activeGrudgeId, setActiveGrudgeId] = useState<string | null>(null)
  const [result, setResult] = useState<'won' | 'lost' | 'drew' | ''>('')
  const [margin, setMargin] = useState('')
  const [course, setCourse] = useState('')
  const [courseInput, setCourseInput] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  const playerGroupId = (() => {
    const map = new Map<string, string>()
    for (const g of groupsWithMembers ?? []) {
      for (const p of g.players) {
        map.set(p.id, g.group.id)
      }
    }
    return map
  })()

  const myId = profile?.id ?? ''
  const issuedCount = grudges.filter(
    (g) => g.challenger_id === myId && g.status !== 'cancelled'
  ).length
  const receivedCount = grudges.filter(
    (g) => g.challenged_id === myId && g.status !== 'cancelled'
  ).length
  const canIssue = issuedCount < GRUDGE_MATCH_LIMITS.maxIssued

  const activeForMe = grudges.filter(
    (g) =>
      g.status === 'active' && (g.challenger_id === myId || g.challenged_id === myId)
  )
  const awaitingConfirm = grudges.filter(
    (g) =>
      g.status === 'pending_confirmation' &&
      (g.challenger_id === myId || g.challenged_id === myId)
  )
  const settledForMe = grudges.filter(
    (g) =>
      g.status === 'settled' && (g.challenger_id === myId || g.challenged_id === myId)
  )

  const eligibleOpponents = !myGroup?.id
    ? []
    : players
        .filter((p) => p.id !== myId)
        .filter((p) => {
          const gid = playerGroupId.get(p.id)
          return gid != null && gid !== myGroup.id
        })
        .filter((p) => {
          const received = grudges.filter(
            (g) => g.challenged_id === p.id && g.status !== 'cancelled'
          ).length
          return received < GRUDGE_MATCH_LIMITS.maxReceived
        })
        .filter((p) => {
          return !grudges.some(
            (g) =>
              (g.status === 'active' || g.status === 'pending_confirmation') &&
              ((g.challenger_id === myId && g.challenged_id === p.id) ||
                (g.challenger_id === p.id && g.challenged_id === myId))
          )
        })
        .sort((a, b) =>
          profileDisplayName(a).localeCompare(profileDisplayName(b), undefined, {
            sensitivity: 'base',
          })
        )

  const activeGrudge = grudges.find((g) => g.id === activeGrudgeId)

  const courseSuggestions = KNOWN_COURSES.filter(
    (c) => c.toLowerCase().includes(courseInput.toLowerCase()) && courseInput.length > 1
  ).slice(0, 5)

  const handleChallenge = async () => {
    if (!opponentId) return
    setError(null)
    try {
      await createGrudge.mutateAsync(opponentId)
      setSuccessMsg("Challenge open — record the result when you've played")
      setStep('success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send challenge')
    }
  }

  const handleSubmitResult = async () => {
    if (!activeGrudge || !result || !profile) return
    setError(null)
    const iAmChallenger = activeGrudge.challenger_id === profile.id
    let mapped: GrudgeMatchResult
    if (result === 'drew') mapped = 'draw'
    else if (result === 'won') mapped = iAmChallenger ? 'win_challenger' : 'win_challenged'
    else mapped = iAmChallenger ? 'win_challenged' : 'win_challenger'

    try {
      await submitResult.mutateAsync({
        grudgeId: activeGrudge.id,
        result: mapped,
        margin,
        course: (course || courseInput).trim(),
        playedAt: date,
      })
      setSuccessMsg('Result submitted — waiting for the other player to confirm')
      setStep('success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit result')
    }
  }

  const handleConfirm = async (grudgeId: string) => {
    setError(null)
    try {
      await confirmResult.mutateAsync(grudgeId)
      setSuccessMsg('Result confirmed — points added to the group table')
      setStep('success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not confirm result')
    }
  }

  if (step === 'success') {
    return (
      <div className="flex w-full flex-col items-center gap-4 px-1 pb-2 pt-10">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: 'oklch(0.35 0.10 160 / 0.2)' }}
        >
          <CheckCircle2 className="h-10 w-10" style={{ color: 'oklch(0.35 0.10 160)' }} />
        </div>
        <h3 className="text-lg font-bold text-center">{successMsg}</h3>
        <Button
          onClick={onClose}
          className="mt-1 h-auto min-h-12 w-full rounded-xl px-3 py-3 text-sm font-bold"
          style={{ backgroundColor: 'oklch(0.22 0.068 157)' }}
        >
          Done
        </Button>
      </div>
    )
  }

  if (step === 'challenge') {
    return (
      <>
        <SheetHeader className="mb-0 px-0 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setStep('hub')} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <SheetTitle className="text-lg font-bold">Issue challenge</SheetTitle>
          </div>
        </SheetHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">{GRUDGE_MATCH_COPY}</p>
          {!canIssue ? (
            <p className="text-sm text-amber-700 dark:text-amber-500">
              You have already used your one challenge this season.
            </p>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-card px-3 py-3">
                <Label className="text-sm font-semibold">Opponent (outside your group)</Label>
                <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
                  {eligibleOpponents.length === 0 && (
                    <p className="text-sm text-muted-foreground">No eligible opponents right now.</p>
                  )}
                  {eligibleOpponents.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setOpponentId(p.id)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left',
                        opponentId === p.id
                          ? 'border-[oklch(0.22_0.068_157)] bg-[oklch(0.22_0.068_157/0.1)]'
                          : 'border-border bg-card'
                      )}
                    >
                      <PlayerAvatar player={p} size="sm" />
                      <span className="text-sm font-semibold">{profileDisplayName(p)}</span>
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                disabled={!opponentId || createGrudge.isPending}
                onClick={() => void handleChallenge()}
                className="h-12 w-full rounded-xl font-bold"
                style={{ backgroundColor: 'oklch(0.55 0.14 25)', color: 'white' }}
              >
                {createGrudge.isPending ? 'Opening…' : 'Open challenge'}
              </Button>
            </>
          )}
        </div>
      </>
    )
  }

  if (step === 'result' && activeGrudge) {
    const opponent =
      activeGrudge.challenger_id === myId ? activeGrudge.challenged : activeGrudge.challenger
    return (
      <>
        <SheetHeader className="mb-0 px-0 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setStep('hub')} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <SheetTitle className="text-lg font-bold">Record result</SheetTitle>
          </div>
        </SheetHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            vs <span className="font-semibold text-foreground">{profileDisplayName(opponent)}</span>
            {activeGrudge.challenger_id === myId ? ' (you challenged)' : ' (they challenged you)'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(['won', 'lost', 'drew'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setResult(r)}
                className={cn(
                  'rounded-xl border-2 py-3 text-sm font-bold capitalize',
                  result === r
                    ? 'border-[oklch(0.22_0.068_157)] bg-[oklch(0.22_0.068_157/0.12)]'
                    : 'border-border'
                )}
              >
                {r === 'drew' ? 'Halved' : r}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-3">
            <Label className="text-sm font-semibold">Margin (optional)</Label>
            <Input
              className={fieldClass}
              placeholder="e.g. 2&1"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
            />
          </div>
          <div className="relative rounded-xl border border-border bg-card px-3 py-3">
            <Label className="text-sm font-semibold">Course</Label>
            <Input
              className={fieldClass}
              value={courseInput}
              onChange={(e) => {
                setCourseInput(e.target.value)
                setCourse(e.target.value)
              }}
              placeholder="Course name"
            />
            {courseSuggestions.length > 0 && (
              <div className="absolute left-3 right-3 top-full z-10 mt-1 overflow-hidden rounded-xl border bg-card">
                {courseSuggestions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onMouseDown={() => {
                      setCourse(c)
                      setCourseInput(c)
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-3">
            <Label className="text-sm font-semibold">Date played</Label>
            <Input
              type="date"
              className={fieldClass}
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            disabled={!result || submitResult.isPending}
            onClick={() => void handleSubmitResult()}
            className="h-12 w-full rounded-xl font-bold"
            style={{ backgroundColor: 'oklch(0.55 0.14 25)', color: 'white' }}
          >
            {submitResult.isPending ? 'Saving…' : 'Submit result'}
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <SheetHeader className="mb-0 px-0 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <SheetTitle className="text-lg font-bold">Grudge Match</SheetTitle>
        </div>
      </SheetHeader>

      <div className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">{GRUDGE_MATCH_COPY}</p>
        <div className="flex gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="rounded-lg bg-muted px-2 py-1">
            Issued {issuedCount}/{GRUDGE_MATCH_LIMITS.maxIssued}
          </span>
          <span className="rounded-lg bg-muted px-2 py-1">
            Received {receivedCount}/{GRUDGE_MATCH_LIMITS.maxReceived}
          </span>
        </div>

        {canIssue && (
          <Button
            className="h-12 w-full rounded-xl font-bold"
            style={{ backgroundColor: 'oklch(0.55 0.14 25)', color: 'white' }}
            onClick={() => {
              setError(null)
              setOpponentId('')
              setStep('challenge')
            }}
          >
            <Swords className="mr-2 h-4 w-4" />
            Challenge someone
          </Button>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <GrudgeList
          title="Open — record result"
          empty="No open grudge matches"
          items={activeForMe}
          renderActions={(g) => (
            <div className="flex shrink-0 gap-2">
              {g.challenger_id === myId && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={cancelGrudge.isPending}
                  onClick={() => void cancelGrudge.mutateAsync(g.id)}
                >
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                style={{ backgroundColor: 'oklch(0.55 0.14 25)', color: 'white' }}
                onClick={() => {
                  setActiveGrudgeId(g.id)
                  setResult('')
                  setMargin('')
                  setCourse('')
                  setCourseInput('')
                  setError(null)
                  setStep('result')
                }}
              >
                Record
              </Button>
            </div>
          )}
        />

        <GrudgeList
          title="Awaiting confirmation"
          empty="Nothing to confirm"
          items={awaitingConfirm}
          renderActions={(g) => {
            const mine = needsMyConfirm(g, myId)
            if (mine) {
              return (
                <Button
                  size="sm"
                  style={{ backgroundColor: 'oklch(0.22 0.068 157)', color: 'white' }}
                  disabled={confirmResult.isPending}
                  onClick={() => void handleConfirm(g.id)}
                >
                  Confirm
                </Button>
              )
            }
            return (
              <span className="text-[11px] text-muted-foreground">
                Waiting · {resultLabel(g, myId)}
              </span>
            )
          }}
        />

        {settledForMe.length > 0 && (
          <GrudgeList
            title="Settled"
            empty=""
            items={settledForMe.slice(0, 5)}
            renderActions={(g) => (
              <span className="text-xs font-bold tabular-nums" style={{ color: 'oklch(0.80 0.14 72)' }}>
                {g.challenger_id === myId
                  ? `+${g.points_challenger ?? 0}`
                  : `+${g.points_challenged ?? 0}`}
              </span>
            )}
          />
        )}

        <p className="text-[11px] text-muted-foreground">
          Scoring: challenger win +{GRUDGE_MATCH_POINTS.challengerWin} · challenged win +
          {GRUDGE_MATCH_POINTS.challengedWin} · halve +{GRUDGE_MATCH_POINTS.draw} each
        </p>
      </div>
    </>
  )
}

function GrudgeList({
  title,
  empty,
  items,
  renderActions,
}: {
  title: string
  empty: string
  items: EnrichedGrudgeMatch[]
  renderActions: (g: EnrichedGrudgeMatch) => ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        empty ? <p className="text-sm text-muted-foreground">{empty}</p> : null
      ) : (
        items.map((g) => (
          <div
            key={g.id}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5"
          >
            <div className="flex -space-x-2">
              <PlayerAvatar player={g.challenger} size="sm" className="ring-2 ring-card" />
              <PlayerAvatar player={g.challenged} size="sm" className="ring-2 ring-card" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {profileDisplayName(g.challenger)} vs {profileDisplayName(g.challenged)}
              </p>
              <p className="text-[11px] text-muted-foreground capitalize">
                {g.status.replace(/_/g, ' ')}
                {g.result ? ` · ${g.result.replace(/_/g, ' ')}` : ''}
              </p>
            </div>
            {renderActions(g)}
          </div>
        ))
      )}
    </div>
  )
}
