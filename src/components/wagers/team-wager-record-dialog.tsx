import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2 } from 'lucide-react'
import type { EnrichedTeamWager, TeamWagerWinner } from '@/lib/types'
import { profileDisplayName } from '@/lib/format'
import { useSubmitTeamWagerOutcome } from '@/hooks/use-data'
import { KNOWN_COURSES } from '@/lib/constants'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { cn } from '@/lib/utils'

type Choice = 'a' | 'b' | 'halved'

const GREEN = 'oklch(0.22 0.068 157)'

interface Props {
  wager: EnrichedTeamWager | null
  profileId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TeamWagerRecordDialog({ wager, profileId: _profileId, open, onOpenChange }: Props) {
  const submit = useSubmitTeamWagerOutcome()

  const [done, setDone] = useState(false)
  const [choice, setChoice] = useState<Choice | null>(null)
  const [margin, setMargin] = useState('')
  const [courseInput, setCourseInput] = useState('')
  const [course, setCourse] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [playedAt, setPlayedAt] = useState(() => new Date().toISOString().split('T')[0]!)
  const [localError, setLocalError] = useState<string | null>(null)

  const reset = () => {
    setDone(false)
    setChoice(null)
    setMargin('')
    setCourseInput('')
    setCourse('')
    setShowSuggestions(false)
    setPlayedAt(new Date().toISOString().split('T')[0]!)
    setLocalError(null)
    submit.reset()
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    if (!wager || !choice) return
    setLocalError(null)

    const courseName = (course || courseInput).trim()
    if (!courseName) { setLocalError('Enter where you played.'); return }
    if (!playedAt) { setLocalError('Choose the date played.'); return }

    let resultWinnerTeam: TeamWagerWinner | null = null
    let resultMargin = margin.trim()

    if (choice === 'halved') {
      resultMargin = resultMargin || 'Halved'
    } else {
      resultWinnerTeam = choice
      if (!resultMargin) resultMargin = choice === 'a' ? `${labelA} win` : `${labelB} win`
    }

    try {
      await submit.mutateAsync({
        teamWagerId: wager.id,
        resultWinnerTeam,
        resultMargin,
        resultCourse: courseName,
        resultPlayedAt: playedAt,
      })
      setDone(true)
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Something went wrong')
    }
  }

  const labelA = wager
    ? `${profileDisplayName(wager.team_a_p1_profile)} & ${profileDisplayName(wager.team_a_p2_profile)}`
    : 'Team A'
  const labelB = wager
    ? `${profileDisplayName(wager.team_b_p1_profile)} & ${profileDisplayName(wager.team_b_p2_profile)}`
    : 'Team B'

  const courseSuggestions = KNOWN_COURSES.filter(
    (c) => c.toLowerCase().includes(courseInput.toLowerCase()) && courseInput.length > 1,
  ).slice(0, 5)

  const resultLabel = (() => {
    if (!choice) return null
    if (choice === 'halved') return 'Halved'
    return choice === 'a' ? `${labelA} win` : `${labelB} win`
  })()

  return (
    <Sheet
      open={open && !!wager}
      onOpenChange={(v) => { if (!v) handleClose() }}
    >
      <SheetContent
        side="bottom"
        className="flex max-h-[92dvh] flex-col gap-0 overflow-y-auto rounded-t-2xl px-5 pb-8 pt-2 shadow-none"
      >
        {done ? (
          <div className="flex w-full flex-col items-center gap-4 px-1 pb-2 pt-10">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: 'oklch(0.65 0.18 50 / 0.15)' }}
            >
              <CheckCircle2 className="h-10 w-10" style={{ color: 'oklch(0.65 0.18 50)' }} />
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-bold">Result submitted</h3>
              <p className="text-sm font-semibold">{resultLabel}</p>
              {(course || courseInput) && (
                <p className="text-sm text-muted-foreground">{course || courseInput}</p>
              )}
              <p className="text-xs leading-snug text-muted-foreground">
                The other team will be notified. One player on their side must confirm before wallets move.
              </p>
            </div>
            <Button
              onClick={handleClose}
              className="mt-2 h-12 w-full rounded-xl font-bold"
              style={{ backgroundColor: GREEN, color: 'white' }}
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <SheetHeader className="space-y-0 px-0 pb-4 pt-3 text-left">
              <SheetTitle className="pr-10 text-lg font-bold">Record 2v2 result</SheetTitle>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-5">
              {/* Stake context */}
              <div className="rounded-xl bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
                Stake R {wager?.amount.toFixed(2)} per loser · each winner receives the same
              </div>

              {/* Winner picker */}
              <div className="space-y-2">
                <p className="text-sm font-semibold">Who won?</p>

                {/* Side-by-side team cards */}
                <div className="grid grid-cols-2 gap-2">
                  {([
                    {
                      id: 'a' as const,
                      p1: wager?.team_a_p1_profile,
                      p2: wager?.team_a_p2_profile,
                      label: labelA,
                    },
                    {
                      id: 'b' as const,
                      p1: wager?.team_b_p1_profile,
                      p2: wager?.team_b_p2_profile,
                      label: labelB,
                    },
                  ]).map(({ id, p1, p2, label }) => {
                    const sel = choice === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setChoice(id)}
                        className={cn(
                          'flex flex-col items-center gap-2.5 rounded-xl border-2 px-3 py-4 text-center transition-all active:scale-[0.98]',
                          sel
                            ? 'border-[oklch(0.29_0.072_160)] bg-[oklch(0.29_0.072_160/0.08)]'
                            : 'border-border bg-card hover:border-primary/30',
                        )}
                      >
                        <div className="flex justify-center -space-x-2">
                          {p1 && <PlayerAvatar player={p1} size="md" className="ring-2 ring-card" />}
                          {p2 && <PlayerAvatar player={p2} size="md" className="ring-2 ring-card" />}
                        </div>
                        <div>
                          {p1 && p2 ? (
                            <>
                              <p className={cn(
                                'text-xs font-bold leading-tight',
                                sel ? 'text-[oklch(0.29_0.072_160)]' : 'text-foreground',
                              )}>
                                {profileDisplayName(p1)}
                              </p>
                              <p className={cn(
                                'text-xs font-bold leading-tight',
                                sel ? 'text-[oklch(0.29_0.072_160)]' : 'text-foreground',
                              )}>
                                {profileDisplayName(p2)}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs font-bold">{label}</p>
                          )}
                        </div>
                        <div className={cn(
                          'h-4 w-4 rounded-full border-2 transition-all',
                          sel
                            ? 'border-[oklch(0.29_0.072_160)] bg-[oklch(0.29_0.072_160)]'
                            : 'border-muted-foreground/30',
                        )} />
                      </button>
                    )
                  })}
                </div>

