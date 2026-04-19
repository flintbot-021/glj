import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { EnrichedWager } from '@/lib/types'
import { profileDisplayName } from '@/lib/format'
import { useSubmitWagerOutcome } from '@/hooks/use-data'
import { cn } from '@/lib/utils'

type OutcomeChoice = 'won' | 'lost' | 'halved'

interface Props {
  wager: EnrichedWager | null
  profileId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WagerRecordOutcomeDialog({ wager, profileId, open, onOpenChange }: Props) {
  const submit = useSubmitWagerOutcome()
  const [choice, setChoice] = useState<OutcomeChoice>('won')
  const [margin, setMargin] = useState('')
  const [course, setCourse] = useState('')
  const [playedAt, setPlayedAt] = useState(() => new Date().toISOString().split('T')[0]!)
  const [localError, setLocalError] = useState<string | null>(null)

  const counterpart =
    wager && profileId === wager.proposer_id ? wager.opponent : wager?.proposer

  const resetAndClose = () => {
    setChoice('won')
    setMargin('')
    setCourse('')
    setPlayedAt(new Date().toISOString().split('T')[0]!)
    setLocalError(null)
    submit.reset()
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    if (!wager || !counterpart) return
    setLocalError(null)
    const courseName = course.trim()
    if (!courseName) {
      setLocalError('Enter where you played.')
      return
    }
    if (!playedAt) {
      setLocalError('Choose the date.')
      return
    }

    let resultWinnerId: string | null = null
    let resultMargin = margin.trim()
    if (choice === 'won') {
      resultWinnerId = profileId
      if (!resultMargin) resultMargin = 'Win'
    } else if (choice === 'lost') {
      resultWinnerId = counterpart.id
      if (!resultMargin) resultMargin = 'Loss'
    } else {
      resultMargin = resultMargin || 'Halved'
    }

    try {
      await submit.mutateAsync({
        wagerId: wager.id,
        resultWinnerId,
        resultMargin,
        resultCourse: courseName,
        resultPlayedAt: playedAt,
      })
      resetAndClose()
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Something went wrong')
    }
  }

  return (
    <Sheet
      open={open && !!wager}
      onOpenChange={(v) => {
        if (!v) resetAndClose()
      }}
    >
      <SheetContent
        side="bottom"
        className="gap-0 rounded-t-2xl px-5 pb-8 pt-2 shadow-none max-h-[90dvh] overflow-y-auto flex flex-col"
      >
        <SheetHeader className="space-y-2 px-0 pb-4 text-left">
          <SheetTitle className="text-lg font-bold pr-10">Record wager result</SheetTitle>
          <SheetDescription className="text-left text-sm">
            <span className="block text-muted-foreground">
              vs {counterpart ? profileDisplayName(counterpart) : 'opponent'}
              {wager ? ` · stake ${wager.amount.toFixed(2)}` : ''}
            </span>
            <span className="mt-1 block text-muted-foreground">
              Your opponent must confirm before wallets move.
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 pb-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold">Outcome</p>
            <div className="grid grid-cols-3 gap-2">
              {(['won', 'lost', 'halved'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChoice(c)}
                  className={cn(
                    'rounded-xl border-2 py-2.5 text-xs font-bold transition-all sm:text-sm',
                    choice === c
                      ? 'border-[oklch(0.29_0.072_160)] bg-[oklch(0.29_0.072_160/0.12)] text-[oklch(0.22_0.09_160)]'
                      : 'border-border bg-card text-muted-foreground',
                  )}
                >
                  {c === 'won' ? 'I won' : c === 'lost' ? 'I lost' : 'Halved'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="wager-margin" className="text-sm font-semibold">
              Margin / notes
            </Label>
            <Input
              id="wager-margin"
              className="mt-1.5 h-11 rounded-xl border-2"
              placeholder={choice === 'halved' ? 'e.g. Halved' : 'e.g. 2&1'}
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="wager-course" className="text-sm font-semibold">
              Course
            </Label>
            <Input
              id="wager-course"
              className="mt-1.5 h-11 rounded-xl border-2"
              placeholder="Course name"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="wager-played" className="text-sm font-semibold">
              Date played
            </Label>
            <Input
              id="wager-played"
              type="date"
              className="mt-1.5 h-11 rounded-xl border-2"
              max={new Date().toISOString().split('T')[0]}
              value={playedAt}
              onChange={(e) => setPlayedAt(e.target.value)}
            />
          </div>

          {localError ? <p className="text-sm text-destructive">{localError}</p> : null}
          {submit.isError ? (
            <p className="text-sm text-destructive">
              {submit.error instanceof Error ? submit.error.message : 'Request failed'}
            </p>
          ) : null}
        </div>

        <SheetFooter className="flex-row gap-2 border-t border-border px-0 pt-4 sm:flex-row">
          <Button type="button" variant="outline" className="flex-1" onClick={() => resetAndClose()}>
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 font-bold"
            style={{ backgroundColor: 'oklch(0.29 0.072 160)' }}
            disabled={submit.isPending}
            onClick={handleSubmit}
          >
            {submit.isPending ? 'Submitting…' : 'Submit for confirmation'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
