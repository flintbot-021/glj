import { useState } from 'react'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useUnplayedOpponents, useSubmitMatchplay, useGroupForPlayer } from '@/hooks/use-data'
import { MATCHPLAY_MARGINS, KNOWN_COURSES } from '@/lib/constants'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { profileDisplayName } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Props {
  onClose: () => void
  onBack: () => void
}

export function MatchplayForm({ onClose, onBack }: Props) {
  const profile = useAuthStore((s) => s.profile)
  const { data: group } = useGroupForPlayer(profile?.id)
  const { data: opponents = [] } = useUnplayedOpponents(profile?.id ?? '', group?.id ?? '')
  const submitMatchplay = useSubmitMatchplay()

  const [step, setStep] = useState<'opponent' | 'result' | 'details' | 'success'>('opponent')
  const [opponentId, setOpponentId] = useState('')
  const [result, setResult] = useState<'won' | 'lost' | 'drew' | ''>('')
  const [margin, setMargin] = useState('')
  const [course, setCourse] = useState('')
  const [courseInput, setCourseInput] = useState('')
  const [showCourseSuggestions, setShowCourseSuggestions] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const selectedOpponent = opponents.find((o) => o.id === opponentId)

  const courseSuggestions = KNOWN_COURSES.filter((c) =>
    c.toLowerCase().includes(courseInput.toLowerCase()) && courseInput.length > 1
  ).slice(0, 5)

  const handleSubmit = async () => {
    if (!profile || !group) return
    const finalResult: 'win_a' | 'win_b' | 'draw' =
      result === 'won' ? 'win_a' : result === 'lost' ? 'win_b' : 'draw'

    await submitMatchplay.mutateAsync({
      player_a_id: profile.id,
      player_b_id: opponentId,
      group_id: group.id,
      result: finalResult,
      margin: margin || 'All Square',
      course_name: course || courseInput,
      played_at: date,
    })
    setStep('success')
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="h-16 w-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'oklch(0.91 0.19 106 / 0.2)' }}>
          <CheckCircle2 className="h-8 w-8" style={{ color: 'oklch(0.91 0.19 106)' }} />
        </div>
        <h3 className="text-xl font-bold">Result Submitted!</h3>
        <p className="text-muted-foreground text-sm text-center">
          Your result has been recorded and the standings have been updated.
        </p>
        <Button
          onClick={onClose}
          className="mt-4 w-full"
          style={{ backgroundColor: 'oklch(0.29 0.072 160)' }}
        >
          Done
        </Button>
      </div>
    )
  }

  return (
    <>
      <SheetHeader className="mb-6">
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
                    ? 'oklch(0.91 0.19 106)'
                    : 'oklch(0.90 0 0)',
              }}
            />
          ))}
        </div>
      </SheetHeader>

      {step === 'opponent' && (
        <div className="space-y-4">
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
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card active:scale-[0.98] transition-transform text-left hover:border-primary/30"
                >
                  <PlayerAvatar player={opp} size="md" />
                  <div>
                    <p className="font-semibold">{profileDisplayName(opp)}</p>
                    {opp.full_name && (
                      <p className="text-sm text-muted-foreground">{opp.full_name}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'result' && selectedOpponent && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <PlayerAvatar player={selectedOpponent} size="sm" />
            <span className="text-sm font-semibold">vs {profileDisplayName(selectedOpponent)}</span>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">What was the result?</p>
            <div className="grid grid-cols-3 gap-2">
              {(['won', 'drew', 'lost'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setResult(r)}
                  className={cn(
                    'py-4 rounded-xl font-bold text-sm border-2 transition-all',
                    result === r
                      ? r === 'won' ? 'border-green-500 bg-green-500/10 text-green-600'
                        : r === 'lost' ? 'border-red-500 bg-red-500/10 text-red-600'
                        : 'border-yellow-500 bg-yellow-500/10 text-yellow-600'
                      : 'border-border bg-card text-muted-foreground'
                  )}
                >
                  {r === 'won' ? 'WON' : r === 'drew' ? 'DREW' : 'LOST'}
                </button>
              ))}
            </div>
          </div>

          {result && result !== 'drew' && (
            <div>
              <Label>Winning margin</Label>
              <Select value={margin} onValueChange={(v) => setMargin(v ?? '')}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select margin..." />
                </SelectTrigger>
                <SelectContent>
                  {MATCHPLAY_MARGINS.filter(m => m !== 'Halved').map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={() => setStep('details')}
            disabled={!result || (result !== 'drew' && !margin)}
            className="w-full"
            style={{ backgroundColor: 'oklch(0.29 0.072 160)' }}
          >
            Continue
          </Button>
        </div>
      )}

      {step === 'details' && (
        <div className="space-y-4">
          <div className="relative">
            <Label>Course played</Label>
            <Input
              className="mt-1.5"
              placeholder="Start typing a course name..."
              value={courseInput}
              onChange={(e) => {
                setCourseInput(e.target.value)
                setCourse(e.target.value)
                setShowCourseSuggestions(true)
              }}
              onFocus={() => setShowCourseSuggestions(true)}
            />
            {showCourseSuggestions && courseSuggestions.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                {courseSuggestions.map((c) => (
                  <button
                    key={c}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors"
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

          <div>
            <Label>Date played</Label>
            <Input
              type="date"
              className="mt-1.5"
              value={date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={(!course && !courseInput) || submitMatchplay.isPending}
            className="w-full mt-4"
            style={{ backgroundColor: 'oklch(0.91 0.19 106)', color: 'oklch(0.20 0.07 150)' }}
          >
            {submitMatchplay.isPending ? 'Submitting...' : 'Submit Result'}
          </Button>
        </div>
      )}
    </>
  )
}
