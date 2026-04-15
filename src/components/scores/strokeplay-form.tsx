import { useState } from 'react'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useOpenSubSeasons, useSubmitStrokeplay } from '@/hooks/use-data'
import { KNOWN_COURSES } from '@/lib/constants'

interface Props {
  onClose: () => void
  onBack: () => void
}

export function StrokeplayForm({ onClose, onBack }: Props) {
  const profile = useAuthStore((s) => s.profile)
  const { data: openSubSeasons = [] } = useOpenSubSeasons()
  const submitStrokeplay = useSubmitStrokeplay()

  const [course, setCourse] = useState('')
  const [courseInput, setCourseInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [courseHandicap, setCourseHandicap] = useState('')
  const [gross, setGross] = useState('')
  const [subSeasonId, setSubSeasonId] = useState(openSubSeasons[0]?.id ?? '')
  const [success, setSuccess] = useState(false)

  const netScore =
    gross && courseHandicap !== '' ? Number(gross) - Number(courseHandicap) : null
  const courseSuggestions = KNOWN_COURSES.filter(
    (c) => c.toLowerCase().includes(courseInput.toLowerCase()) && courseInput.length > 1
  ).slice(0, 5)

  const handleSubmit = async () => {
    if (!profile) return
    await submitStrokeplay.mutateAsync({
      player_id: profile.id,
      sub_season_id: subSeasonId,
      course_name: course || courseInput,
      played_at: date,
      course_handicap: Number(courseHandicap),
      gross_score: Number(gross),
    })
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="h-16 w-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'oklch(0.42 0.15 260 / 0.2)' }}>
          <CheckCircle2 className="h-8 w-8" style={{ color: 'oklch(0.42 0.15 260)' }} />
        </div>
        <h3 className="text-xl font-bold">Round Submitted!</h3>
        {netScore !== null && (
          <div className="text-center">
            <p className="text-4xl font-black" style={{ color: 'oklch(0.29 0.072 160)' }}>
              Net {netScore}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {gross} gross — course HCP {courseHandicap}
            </p>
          </div>
        )}
        <Button onClick={onClose} className="mt-4 w-full" style={{ backgroundColor: 'oklch(0.42 0.15 260)' }}>
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
          <SheetTitle className="text-lg font-bold">Strokeplay Round</SheetTitle>
        </div>
      </SheetHeader>

      <div className="space-y-4">
        {/* Sub-season selector */}
        {openSubSeasons.length > 0 && (
          <div>
            <Label>Sub-season</Label>
            <Select value={subSeasonId} onValueChange={(v) => setSubSeasonId(v ?? '')}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select sub-season..." />
              </SelectTrigger>
              <SelectContent>
                {openSubSeasons.map((ss) => (
                  <SelectItem key={ss.id} value={ss.id}>{ss.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Course */}
        <div className="relative">
          <Label>Course played</Label>
          <Input
            className="mt-1.5"
            placeholder="Start typing a course name..."
            value={courseInput}
            onChange={(e) => {
              setCourseInput(e.target.value)
              setCourse(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
          />
          {showSuggestions && courseSuggestions.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
              {courseSuggestions.map((c) => (
                <button
                  key={c}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                  onMouseDown={() => { setCourse(c); setCourseInput(c); setShowSuggestions(false) }}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date */}
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

        {/* Scores side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Course handicap</Label>
            <Input
              type="number"
              className="mt-1.5"
              value={courseHandicap}
              onChange={(e) => setCourseHandicap(e.target.value)}
              min={0}
              max={54}
              placeholder="This round"
            />
          </div>
          <div>
            <Label>Gross score</Label>
            <Input
              type="number"
              className="mt-1.5"
              placeholder="e.g. 88"
              value={gross}
              onChange={(e) => setGross(e.target.value)}
              min={50}
              max={150}
            />
          </div>
        </div>

        {/* Net score preview */}
        {netScore !== null && (
          <div
            className="flex items-center justify-between p-4 rounded-xl"
            style={{ backgroundColor: 'oklch(0.42 0.15 260 / 0.1)', border: '1px solid oklch(0.42 0.15 260 / 0.3)' }}
          >
            <span className="text-sm font-semibold text-muted-foreground">Net Score</span>
            <span className="text-2xl font-black" style={{ color: 'oklch(0.42 0.15 260)' }}>
              {netScore}
            </span>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={
            !gross ||
            courseHandicap === '' ||
            !subSeasonId ||
            (!course && !courseInput) ||
            submitStrokeplay.isPending
          }
          className="w-full"
          style={{ backgroundColor: 'oklch(0.91 0.19 106)', color: 'oklch(0.20 0.07 150)' }}
        >
          {submitStrokeplay.isPending ? 'Submitting...' : 'Submit Round'}
        </Button>
      </div>
    </>
  )
}
