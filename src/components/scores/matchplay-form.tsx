import { useState } from 'react'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, CheckCircle2, Minus, Plus } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useUnplayedOpponents, useSubmitMatchplay, useGroupForPlayer } from '@/hooks/use-data'
import { KNOWN_COURSES } from '@/lib/constants'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { profileDisplayName } from '@/lib/format'
import { cn } from '@/lib/utils'

function isValidFinishedMatch(holesUp: number, holesRemaining: number): boolean {
  if (holesUp < 1 || holesRemaining < 0 || holesRemaining > 17) return false
  if (holesRemaining === 0) return true
  return holesUp > holesRemaining
}

function formatMarginForStorage(holesUp: number, holesRemaining: number): string {
  if (holesRemaining === 0) return `${holesUp} Up`
  return `${holesUp}&${holesRemaining}`
}

function matchplaySuccessHeadline(
  result: 'won' | 'lost' | 'drew',
  marginText: string,
  opponentName: string,
): string {
  if (result === 'drew') return `Halved vs ${opponentName}`
  if (result === 'won') return `You won ${marginText} vs ${opponentName}`
  return `${opponentName} won ${marginText}`
}

function resultStepConfirmLabel(
  result: 'won' | 'lost' | 'drew' | '',
  holesUp: number,
  holesRemaining: number,
): string {
  if (!result) return 'Select a result'
  if (result === 'drew') return 'Confirm halved match'
  if (!isValidFinishedMatch(holesUp, holesRemaining)) return 'Adjust margin to continue'
  const margin = formatMarginForStorage(holesUp, holesRemaining)
  if (result === 'won') return `Confirm as ${margin} Win`
  return `Confirm as ${margin} Loss`
}

function ChunkyStepper({
  value,
  onChange,
  min,
  max,
  minusLabel,
  plusLabel,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  minusLabel: string
  plusLabel: string
}) {
  const displayCellStyle = cn(
    'flex items-center justify-center rounded-xl border-2 py-3 transition-all',
    'border-border bg-muted/40',
  )
  const btnStyle = cn(
    'flex items-center justify-center rounded-xl border-2 py-3 transition-all',
    'border-border bg-card text-foreground',
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-35',
    'hover:border-primary/30 hover:bg-primary/5',
  )

  return (
    <div className="grid grid-cols-3 gap-2" aria-label="Adjust value">
      <button
        type="button"
        aria-label={minusLabel}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={btnStyle}
      >
        <Minus className="h-7 w-7 stroke-[2.5]" strokeLinecap="round" aria-hidden />
      </button>
      <div className={displayCellStyle} aria-live="polite">
        <span className="text-2xl font-black tabular-nums text-[oklch(0.22_0.09_160)]">
          {value}
        </span>
      </div>
      <button
        type="button"
        aria-label={plusLabel}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={btnStyle}
      >
        <Plus className="h-7 w-7 stroke-[2.5]" strokeLinecap="round" aria-hidden />
      </button>
    </div>
  )
}

interface Props {
  onClose: () => void
  onBack: () => void
}

type SuccessSnapshot = {
  opponentName: string
  marginText: string
  course: string
  result: 'won' | 'lost' | 'drew'
}

