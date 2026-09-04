import type { TourTeam } from './types'

export const TEAM_BLUE = 'oklch(0.42 0.15 260)'
export const TEAM_RED = 'oklch(0.50 0.21 26)'
export const TOUR_GREEN = 'oklch(0.22 0.068 157)'
export const TOUR_GOLD = 'oklch(0.80 0.14 72)'
export const TOUR_GOLD_FG = 'oklch(0.18 0.06 60)'

export function teamColor(team: TourTeam): string {
  return team === '93s' ? TEAM_BLUE : TEAM_RED
}

/** Thursday 10:00 next week from 4 Sep 2026 = 10 Sep 2026 10:00 SAST. */
export const DEFAULT_CHAMPS_DEADLINE = '2026-09-10T08:00:00.000Z'

export function champsDeadlineIso(deadline?: string | null): string {
  return deadline || DEFAULT_CHAMPS_DEADLINE
}

export function champsPicksLocked(deadline?: string | null, now = Date.now()): boolean {
  return now >= Date.parse(champsDeadlineIso(deadline))
}
