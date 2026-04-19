import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns'
import { Info, LayoutGrid, List } from 'lucide-react'
import { useBonusLeague, useSubSeasons } from '@/hooks/use-data'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatPoints, formatDate, profileDisplayName } from '@/lib/format'
import { getLadderSubSeasonId } from '@/lib/bonus-ladder'
import { STROKE_BONUS_COPY } from '@/lib/league-rules'
import type { BonusLeagueEntry, SubSeason } from '@/lib/types'
import { cn } from '@/lib/utils'

function fmtScore(n: number | undefined) {
  if (n === undefined) return '—'
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function daysLeftLabel(endDate: string): string | null {
  try {
    const end = startOfDay(parseISO(endDate))
    const today = startOfDay(new Date())
    const d = differenceInCalendarDays(end, today)
    if (d < 0) return null
    if (d === 0) return 'Ends today'
    return `${d} day${d === 1 ? '' : 's'} left`
  } catch {
    return null
  }
}

function daysUntilStartLabel(startDate: string): string | null {
  try {
    const start = startOfDay(parseISO(startDate))
    const today = startOfDay(new Date())
    const d = differenceInCalendarDays(start, today)
    if (d < 0) return null
    if (d === 0) return 'Starts today'
    return `Starts in ${d} day${d === 1 ? '' : 's'}`
  } catch {
    return null
  }
}

function periodVisual(
  sub: SubSeason,
  ladderLegId: string | undefined,
  today: string,
): { badge: 'live' | 'upcoming' | 'closed' | 'open'; badgeLabel: string } {
  // Not started yet — always upcoming, even if status is still "closed" in the DB from seeding/admin.
  if (sub.start_date > today) return { badge: 'upcoming', badgeLabel: 'UPCOMING' }
  const ended = sub.end_date < today || sub.status === 'closed'
  if (ended) return { badge: 'closed', badgeLabel: 'ENDED' }
  if (ladderLegId === sub.id) return { badge: 'live', badgeLabel: 'LIVE' }
  return { badge: 'open', badgeLabel: 'OPEN' }
}

/** Flat list + header row (group-standings style — no per-row cards or shadows). */
function BonusStandingsTable({ entries }: { entries: BonusLeagueEntry[] }) {
  if (entries.length === 0) return null
  return (
    <>
      <div className="flex items-center gap-3 border-b border-border/70 px-4 py-2">
        <span className="w-4 shrink-0" aria-hidden />
        <span className="w-8 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1" />
        <div className="flex shrink-0 items-end justify-end gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="w-8 text-center">R1</span>
          <span className="w-8 text-center">R2</span>
          <span className="w-10 text-right">Tot</span>
          <span className="w-10 text-right">Bonus</span>
        </div>
      </div>
      <div className="pb-2">
        {entries.map((entry, idx) => (
          <div
            key={entry.player.id}
            className={cn(
              'flex items-center gap-3 border-b border-border/45 px-4 py-2.5 last:border-b-0',
              idx === 0 && 'bg-muted/35',
              idx === 1 && 'bg-muted/25',
              idx === 2 && 'bg-muted/15',
            )}
          >
            <span className="w-4 shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
              {idx + 1}
            </span>
            <PlayerAvatar player={entry.player} size="sm" />
            <span className="min-w-0 flex-1 truncate pr-2 text-sm font-semibold">
              {profileDisplayName(entry.player)}
            </span>
            <div className="flex shrink-0 justify-end gap-1 tabular-nums">
              <span className="w-8 text-center text-xs text-muted-foreground">
                {fmtScore(entry.r1_net)}
              </span>
              <span className="w-8 text-center text-xs text-muted-foreground">
                {fmtScore(entry.r2_net)}
              </span>
              <span
                className="w-10 text-right text-sm font-black"
                style={{ color: 'oklch(0.91 0.19 106)' }}
              >
                {fmtScore(entry.total_net)}
              </span>
              <span
                className="w-10 text-right text-sm font-black"
                style={{
                  color:
                    entry.bonus_points > 0 ? 'oklch(0.91 0.19 106)' : 'var(--muted-foreground)',
                }}
              >
                {entry.bonus_points > 0 ? `+${formatPoints(entry.bonus_points)}` : '—'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

const STANDINGS_LAYOUT_KEY = 'glj-bonus-standings-layout'

function readStandingsLayout(): 'compact' | 'detailed' {
  try {
    return localStorage.getItem(STANDINGS_LAYOUT_KEY) === 'detailed' ? 'detailed' : 'compact'
  } catch {
    return 'compact'
  }
}

/** Chunky rows with gross + net per counting round (earlier bonus UI). */
function BonusStandingsCards({ entries }: { entries: BonusLeagueEntry[] }) {
  if (entries.length === 0) return null
  return (
    <div className="space-y-2 px-3 pb-4 pt-2">
      {entries.map((entry, idx) => (
        <div
          key={entry.player.id}
          className={cn(
            'rounded-xl border bg-background/80 px-3 py-3 shadow-none',
            idx === 0 && 'border-yellow-500/45 bg-yellow-500/[0.08]',
            idx === 1 && 'border-gray-400/35',
            idx === 2 && 'border-amber-600/40',
            idx > 2 && 'border-border/80',
          )}
        >
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black',
                idx === 0 && 'bg-yellow-500/20 text-yellow-700',
                idx === 1 && 'bg-gray-200 text-gray-700',
                idx === 2 && 'bg-amber-600/15 text-amber-800',
                idx > 2 && 'bg-muted text-muted-foreground',
              )}
            >
              {idx + 1}
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <PlayerAvatar player={entry.player} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold leading-tight">
                  {profileDisplayName(entry.player)}
                </p>
                <p className="text-[10px] text-muted-foreground">Strokeplay ladder</p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Bonus
              </p>
              <p
                className="text-base font-black tabular-nums"
                style={{
                  color:
                    entry.bonus_points > 0 ? 'oklch(0.91 0.19 106)' : 'var(--muted-foreground)',
                }}
              >
                {entry.bonus_points > 0 ? `+${formatPoints(entry.bonus_points)}` : '—'}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/70 pt-3">
            <div className="rounded-xl bg-muted/50 px-2 py-2 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                R1
              </p>
              <p className="text-sm font-semibold tabular-nums">{fmtScore(entry.r1_gross)}</p>
              <p className="text-[10px] text-muted-foreground">Net {fmtScore(entry.r1_net)}</p>
            </div>
            <div className="rounded-xl bg-muted/50 px-2 py-2 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                R2
              </p>
              <p className="text-sm font-semibold tabular-nums">{fmtScore(entry.r2_gross)}</p>
              <p className="text-[10px] text-muted-foreground">Net {fmtScore(entry.r2_net)}</p>
            </div>
            <div
              className="rounded-xl px-2 py-2 text-center"
              style={{ backgroundColor: 'oklch(0.35 0.10 160 / 0.12)' }}
            >
              <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                Total
              </p>
              <p
                className="text-lg font-black tabular-nums"
                style={{ color: 'oklch(0.35 0.10 160)' }}
              >
                {fmtScore(entry.total_net)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function BonusStandingsToolbar({
  layout,
  onLayoutChange,
}: {
  layout: 'compact' | 'detailed'
  onLayoutChange: (v: 'compact' | 'detailed') => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 pb-2 pt-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Standings · best two nets
      </p>
      <div
        className="flex shrink-0 gap-0.5 rounded-lg p-0.5"
        style={{ backgroundColor: 'oklch(0.93 0.01 160)' }}
      >
        <button
          type="button"
          onClick={() => onLayoutChange('compact')}
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-all',
            layout === 'compact'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground',
          )}
          aria-pressed={layout === 'compact'}
        >
          <List className="h-3.5 w-3.5" aria-hidden />
          List
        </button>
        <button
          type="button"
          onClick={() => onLayoutChange('detailed')}
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-all',
            layout === 'detailed'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground',
          )}
          aria-pressed={layout === 'detailed'}
        >
          <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
          Cards
        </button>
      </div>
    </div>
  )
}

function BonusStandingsSection({
  layout,
  onLayoutChange,
  filtered,
  noRounds,
}: {
  layout: 'compact' | 'detailed'
  onLayoutChange: (v: 'compact' | 'detailed') => void
  filtered: BonusLeagueEntry[]
  noRounds: BonusLeagueEntry[]
}) {
  return (
    <>
      <BonusStandingsToolbar layout={layout} onLayoutChange={onLayoutChange} />
      {layout === 'compact' ? (
        <BonusStandingsTable entries={filtered} />
      ) : (
        <BonusStandingsCards entries={filtered} />
      )}
      {noRounds.length > 0 && (
        <div className="border-t border-border/70 pb-3 pt-2">
          <p className="mb-1 px-4 text-center text-xs text-muted-foreground">
            No counting rounds for this period yet
          </p>
          {noRounds.map((entry) => (
            <div
              key={entry.player.id}
              className="flex items-center gap-3 border-b border-dashed border-border/40 px-4 py-2.5 opacity-55 last:border-b-0"
            >
              <span className="w-4 shrink-0 text-center text-xs text-muted-foreground">—</span>
              <PlayerAvatar player={entry.player} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                {profileDisplayName(entry.player)}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export function BonusLeague() {
  const [infoOpen, setInfoOpen] = useState(false)
  const [standingsLayout, setStandingsLayout] = useState<'compact' | 'detailed'>(() => readStandingsLayout())
  const { data: subSeasons } = useSubSeasons()
  const sortedSubs = useMemo(
    () =>
      [...(subSeasons ?? [])].sort((a, b) => a.start_date.localeCompare(b.start_date)),
    [subSeasons],
  )

  const ladderLegId = getLadderSubSeasonId(subSeasons)
  const initialIndex = useMemo(() => {
    const i = sortedSubs.findIndex((s) => s.id === ladderLegId)
    return i >= 0 ? i : 0
  }, [sortedSubs, ladderLegId])

  const [index, setIndex] = useState(initialIndex)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const scrollRaf = useRef<number>(0)

  useEffect(() => {
    setIndex(initialIndex)
  }, [initialIndex])

  useEffect(() => {
    try {
      localStorage.setItem(STANDINGS_LAYOUT_KEY, standingsLayout)
    } catch {
      /* ignore */
    }
  }, [standingsLayout])

  const viewedSub = sortedSubs[index]
  const { data: entries, isLoading } = useBonusLeague(viewedSub?.id ?? null)

  const today = new Date().toISOString().slice(0, 10)

  const syncIndexFromScroll = useCallback(() => {
    const el = scrollerRef.current
    if (!el || sortedSubs.length === 0) return
    const w = el.clientWidth || 1
    const i = Math.round(el.scrollLeft / w)
    setIndex(Math.min(Math.max(0, i), sortedSubs.length - 1))
  }, [sortedSubs.length])

  const onScroll = useCallback(() => {
    if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current)
    scrollRaf.current = requestAnimationFrame(syncIndexFromScroll)
  }, [syncIndexFromScroll])

  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (!el || sortedSubs.length === 0) return
    const w = el.clientWidth
    el.scrollTo({ left: initialIndex * w, behavior: 'auto' })
  }, [initialIndex, sortedSubs.length])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onEnd = () => syncIndexFromScroll()
    el.addEventListener('scrollend', onEnd)
    return () => el.removeEventListener('scrollend', onEnd)
  }, [syncIndexFromScroll])

  if (isLoading && !entries) {
    return (
      <div className="space-y-2 px-4">
        {[0, 1, 2, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    )
  }

  const filtered = entries?.filter((e) => e.total_net !== undefined) ?? []
  const noRounds = entries?.filter((e) => e.total_net === undefined) ?? []

  const isViewingLiveLeg = viewedSub != null && ladderLegId === viewedSub.id

  return (
    <div className="space-y-4">
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold">Stroke play bonus</DialogTitle>
            <DialogDescription className="text-left text-sm leading-relaxed text-foreground/90">
              {STROKE_BONUS_COPY}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {!ladderLegId && (
        <div className="mx-4 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          No open scoring period right now — standings below will fill when the next one opens.
        </div>
      )}

      {sortedSubs.length > 0 && (
        <div className="mx-4 overflow-hidden rounded-xl border border-border/90 bg-card shadow-none">
          {/* Green strip + dots: same radius, stroke, and type scale as group-standings cards. */}
          <div
            className="rounded-t-xl border-b"
            style={{
              backgroundColor: 'oklch(0.29 0.072 160)',
              borderBottomColor: 'oklch(0.36 0.06 160)',
            }}
          >
            <div
              ref={scrollerRef}
              onScroll={onScroll}
              className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide"
            >
              {sortedSubs.map((sub) => {
                const vis = periodVisual(sub, ladderLegId, today)
                const days = daysLeftLabel(sub.end_date)
                const isLiveCard = vis.badge === 'live'

                return (
                  <div key={sub.id} className="min-w-full shrink-0 snap-center">
                    <div className={cn('transition-opacity', !isLiveCard && 'opacity-[0.92]')}>
                      {/* Match group-standings: header row + label row, same border and type scale. */}
                      <div
                        className="flex items-center gap-2 px-4 py-3"
                        style={{ borderBottom: '1px solid oklch(0.36 0.06 160)' }}
                      >
                        <h3 className="min-w-0 flex-1 text-sm font-bold uppercase tracking-wider text-white/80">
                          {sub.name}
                        </h3>
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-2 gap-y-1">
                          <Badge
                            className={cn(
                              'border-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                              vis.badge === 'live' && 'text-[oklch(0.20_0.07_150)]',
                              vis.badge === 'upcoming' && 'bg-white/20 text-white',
                              vis.badge === 'closed' && 'bg-black/25 text-white/90',
                              vis.badge === 'open' && 'bg-white/20 text-white',
                            )}
                            style={
                              vis.badge === 'live'
                                ? { backgroundColor: 'oklch(0.91 0.19 106)' }
                                : undefined
                            }
                          >
                            {vis.badgeLabel}
                          </Badge>
                          <span className="max-w-[11rem] text-right text-[10px] font-medium leading-tight text-white/50 sm:max-w-none">
                            {vis.badge === 'upcoming'
                              ? (daysUntilStartLabel(sub.start_date) ??
                                `Opens ${formatDate(sub.start_date, 'MMM d, yyyy')}`)
                              : days
                                ? days
                                : vis.badge === 'closed'
                                  ? `Ended ${formatDate(sub.end_date, 'MMM d, yyyy')}`
                                  : '—'}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="h-8 w-8 shrink-0 text-white/50 hover:bg-white/10 hover:text-white"
                            aria-label="About stroke play bonus"
                            onClick={() => setInfoOpen(true)}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-6 px-4 pt-2 pb-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                            Starts
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-white">
                            {formatDate(sub.start_date, 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                            Ends
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-white">
                            {formatDate(sub.end_date, 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {sortedSubs.length > 1 && (
              <div className="flex justify-center gap-1.5 px-4 pb-3 pt-1">
                {sortedSubs.map((sub, i) => (
                  <button
                    key={sub.id}
                    type="button"
                    aria-label={`Show ${sub.name}`}
                    onClick={() => {
                      const el = scrollerRef.current
                      if (!el) return
                      el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
                      setIndex(i)
                    }}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i === index ? 16 : 6,
                      backgroundColor:
                        i === index ? 'oklch(0.91 0.19 106)' : 'oklch(0.70 0 0)',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {viewedSub && !isViewingLiveLeg && ladderLegId && (
            <p className="border-b border-border/70 bg-muted/25 px-4 py-2.5 text-center text-[11px] text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{viewedSub.name}</span>. Rounds
              you enter now count toward{' '}
              <span className="font-semibold text-foreground">
                {sortedSubs.find((s) => s.id === ladderLegId)?.name ?? 'the live period'}
              </span>
              .
            </p>
          )}

          <BonusStandingsSection
            layout={standingsLayout}
            onLayoutChange={setStandingsLayout}
            filtered={filtered}
            noRounds={noRounds}
          />
        </div>
      )}

      {sortedSubs.length === 0 && (
        <div className="mx-4 overflow-hidden rounded-xl border border-border/90 bg-card shadow-none">
          <BonusStandingsSection
            layout={standingsLayout}
            onLayoutChange={setStandingsLayout}
            filtered={filtered}
            noRounds={noRounds}
          />
        </div>
      )}
    </div>
  )
}
