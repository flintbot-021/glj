/**
 * Road To Dias — league rules (PRD / season brief).
 * Used for defaults, UI copy, and scoring helpers (live data comes from Supabase).
 */

/** Match play within each RTD group (per result, excluding bonus). */
export const MATCH_PLAY_POINTS = {
  win: 3,
  draw: 1,
  loss: 0,
} as const

/** Stroke play bonus league — top 3 in each bonus sub-season (same as `sub_seasons.bonus_*` defaults). */
export const STROKE_BONUS_POINTS = {
  first: 1.5,
  second: 1,
  third: 0.5,
} as const

/** RTD 2026 bonus “legs” / schedule (stroke play ladder). Names and windows from season brief. */
export const BONUS_SUB_SEASON_SCHEDULE_2026 = [
  {
    order: 1,
    label: 'Season 1',
    name: 'Season Opener',
    startDate: '2026-03-04',
    endDate: '2026-05-07',
  },
  {
    order: 2,
    label: 'Season 2',
    name: 'Winter Grind',
    startDate: '2026-05-08',
    endDate: '2026-07-10',
  },
  {
    order: 3,
    label: 'Season 3',
    name: 'Home Stretch',
    startDate: '2026-07-11',
    endDate: '2026-09-13',
  },
] as const

/** Group stage → knockout (PRD “What Has Changed”). */
export const TOURNAMENT_STRUCTURE = {
  totalPlayers: 17,
  groupsSummary: 'Three groups of four and one group of five',
  groupMatchesPerPlayer: 3,
  knockoutFromEachGroup: 2,
  knockoutRounds: ['Quarter-finals', 'Semi-finals', 'Final'] as const,
  knockoutPairingNote: 'Fresh draw for the knockout (not fixed bracket by group position).',
} as const

/** Stroke play bonus — eligibility blurb for UI. */
export const STROKE_BONUS_COPY =
  'The stroke play bonus league runs across three seasons. Log any round that included another tour member. Top three in each season earn bonus points toward the main standings.'

/** Match play blurb for UI. */
export const MATCH_PLAY_COPY =
  'Points are awarded for every match played within your group: win, draw or loss — accumulate points to reach the knockout rounds.'
