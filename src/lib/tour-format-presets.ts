/**
 * Built-in tour format templates. `scoring_rules.preset` identifies the template for future scoring logic.
 */
export type TourFormatPresetId = 'better_ball_stableford' | 'singles_stableford'

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
      'Fourball: each hole uses the better Stableford result from the two partners on a side (best ball / better ball).',
    scoring_rules: {
      preset: 'better_ball_stableford',
      scoring: 'stableford',
      team_aggregation: 'better_ball',
    },
  },
  {
    id: 'singles_stableford',
    name: 'Singles Stableford',
    description: 'Each player earns their own Stableford points; no better ball within the partnership.',
    scoring_rules: {
      preset: 'singles_stableford',
      scoring: 'stableford',
      team_aggregation: 'individual',
    },
  },
]

export function formatHasPreset(
  scoringRules: Record<string, unknown> | undefined,
  presetId: TourFormatPresetId
): boolean {
  return scoringRules != null && scoringRules['preset'] === presetId
}
