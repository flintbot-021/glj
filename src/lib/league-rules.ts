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

/** Season-wide grudge matches (outside your group). */
export const GRUDGE_MATCH_POINTS = {
  challengerWin: 3,
  challengedWin: 1,
  draw: 1,
} as const

export const GRUDGE_MATCH_LIMITS = {
  maxIssued: 1,
  maxReceived: 3,
} as const

export const GRUDGE_MATCH_COPY =
  'Challenge one player outside your group — the match opens immediately. Either of you records the result; the other confirms once. You may issue 1 challenge and receive up to 3. Win as challenger: +3. Win as challenged: +1. Halve: +1 each. Settled points bank on the group table and count toward Pts only after you have played all your group games.'

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
  'The stroke play bonus league runs across three seasons. Log any round that included another tour member. You need at least two rounds in each period to appear on the ladder; your best two nets count. Top three in each period earn bonus points toward the main standings.'

/** Match play blurb for UI. */
export const MATCH_PLAY_COPY =
  'Points are awarded for every match played within your group: win, draw or loss — accumulate points to reach the knockout rounds.'
