import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useTourBoard } from '@/hooks/use-data'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { TourMatchCard } from '@/components/tour/tour-match-card'
import { TourTally, fmtPts } from '@/components/tour/tour-tally'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { TEAM_BLUE, TEAM_RED, TOUR_GOLD, TOUR_GOLD_FG, champsDeadlineIso, champsPicksLocked } from '@/lib/tour-colors'
import { matchIsPending, type TourBoardDay, type TourChampsRow, type TourGreenJacketRow, type TourMatchView } from '@/lib/tour-board'
import { profileDisplayName, profileFirstName } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Eye, Flag, Pencil, Star } from 'lucide-react'

type HubTab = 'team' | 'jacket' | 'champs'

export function TourPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = parseTab(params.get('tab'))
  const { data: board, isLoading } = useTourBoard()
  const [picked, setPicked] = useState<TourMatchView | null>(null)

  if (isLoading) {
    return (
      <div className="px-4 py-4 space-y-3">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }

  if (!board) {
    return (
      <div className="px-4 py-16 text-center text-sm text-muted-foreground">
        Tour isn’t set up yet.
      </div>
    )
  }

  const locked = champsPicksLocked(board.event.champs_deadline)
  const deadline = new Date(champsDeadlineIso(board.event.champs_deadline)).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Johannesburg',
  })

  return (
    <div className="pb-6">
      <TourTally
        name={board.event.name}
        points93={board.points93}
        points91={board.points91}
        target={board.event.target_points}
        days={board.days}
      />

      <div className="px-4 mt-3">
        <button
          type="button"
          onClick={() => navigate('/tour/champs/picks')}
          className="w-full rounded-2xl border border-border bg-card p-3.5 text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black">{locked ? 'My Champs picks' : 'Set Champs picks'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {locked ? 'Locked' : `Four players, ranks 32+ · locks ${deadline}`}
              </p>
            </div>
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </div>
        </button>
      </div>

      <div className="sticky top-0 z-20 bg-background pt-3 pb-2">
        <div className="px-4">
          <div className="flex rounded-xl bg-muted p-1">
            {(['team', 'jacket', 'champs'] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setParams(id === 'team' ? {} : { tab: id })}
                className={cn(
                  'flex-1 h-9 rounded-lg text-xs font-bold',
                  tab === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
                )}
              >
                {id === 'team' ? 'Team Log' : id === 'jacket' ? 'Green Jacket' : 'Tour Champs'}
              </button>
            ))}
          </div>
        </div>
        {tab === 'jacket' && board.greenJacket.length > 0 && (
          <div className="flex items-center px-5 pt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <span className="w-6" />
            <span className="flex-1">Player</span>
            <span className="w-8 text-center">D1</span>
            <span className="w-8 text-center">D2</span>
            <span className="w-8 text-center">D3</span>
            <span className="w-10 text-right">Tot</span>
          </div>
        )}
      </div>

      {tab === 'team' && <TeamLog days={board.days} onMatch={setPicked} />}
      {tab === 'jacket' && <GreenJacketLog rows={board.greenJacket} />}
      {tab === 'champs' && <ChampsLog rows={board.champs} locked={locked} />}

      <MatchActionSheet
        view={picked}
        onClose={() => setPicked(null)}
        onView={() => {
          if (!picked) return
          navigate(`/tour/scoring/${picked.match.id}?mode=view`)
          setPicked(null)
        }}
        onScore={() => {
          if (!picked) return
          navigate(`/tour/scoring/${picked.match.id}`)
          setPicked(null)
        }}
      />
    </div>
  )
}

function parseTab(raw: string | null): HubTab {
  if (raw === 'jacket' || raw === 'champs') return raw
  return 'team'
}