export function MatchplayForm({ onClose, onBack }: Props) {
  const profile = useAuthStore((s) => s.profile)
  const { data: group } = useGroupForPlayer(profile?.id)
  const { data: opponents = [] } = useUnplayedOpponents(profile?.id ?? '', group?.id ?? '')
  const submitMatchplay = useSubmitMatchplay()

  const [step, setStep] = useState<'opponent' | 'result' | 'details' | 'success'>('opponent')
  const [opponentId, setOpponentId] = useState('')
  const [result, setResult] = useState<'won' | 'lost' | 'drew' | ''>('')
  const [holesUp, setHolesUp] = useState(1)
  const [holesRemaining, setHolesRemaining] = useState(0)
  const [course, setCourse] = useState('')
  const [courseInput, setCourseInput] = useState('')
  const [showCourseSuggestions, setShowCourseSuggestions] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [successSnapshot, setSuccessSnapshot] = useState<SuccessSnapshot | null>(null)

  const selectedOpponent = opponents.find((o) => o.id === opponentId)

  const courseSuggestions = KNOWN_COURSES.filter((c) =>
    c.toLowerCase().includes(courseInput.toLowerCase()) && courseInput.length > 1
  ).slice(0, 5)

  const handleSubmit = async () => {
    if (!profile || !group) return
    if (result !== 'won' && result !== 'lost' && result !== 'drew') return

    const finalResult: 'win_a' | 'win_b' | 'draw' =
      result === 'won' ? 'win_a' : result === 'lost' ? 'win_b' : 'draw'

    const marginText =
      finalResult === 'draw'
        ? 'Halved'
        : formatMarginForStorage(holesUp, holesRemaining)

    const opponentName = selectedOpponent
      ? profileDisplayName(selectedOpponent)
      : 'Opponent'
    const courseName = (course || courseInput).trim()

    await submitMatchplay.mutateAsync({
      player_a_id: profile.id,
      player_b_id: opponentId,
      group_id: group.id,
      result: finalResult,
      margin: marginText,
      course_name: course || courseInput,
      played_at: date,
    })

    setSuccessSnapshot({
      opponentName,
      marginText,
      course: courseName,
      result,
    })
    setStep('success')
  }

  if (step === 'success') {
    const snap = successSnapshot
    const headline =
      snap &&
      matchplaySuccessHeadline(snap.result, snap.marginText, snap.opponentName)

    return (
      <div className="flex w-full flex-col items-center gap-4 px-1 pb-2 pt-10">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: 'oklch(0.91 0.19 106 / 0.2)' }}
        >
          <CheckCircle2 className="h-10 w-10" style={{ color: 'oklch(0.80 0.14 72)' }} />
        </div>
        <div className="space-y-3 text-center">
          <h3 className="text-lg font-bold">Result submitted</h3>
          {headline ? (
            <>
              <p className="text-sm font-semibold leading-snug text-foreground">{headline}</p>
              {snap?.course ? (
                <p className="text-sm leading-snug text-muted-foreground">{snap.course}</p>
              ) : null}
            </>
          ) : null}
          <p className="text-xs leading-snug text-muted-foreground">
            Your result has been recorded and the standings have been updated.
          </p>
        </div>
        <Button
          onClick={onClose}
          className="mt-1 h-auto min-h-12 w-full rounded-xl px-3 py-3 text-center text-sm font-bold leading-snug text-primary-foreground shadow-none active:translate-y-0 [box-shadow:none]"
          style={{ backgroundColor: 'oklch(0.22 0.068 157)' }}
        >
          Done
        </Button>
      </div>
    )
  }

  return (
    <>
      <SheetHeader className="mb-0 px-0 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <SheetTitle className="text-lg font-bold">Matchplay Result</SheetTitle>
        </div>
        {/* Progress steps */}
        <div className="flex gap-1 mt-2">
          {(['opponent', 'result', 'details'] as const).map((s, i) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-all"
              style={{
                backgroundColor:
                  ['opponent', 'result', 'details'].indexOf(step) >= i
                    ? 'oklch(0.80 0.14 72)'
                    : 'oklch(0.90 0 0)',
              }}
            />
          ))}
        </div>
      </SheetHeader>

      {step === 'opponent' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Select your opponent from {group?.name}
          </p>
          {opponents.length === 0 ? (
            <div className="text-center py-8">
              <p className="font-semibold">All fixtures played!</p>
              <p className="text-sm text-muted-foreground mt-1">
                You've played everyone in your group.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {opponents.map((opp) => (
                <button
                  key={opp.id}
                  onClick={() => { setOpponentId(opp.id); setStep('result') }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border bg-card active:scale-[0.98] transition-transform text-left hover:border-primary/30"
                >
                  <PlayerAvatar player={opp} size="sm" />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{profileDisplayName(opp)}</p>
                    {opp.full_name && (
                      <p className="text-xs text-muted-foreground">{opp.full_name}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'result' && selectedOpponent && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 rounded-xl border-2 border-border bg-muted/50 px-3 py-3">
            <PlayerAvatar player={selectedOpponent} size="sm" />
            <span className="text-sm font-semibold">vs {profileDisplayName(selectedOpponent)}</span>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">What was the result?</p>
            <div className="grid grid-cols-3 gap-2">
              {(['won', 'drew', 'lost'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    if (r !== 'drew' && result === 'drew') {
                      setHolesUp(1)
                      setHolesRemaining(0)
                    }
                    setResult(r)
                  }}
                  className={cn(
                    'rounded-xl border-2 py-3 text-sm font-bold transition-all',
                    result === r
                      ? r === 'won' ? 'border-green-500 bg-green-500/10 text-green-600'
                        : r === 'lost' ? 'border-red-500 bg-red-500/10 text-red-600'
                        : 'border-yellow-500 bg-yellow-500/10 text-yellow-600'
                      : 'border-border bg-card text-muted-foreground',
                  )}
                >
                  {r === 'won' ? 'WON' : r === 'drew' ? 'DREW' : 'LOST'}
                </button>
              ))}
            </div>
          </div>

          {result && result !== 'drew' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card px-3 py-3">
                <p className="text-sm font-semibold">Holes up</p>
                <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                  How many holes the winner was ahead when the match ended (1–10).
                </p>
                <ChunkyStepper
                  value={holesUp}
                  onChange={setHolesUp}
                  min={1}
                  max={10}
                  minusLabel="Decrease holes up"
                  plusLabel="Increase holes up"
                />
              </div>

              <div className="rounded-xl border border-border bg-card px-3 py-3">
                <p className="text-sm font-semibold">Holes remaining</p>
                <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                  Holes not played after the match was decided — 0 if you played the full 18 (0–17).
                </p>
                <ChunkyStepper
                  value={holesRemaining}
                  onChange={setHolesRemaining}
                  min={0}
                  max={17}
                  minusLabel="Decrease holes remaining"
                  plusLabel="Increase holes remaining"
                />
              </div>

              {!isValidFinishedMatch(holesUp, holesRemaining) && (
                <p className="text-xs text-destructive">
                  That combination isn&apos;t a finished match — holes up must be greater than holes
                  remaining (unless you played all 18, then choose 0 remaining).
                </p>
              )}
            </div>
          )}

          <Button
            onClick={() => setStep('details')}
            disabled={
              !result ||
              (result !== 'drew' && !isValidFinishedMatch(holesUp, holesRemaining))
            }
            className="h-auto min-h-12 w-full rounded-xl px-3 py-3 text-center text-sm font-bold leading-snug whitespace-normal"
            style={{ backgroundColor: 'oklch(0.22 0.068 157)' }}
          >
            {resultStepConfirmLabel(result, holesUp, holesRemaining)}
          </Button>
        </div>
      )}

      {step === 'details' && (
        <div className="space-y-4">
          <div className="relative rounded-xl border border-border bg-card px-3 py-3">
            <Label htmlFor="matchplay-course" className="text-sm font-semibold">
              Course played
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Start typing — we&apos;ll suggest known courses.
            </p>
            <Input
              id="matchplay-course"
              autoComplete="off"
              placeholder="Start typing a course name..."
              value={courseInput}
              onChange={(e) => {
                setCourseInput(e.target.value)
                setCourse(e.target.value)
                setShowCourseSuggestions(true)
              }}
              onFocus={() => setShowCourseSuggestions(true)}
              className="mt-2 h-12 min-h-12 rounded-xl border-2 border-border bg-card px-3 text-base placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 md:text-sm"
            />
            {showCourseSuggestions && courseSuggestions.length > 0 && (
              <div className="absolute left-3 right-3 top-full z-10 mt-1.5 overflow-hidden rounded-xl border-2 border-border bg-card">
                {courseSuggestions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted active:bg-muted/80"
                    onMouseDown={() => {
                      setCourse(c)
                      setCourseInput(c)
                      setShowCourseSuggestions(false)
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card px-3 py-3">
            <Label htmlFor="matchplay-date" className="text-sm font-semibold">
              Date played
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">When you finished the match.</p>
            <Input
              id="matchplay-date"
              type="date"
              value={date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 h-12 min-h-12 rounded-xl border-2 border-border bg-card px-3 text-base focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 md:text-sm"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={(!course && !courseInput) || submitMatchplay.isPending}
            className="h-auto min-h-12 w-full rounded-xl px-3 py-3 text-center text-sm font-bold leading-snug"
            style={{ backgroundColor: 'oklch(0.80 0.14 72)', color: 'oklch(0.18 0.06 60)' }}
          >
            {submitMatchplay.isPending ? 'Submitting...' : 'Submit result'}
          </Button>
        </div>
      )}
    </>
  )
}
