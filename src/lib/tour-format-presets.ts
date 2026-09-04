/**
 * Built-in tour format templates. `scoring_rules.preset` drives match scoring.
 * Green Jacket always uses each player's own Stableford, regardless of team format.
 */
export type TourFormatPresetId =
  | 'better_ball_stableford'
  | 'mixed_par_stableford'
  | 'singles_matchplay'

export interface TourFormatPreset {
  id: TourFormatPresetId
  name: string
  description: string
  scoring_rules: Record<string, unknown>
}

export const TOUR_FORMAT_PRESETS: readonly TourFormatPreset[] = [
  {
    id: 'better_ball_stableford',
    name: 'Better ball Stableford',
    description:
      'Day 1 · fourballs, 4 pts. Best Stableford of you and your partner vs their best.',
    scoring_rules: {
      preset: 'better_ball_stableford',
      scoring: 'stableford',
      team_aggregation: 'better_ball',
      hole_win: 'higher',
      expected_matches: 4,
    },
  },
  {
    id: 'mixed_par_stableford',
    name: 'Mixed par Stableford',
    description:
      'Day 2 · fourballs, 4 pts. Par 3 add both, par 4 better ball, par 5 multiply both.',
    scoring_rules: {
      preset: 'mixed_par_stableford',
      scoring: 'stableford',
      team_aggregation: 'by_par',
      hole_win: 'higher',
      par_rules: { '3': 'sum', '4': 'better_ball', '5': 'product' },
      expected_matches: 4,
    },
  },
  {
    id: 'singles_matchplay',
    name: 'Singles matchplay',
    description: 'Day 3 · 1v1, 8 pts. Lower net wins the hole. Green Jacket still uses Stableford.',
    scoring_rules: {
      preset: 'singles_matchplay',
      scoring: 'matchplay',
      team_aggregation: 'individual',
      hole_win: 'lower_net',
      expected_matches: 8,
    },
  },
]

export function formatHasPreset(
  scoringRules: Record<string, unknown> | undefined,
  presetId: TourFormatPresetId,
): boolean {
  return scoringRules != null && scoringRules['preset'] === presetId
}
