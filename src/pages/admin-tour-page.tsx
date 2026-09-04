import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import {
  useTourCoursesForAdmin,
  useTourDays,
  useTourEvent,
  useTourFormatsCatalog,
  useTourMatchPlayersBatch,
  useTourMatchesForDay,
  useTourPlayers,
} from '@/hooks/use-data'
import { formatHasPreset } from '@/lib/tour-format-presets'
import { expectedMatchCount } from '@/lib/tour-scoring'
import { TOUR_GOLD, TOUR_GOLD_FG } from '@/lib/tour-colors'
import { cn } from '@/lib/utils'

export function AdminTourPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const { data: ev } = useTourEvent()
  const { data: roster } = useTourPlayers()
  const { data: formats } = useTourFormatsCatalog()
  const { data: courses } = useTourCoursesForAdmin()
  const { data: days } = useTourDays()

  if (!profile?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Admin Access Required</h2>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    )
  }

  const eventDone = !!ev
  const rosterCount = roster?.length ?? 0
  const rosterDone = rosterCount >= 16
  const formatsDone = (['better_ball_stableford', 'mixed_par_stableford', 'singles_matchplay'] as const).every(
    (id) => formats?.some((f) => formatHasPreset(f.scoring_rules, id)),
  )
  const courseCount = courses?.length ?? 0
  const daysList = days ?? []
  const daysDone = daysList.length === 3 && daysList.every((d) => d.format_id)
  const before = [
    eventDone,
    rosterDone || rosterCount > 0,
    formatsDone,
    courseCount > 0,
    daysDone,
  ]
  const nextBefore = before.findIndex((d) => !d)

  return (
    <div className="py-4 pb-10">
      <div className="px-4 mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Tour setup</h1>
          <p className="text-sm text-muted-foreground">
            {ev?.name ?? 'Lock in the trip first, then run each day the night before.'}
          </p>
        </div>
      </div>

      <section className="px-4 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2">
          Before you go
        </p>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <StepRow
            n={1}
            title="Event"
            detail={eventDone ? `${ev!.name} · first to ${ev!.target_points}` : 'Name and team target'}
            done={eventDone}
            next={nextBefore === 0}
            onClick={() => navigate('/admin/tour/event')}
          />
          <StepRow
            n={2}
            title="Roster"
            detail={
              rosterCount
                ? `${rosterCount} player${rosterCount === 1 ? '' : 's'} · teams, seeds, locked HCP`
                : '16 players, 93s / 91s, seeds, handicaps'
            }
            done={rosterDone}
            next={nextBefore === 1}
            onClick={() => navigate('/admin/tour/roster')}
          />
          <StepRow
            n={3}
            title="Formats"
            detail="Day 1 better ball · Day 2 mixed par · Day 3 singles. Do this once."
            done={formatsDone}
            next={nextBefore === 2}
            onClick={() => navigate('/admin/tour/formats')}
          />
          <StepRow
            n={4}
            title="Courses"
            detail={
              courseCount
                ? `${courseCount} on file. Add Day 2 when you know it — you won’t until you arrive.`
                : 'Add courses you already know. Day 2 can wait.'
            }
            done={courseCount > 0}
            next={nextBefore === 3}
            onClick={() => navigate('/admin/tour/courses')}
          />
          <StepRow
            n={5}
            title="Days"
            detail="Lock the three formats now. Assign the course when you know it."
            done={daysDone}
            next={nextBefore === 4}
            onClick={() => navigate('/admin/tour/days')}
            last
          />
        </div>
      </section>

      <section className="px-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1">
          Each match day
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Pairings the night before. Course on arrival if it isn’t locked yet.
        </p>
        <div className="space-y-2">
          {([1, 2, 3] as const).map((n) => {
            const day = daysList.find((d) => d.day_number === n) ?? null
            return <DayOpsCard key={n} dayNumber={n} day={day} />
          })}
        </div>
      </section>
    </div>
  )
}

function StepRow({
  n,
  title,
  detail,
  done,
  next,
  onClick,
  last,
}: {
  n: number
  title: string
  detail: string
  done: boolean
  next: boolean
  onClick: () => void
  last?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 text-left',
        !last && 'border-b border-border',
      )}
    >
      <span
        className={cn(
          'size-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0',
          done && 'text-white',
          next && !done && 'text-black',
          !done && !next && 'bg-muted text-muted-foreground',
        )}
        style={
          done
            ? { backgroundColor: 'oklch(0.45 0.12 155)' }
            : next
              ? { backgroundColor: TOUR_GOLD, color: TOUR_GOLD_FG }
              : undefined
        }
      >
        {done ? <Check className="h-3.5 w-3.5" /> : n}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold">{title}</p>
          {next && !done && (
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: TOUR_GOLD }}>
              Next
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-snug">{detail}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  )
}

function DayOpsCard({
  dayNumber,
  day,
}: {
  dayNumber: 1 | 2 | 3
  day: {
    id: string
    day_number: number
    course_id: string | null
    format: { id: string; name: string; scoring_rules: Record<string, unknown> }
    course: { id: string; name: string } | null
  } | null
}) {
  const navigate = useNavigate()
  const hint =
    dayNumber === 2
      ? 'Course when you arrive. Pairings the night before.'
      : 'Pairings the night before.'

  if (!day) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-4 py-3">
        <p className="text-sm font-black">Day {dayNumber}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Create this day in step 5 first.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <p className="text-sm font-black">Day {dayNumber}</p>
          <p className="text-xs text-muted-foreground">{day.format.name}</p>
        </div>
        <span className="text-[11px] font-bold text-muted-foreground">
          {day.course?.name ?? 'Course TBC'}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">{hint}</p>
      <DayProgress dayId={day.id} format={day.format} dayNumber={day.day_number} />
      <div className="flex flex-wrap gap-2 mt-3">
        <Button
          size="sm"
          variant={day.course ? 'secondary' : 'default'}
          className="h-8"
          style={!day.course ? { backgroundColor: TOUR_GOLD, color: TOUR_GOLD_FG } : undefined}
          onClick={() => navigate('/admin/tour/days')}
        >
          {day.course ? 'Change course' : 'Set course'}
        </Button>
        <Button size="sm" variant="secondary" className="h-8" onClick={() => navigate(`/admin/tour/handicaps?day=${day.id}`)}>
          Handicaps
        </Button>
        <Button size="sm" variant="secondary" className="h-8" onClick={() => navigate(`/admin/tour/matches?day=${day.id}`)}>
          Pairings
        </Button>
      </div>
    </div>
  )
}

function DayProgress({
  dayId,
  format,
  dayNumber,
}: {
  dayId: string
  format: { scoring_rules: Record<string, unknown> }
  dayNumber: number
}) {
  const { data: matches } = useTourMatchesForDay(dayId)
  const ids = matches?.map((m) => m.id) ?? []
  const { data: mps } = useTourMatchPlayersBatch(ids)
  const want = expectedMatchCount(format, dayNumber)
  const have = matches?.length ?? 0
  const lined = matches?.filter((m) => (mps ?? []).some((mp) => mp.match_id === m.id)).length ?? 0
  return (
    <p className="text-xs font-semibold">
      {have}/{want} matches · {lined} with a lineup
    </p>
  )
}
