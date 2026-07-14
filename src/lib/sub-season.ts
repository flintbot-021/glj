import type { StrokeplayRound, SubSeason } from '@/lib/types'

/** Open sub-season whose dates include today, else first open leg still marked open. */
export function getActiveOpenSubSeason(subSeasons: SubSeason[] | undefined): SubSeason | undefined {
  if (!subSeasons?.length) return undefined
  const open = subSeasons.filter((s) => s.status === 'open')
  if (open.length === 0) return undefined
  const today = new Date().toISOString().slice(0, 10)
  const inWindow = open.find((s) => s.start_date <= today && s.end_date >= today)
  return inWindow ?? open[0]
}

/**
 * A leg is visible once it has been opened (`status === 'open'`) or closed after
 * being open (`closed_at` set). Seeded future legs stay hidden until opened.
 */
export function isSubSeasonRevealed(sub: SubSeason): boolean {
  return sub.status === 'open' || sub.closed_at != null
}

export function filterRevealedSubSeasons(subSeasons: SubSeason[] | undefined): SubSeason[] {
  return (subSeasons ?? []).filter(isSubSeasonRevealed)
}

/** Whether `played_at` (YYYY-MM-DD) falls in the leg’s inclusive date window. */
export function isPlayedAtInSubSeasonWindow(
  playedAt: string,
  sub: Pick<SubSeason, 'start_date' | 'end_date'>
): boolean {
  return playedAt >= sub.start_date && playedAt <= sub.end_date
}

/** Rounds for this leg that fall inside its date window. */
export function roundsInSubSeasonWindow(
  rounds: StrokeplayRound[],
  sub: Pick<SubSeason, 'id' | 'start_date' | 'end_date'>
): StrokeplayRound[] {
  return rounds.filter(
    (r) => r.sub_season_id === sub.id && isPlayedAtInSubSeasonWindow(r.played_at, sub)
  )
}

/** Clamp a YYYY-MM-DD date into [min, max] (inclusive). */
export function clampDateToRange(date: string, min: string, max: string): string {
  if (date < min) return min
  if (date > max) return max
  return date
}