function TeamLog({
  days,
  onMatch,
}: {
  days: TourBoardDay[]
  onMatch: (view: TourMatchView) => void
}) {
  const rows = [1, 2, 3].map((n) => days.find((d) => d.day.day_number === n) ?? null)
  if (days.length === 0) {
    return <EmptyLog text="Days and matches will show here once admin sets the lineups." />
  }
  return (
    <div className="px-4 mt-4 space-y-5">
      {rows.map((d, i) => (
        <section key={d?.day.id ?? `day-${i + 1}`}>
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <h2 className="text-sm font-black">Day {i + 1}</h2>
              {d ? (
                <p className="text-xs text-muted-foreground">
                  {d.format.name} · {d.course?.name ?? 'Course TBC'}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Not loaded yet</p>
              )}
            </div>
            <span className="text-sm font-black num">
              {d && d.matches.some((m) => !matchIsPending(m)) ? (
                <>
                  <span style={{ color: TEAM_BLUE }}>{fmtPts(d.points93)}</span>
                  <span className="text-muted-foreground"> – </span>
                  <span style={{ color: TEAM_RED }}>{fmtPts(d.points91)}</span>
                </>
              ) : (
                <span className="text-muted-foreground text-xs font-bold">TBC</span>
              )}
            </span>
          </div>
          {!d || d.matches.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
              Pending
            </div>
          ) : (
            <div className="space-y-2">
              {d.matches.map((m) => (
                <TourMatchCard key={m.match.id} view={m} onClick={() => onMatch(m)} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}

function MatchActionSheet({
  view,
  onClose,
  onView,
  onScore,
}: {
  view: TourMatchView | null
  onClose: () => void
  onView: () => void
  onScore: () => void
}) {
  const pending = view ? matchIsPending(view) : false
  const names = (side: TourMatchView['playersA']) =>
    side.length ? side.map((p) => profileFirstName(p.profile)).join(' / ') : 'TBD'
  return (
    <Sheet open={view != null} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8">
        <SheetHeader className="px-0 pt-2 pb-1">
          <SheetTitle>
            {view ? `Day ${view.dayNumber} · Match ${view.matchNumber}` : 'Match'}
          </SheetTitle>
          <SheetDescription>
            {view ? `${names(view.playersA)} vs ${names(view.playersB)}` : ''}
          </SheetDescription>
        </SheetHeader>
        {pending ? (
          <p className="text-sm text-muted-foreground py-2">Pending — lineup isn’t loaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button variant="outline" className="h-12 font-bold" onClick={onView}>
              <Eye className="h-4 w-4" />
              View
            </Button>
            <Button
              className="h-12 font-bold"
              style={{ backgroundColor: TOUR_GOLD, color: TOUR_GOLD_FG }}
              onClick={onScore}
            >
              Score
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function GreenJacketLog({ rows }: { rows: TourGreenJacketRow[] }) {
  if (rows.length === 0) return <EmptyLog text="Roster will appear here." />
  return (
    <div className="px-4 mt-3 space-y-2">
      {rows.map((row) => {
        const lead = row.rank === 1
        return (
          <div
            key={row.player.id}
            className={cn(
              'flex items-center gap-2 rounded-xl px-3 py-2.5 border bg-card',
              lead && 'border-2',
            )}
            style={lead ? { borderColor: TOUR_GOLD } : undefined}
          >
            <span className="w-5 text-xs font-black text-center" style={lead ? { color: TOUR_GOLD } : undefined}>{row.rank}</span>
            <PlayerAvatar player={row.player.profile} size="xs" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{profileDisplayName(row.player.profile)}</p>
              <span
                className="text-[9px] font-black px-1 rounded text-white"
                style={{ backgroundColor: row.player.team === '93s' ? TEAM_BLUE : TEAM_RED }}
              >
                {row.player.team}
              </span>
            </div>
            {row.dayPoints.map((n, i) => (
              <span key={i} className="w-8 text-center text-xs text-muted-foreground num">
                {n || '–'}
              </span>
            ))}
            <span className="w-10 text-right text-base font-black num">{row.total}</span>
          </div>
        )
      })}
    </div>
  )
}

function ChampsLog({ rows, locked }: { rows: TourChampsRow[]; locked: boolean }) {
  if (rows.length === 0) {
    return (
      <EmptyLog
        text={locked ? 'No picks were submitted.' : 'Pick four players whose ranks add to 32 or more.'}
      />
    )
  }
  return (
    <div className="px-4 mt-4 space-y-2">
      {rows.map((row) => (
        <div key={row.pick.id} className="rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-black w-5">{row.rank}</span>
              <PlayerAvatar player={row.picker} size="xs" />
              <span className="text-sm font-bold truncate">{profileDisplayName(row.picker)}</span>
            </div>
            <span className="text-lg font-black num" style={{ color: TOUR_GOLD }}>
              {row.total}
            </span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_2.25rem_2.25rem_2.25rem] gap-x-1 items-center px-1 mb-1">
            <span />
            {(['D1', 'D2', 'D3'] as const).map((label) => (
              <span
                key={label}
                className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="space-y-0.5">
            {row.picks.map((p, i) => {
              const cap = p.id === row.captain.id
              const days = row.pickDayPoints[i] ?? [0, 0, 0]
              return (
                <div
                  key={p.id}
                  className="grid grid-cols-[minmax(0,1fr)_2.25rem_2.25rem_2.25rem] gap-x-1 items-center rounded-lg px-1 py-1.5"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Star
                      className="h-3 w-3 shrink-0"
                      style={cap ? { color: TOUR_GOLD, fill: TOUR_GOLD } : { visibility: 'hidden' }}
                    />
                    <span className="text-[11px] font-black num text-muted-foreground w-6 shrink-0">
                      #{p.seed}
                    </span>
                    <span className="text-sm font-bold truncate">{profileFirstName(p.profile)}</span>
                  </div>
                  {days.map((n, di) => {
                    const doubled = cap && row.pick.captain_day === di + 1
                    return (
                      <span
                        key={di}
                        className={cn(
                          'text-center text-sm num leading-none py-1 rounded-md',
                          doubled ? 'font-black' : 'font-bold text-muted-foreground',
                        )}
                        style={
                          doubled
                            ? { color: TOUR_GOLD_FG, backgroundColor: TOUR_GOLD }
                            : undefined
                        }
                      >
                        {n || '–'}
                      </span>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyLog({ text }: { text: string }) {
  return (
    <div className="mx-4 mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
      <Flag className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