                {/* Halved — full width */}
                <button
                  type="button"
                  onClick={() => setChoice('halved')}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 transition-all active:scale-[0.99]',
                    choice === 'halved'
                      ? 'border-[oklch(0.65_0.18_50)] bg-[oklch(0.65_0.18_50/0.08)]'
                      : 'border-border bg-card hover:border-primary/30',
                  )}
                >
                  <p className={cn(
                    'text-sm font-bold',
                    choice === 'halved' ? 'text-[oklch(0.65_0.18_50)]' : 'text-muted-foreground',
                  )}>
                    Halved — no transfer
                  </p>
                  <div className={cn(
                    'h-4 w-4 shrink-0 rounded-full border-2 transition-all',
                    choice === 'halved'
                      ? 'border-[oklch(0.65_0.18_50)] bg-[oklch(0.65_0.18_50)]'
                      : 'border-muted-foreground/30',
                  )} />
                </button>
              </div>

              {/* Optional margin */}
              {choice && (
                <div className="rounded-xl border border-border bg-card px-3 py-3">
                  <Label htmlFor="tw-margin" className="text-sm font-semibold">
                    Margin <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">e.g. 2&amp;1, 3&amp;2, 1 Up</p>
                  <Input
                    id="tw-margin"
                    className="mt-2 h-11 rounded-xl border-2"
                    placeholder="e.g. 2&1"
                    value={margin}
                    onChange={(e) => setMargin(e.target.value)}
                  />
                </div>
              )}

              {/* Course */}
              <div className="relative rounded-xl border border-border bg-card px-3 py-3">
                <Label htmlFor="tw-course" className="text-sm font-semibold">
                  Course played
                </Label>
                <Input
                  id="tw-course"
                  autoComplete="off"
                  placeholder="Start typing a course name…"
                  value={courseInput}
                  onChange={(e) => {
                    setCourseInput(e.target.value)
                    setCourse(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="mt-2 h-12 rounded-xl border-2 border-border bg-card text-base placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 md:text-sm"
                />
                {showSuggestions && courseSuggestions.length > 0 && (
                  <div className="absolute left-3 right-3 top-full z-10 mt-1.5 overflow-hidden rounded-xl border-2 border-border bg-card">
                    {courseSuggestions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="w-full px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted active:bg-muted/80"
                        onMouseDown={() => {
                          setCourse(c)
                          setCourseInput(c)
                          setShowSuggestions(false)
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="rounded-xl border border-border bg-card px-3 py-3">
                <Label htmlFor="tw-date" className="text-sm font-semibold">
                  Date played
                </Label>
                <Input
                  id="tw-date"
                  type="date"
                  value={playedAt}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPlayedAt(e.target.value)}
                  className="mt-2 h-12 rounded-xl border-2 border-border bg-card text-base focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 md:text-sm"
                />
              </div>

              {(localError || submit.isError) && (
                <p className="text-sm text-destructive">
                  {localError ?? (submit.error instanceof Error ? submit.error.message : 'Request failed')}
                </p>
              )}

              <Button
                type="button"
                className="h-12 w-full rounded-xl font-bold"
                style={{ backgroundColor: GREEN, color: 'white' }}
                disabled={!choice || (!course && !courseInput) || submit.isPending}
                onClick={handleSubmit}
              >
                {submit.isPending
                  ? 'Submitting…'
                  : choice
                    ? `Submit: ${choice === 'halved' ? 'Halved' : choice === 'a' ? `${labelA} win` : `${labelB} win`}`
                    : 'Select a result'}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
