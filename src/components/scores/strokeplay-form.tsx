import { useState, useEffect, useMemo } from 'react'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, CheckCircle2, Lock } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useActiveSeason, useOpenSubSeasons, useSubmitStrokeplay, usePlayers } from '@/hooks/use-data'
import { KNOWN_COURSES } from '@/lib/constants'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { profileDisplayName } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Props {
  onClose: () => void
  onBack: () => void
}

const fieldClass =
  'mt-2 h-12 min-h-12 w-full rounded-xl border-2 border-border bg-card px-3 text-base placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 md:text-sm'

const selectTriggerClass =
  'mt-2 h-12 min-h-12 w-full min-w-0 rounded-xl border-2 border-border bg-card px-3 py-2 text-sm shadow-none data-placeholder:text-muted-foreground'

type SuccessSnapshot = {
  netScore: number
  gross: string
  courseHandicap: string
  courseName: string
}

export function StrokeplayForm({ onClose, onBack }: Props) {
  const profile = useAuthStore((s) => s.profile)
  const { data: season } = useActiveSeason()
  const { data: openSubSeasons = [] } = useOpenSubSeasons()
  const { data: players = [] } = usePlayers()
  const submitStrokeplay = useSubmitStrokeplay()

  const [step, setStep] = useState<'details' | 'confirm' | 'success'>('details')
  const [course, setCourse] = useState('')
  const [courseInput, setCourseInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [courseHandicap, setCourseHandicap] = useState('')
  const [gross, setGross] = useState('')
  const [subSeasonId, setSubSeasonId] = useState('')
  const [presentIds, setPresentIds] = useState<Set<string>>(() => new Set())
  const [successSnapshot, setSuccessSnapshot] = useState<SuccessSnapshot | null>(null)

  useEffect(() => {
    if (openSubSeasons.length === 0) return
    setSubSeasonId((prev) =>
      prev && openSubSeasons.some((s) => s.id === prev) ? prev : openSubSeasons[0]!.id,
    )
  }, [openSubSeasons])

  useEffect(() => {
    if (!profile?.id) return
    setPresentIds((prev) => {
      const next = new Set(prev)
      next.add(profile.id)
      return next
    })
  }, [profile?.id])

  const sortedPlayers = useMemo(
    () =>
      [...players].sort((a, b) =>
        profileDisplayName(a).localeCompare(profileDisplayName(b), undefined, {
          sensitivity: 'base',
        }),
      ),
    [players],
  )

  const selectedSub = openSubSeasons.find((s) => s.id === subSeasonId)
  const netScore =
    gross && courseHandicap !== '' ? Number(gross) - Number(courseHandicap) : null
  const courseSuggestions = KNOWN_COURSES.filter(
    (c) =>
      c.toLowerCase().includes(courseInput.toLowerCase()) && courseInput.length > 1,
  ).slice(0, 5)

  const courseName = (course || courseInput).trim()
  const presentOk =
    profile != null &&
    presentIds.size >= 1 &&
    presentIds.has(profile.id)

  const canReview =
    !!gross &&
    courseHandicap !== '' &&
    !!subSeasonId &&
    !!courseName &&
    presentOk

  const togglePresent = (id: string) => {
    if (!profile || id === profile.id) return
    setPresentIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (!profile || !canReview || netScore === null) return
    await submitStrokeplay.mutateAsync({
      player_id: profile.id,
      sub_season_id: subSeasonId,
      course_name: courseName,
      played_at: date,
      course_handicap: Number(courseHandicap),
      gross_score: Number(gross),
      present_player_ids: [...presentIds],
    })
    setSuccessSnapshot({
      netScore,
      gross,
      courseHandicap,
      courseName,
    })
    setStep('success')
  }

  if (step === 'success' && successSnapshot) {
    const { netScore: net, gross: g, courseHandicap: ch, courseName: submittedCourse } =
      successSnapshot
    return (
      <div className="flex w-full flex-col items-center gap-4 px-1 pb-2 pt-10">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: 'oklch(0.35 0.10 160 / 0.2)' }}
        >
          <CheckCircle2 className="h-10 w-10" style={{ color: 'oklch(0.35 0.10 160)' }} />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-bold">Round submitted</h3>
          <p className="text-sm text-muted-foreground">{submittedCourse}</p>
          <div>
            <p className="text-4xl font-black" style={{ color: 'oklch(0.22 0.068 157)' }}>
              Net {net}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {g} gross — course HCP {ch}
            </p>
          </div>
        </div>
        <Button
          onClick={onClose}
          className="mt-1 h-auto min-h-12 w-full rounded-xl px-3 py-3 text-center text-sm font-bold leading-snug text-primary-foreground shadow-none active:translate-y-0 [box-shadow:none]"
          style={{ backgroundColor: 'oklch(0.35 0.10 160)' }}
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (step === 'confirm' ? setStep('details') : onBack())}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <SheetTitle className="text-lg font-bold">Strokeplay Round</SheetTitle>
        </div>
        <div className="mt-2 flex gap-1">
          {(['details', 'confirm'] as const).map((s, i) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-all"
              style={{
                backgroundColor:
                  (step === 'confirm' && i <= 1) || (step === 'details' && i === 0)
                    ? 'oklch(0.80 0.14 72)'
                    : 'oklch(0.90 0 0)',
              }}
            />
          ))}
        </div>
      </SheetHeader>

      {step === 'details' && (
        <div className="space-y-4">
          {openSubSeasons.length === 0 ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-3 text-sm text-destructive">
              No open scoring period right now. You can’t submit a strokeplay round until the season
              opens one.
            </div>
          ) : openSubSeasons.length === 1 ? (
            <div className="rounded-xl border border-border bg-card px-3 py-3">
              <p className="text-sm font-semibold">Season</p>
              <p className="mt-2 text-sm font-bold text-foreground">{season?.name ?? '—'}</p>
              {openSubSeasons[0]!.name ? (
                <p className="mt-1 text-xs text-muted-foreground">{openSubSeasons[0]!.name}</p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card px-3 py-3">
              <p className="text-sm font-semibold">Season</p>
              <p className="mt-2 text-sm font-bold text-foreground">{season?.name ?? '—'}</p>
              <Label htmlFor="strokeplay-sub" className="mt-3 block text-sm font-semibold">
                Scoring period
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                This round is saved against the period you select.
              </p>
              <Select value={subSeasonId} onValueChange={(v) => setSubSeasonId(v ?? '')}>
                <SelectTrigger id="strokeplay-sub" className={selectTriggerClass}>
                  <SelectValue placeholder="Select period…">
                    {selectedSub?.name ?? 'Select period…'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {openSubSeasons.map((ss) => (
                    <SelectItem key={ss.id} value={ss.id}>
                      {ss.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="relative rounded-xl border border-border bg-card px-3 py-3">
            <Label htmlFor="strokeplay-course" className="text-sm font-semibold">
              Course played
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Start typing — we&apos;ll suggest known courses.
            </p>
            <Input
              id="strokeplay-course"
              autoComplete="off"
              placeholder="Start typing a course name…"
              value={courseInput}
              onChange={(e) => {
                setCourseInput(e.target.value)
                setCourse(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              className={fieldClass}
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

          <div className="rounded-xl border border-border bg-card px-3 py-3">
            <Label htmlFor="strokeplay-date" className="text-sm font-semibold">
              Date played
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">When you finished the round.</p>
            <Input
              id="strokeplay-date"
              type="date"
              value={date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card px-3 py-3">
              <Label htmlFor="strokeplay-hcp" className="text-sm font-semibold">
                Course handicap
              </Label>
              <Input
                id="strokeplay-hcp"
                type="number"
                className={fieldClass}
                value={courseHandicap}
                onChange={(e) => setCourseHandicap(e.target.value)}
                min={0}
                max={54}
                placeholder="This round"
              />
            </div>
            <div className="rounded-xl border border-border bg-card px-3 py-3">
              <Label htmlFor="strokeplay-gross" className="text-sm font-semibold">
                Gross score
              </Label>
              <Input
                id="strokeplay-gross"
                type="number"
                className={fieldClass}
                placeholder="e.g. 88"
                value={gross}
                onChange={(e) => setGross(e.target.value)}
                min={50}
                max={150}
              />
            </div>
          </div>

          {netScore !== null && (
            <div
              className="flex items-center justify-between rounded-xl border-2 border-[oklch(0.35_0.10_160/0.35)] px-3 py-2.5"
              style={{ backgroundColor: 'oklch(0.35 0.10 160 / 0.1)' }}
            >
              <span className="text-sm font-semibold text-muted-foreground">Net score</span>
              <span className="text-2xl font-black" style={{ color: 'oklch(0.35 0.10 160)' }}>
                {netScore}
              </span>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card px-3 py-3">
            <p className="text-sm font-semibold">Who was present?</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Select everyone who played this round. You&apos;re always included. Add at least one
              playing partner if others were there.
            </p>
            <div className="mt-3 space-y-2">
              {sortedPlayers.map((p) => {
                const isSelf = profile?.id === p.id
                const on = presentIds.has(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isSelf}
                    onClick={() => togglePresent(p.id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left transition-all',
                      on
                        ? 'border-[oklch(0.35_0.10_160)] bg-[oklch(0.35_0.10_160/0.12)]'
                        : 'border-border bg-card hover:border-primary/25',
                      isSelf && 'cursor-default opacity-100',
                    )}
                  >
                    <PlayerAvatar player={p} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{profileDisplayName(p)}</p>
                      {isSelf && (
                        <p className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                          <Lock className="h-3 w-3" aria-hidden />
                          You (always counted)
                        </p>
                      )}
                    </div>
                    {on && (
                      <span className="text-xs font-bold text-[oklch(0.35_0.10_160)]">✓</span>
                    )}
                  </button>
                )
              })}
            </div>
            {profile && !presentIds.has(profile.id) && (
              <p className="mt-2 text-xs text-destructive">You must be included in this round.</p>
            )}
          </div>

          <Button
            type="button"
            onClick={() => setStep('confirm')}
            disabled={!canReview || openSubSeasons.length === 0}
            className="h-auto min-h-12 w-full rounded-xl px-3 py-3 text-center text-sm font-bold leading-snug"
            style={{ backgroundColor: 'oklch(0.80 0.14 72)', color: 'oklch(0.18 0.06 60)' }}
          >
            Review round
          </Button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="space-y-3 rounded-xl border border-border bg-card px-3 py-3 text-sm">
            <div className="flex justify-between gap-2 border-b border-border pb-2">
              <span className="text-muted-foreground">Season</span>
              <span className="text-right font-semibold">{season?.name ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-border pb-2">
              <span className="text-muted-foreground">Period</span>
              <span className="text-right font-semibold">{selectedSub?.name ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-border pb-2">
              <span className="text-muted-foreground">Course</span>
              <span className="text-right font-semibold">{courseName || '—'}</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-border pb-2">
              <span className="text-muted-foreground">Date</span>
              <span className="text-right font-semibold">{date}</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-border pb-2">
              <span className="text-muted-foreground">Gross / HCP</span>
              <span className="text-right font-semibold">
                {gross || '—'} / {courseHandicap || '—'}
              </span>
            </div>
            <div className="flex justify-between gap-2 border-b border-border pb-2">
              <span className="text-muted-foreground">Net</span>
              <span
                className="text-right text-lg font-black"
                style={{ color: 'oklch(0.35 0.10 160)' }}
              >
                {netScore ?? '—'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Present</span>
              <p className="mt-1 font-medium leading-snug text-foreground">
                {[...presentIds]
                  .map((id) => sortedPlayers.find((pl) => pl.id === id))
                  .filter(Boolean)
                  .map((pl) => profileDisplayName(pl!))
                  .join(', ') || '—'}
              </p>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canReview || netScore === null || submitStrokeplay.isPending}
            className="h-auto min-h-12 w-full rounded-xl px-3 py-3 text-center text-sm font-bold leading-snug"
            style={{ backgroundColor: 'oklch(0.80 0.14 72)', color: 'oklch(0.18 0.06 60)' }}
          >
            {submitStrokeplay.isPending ? 'Submitting…' : 'Submit round'}
          </Button>
        </div>
      )}
    </>
  )
}
