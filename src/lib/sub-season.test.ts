/**
 * Run with: npx tsx src/lib/sub-season.test.ts
 */
import assert from 'node:assert/strict'
import {
  clampDateToRange,
  filterRevealedSubSeasons,
  isPlayedAtInSubSeasonWindow,
  isSubSeasonRevealed,
  roundsInSubSeasonWindow,
} from './sub-season'
import type { StrokeplayRound, SubSeason } from './types'

function sub(partial: Partial<SubSeason> & Pick<SubSeason, 'id' | 'status'>): SubSeason {
  return {
    season_id: 'season-1',
    name: partial.name ?? partial.id,
    start_date: partial.start_date ?? '2026-01-01',
    end_date: partial.end_date ?? '2026-03-31',
    bonus_1st: 1.5,
    bonus_2nd: 1.0,
    bonus_3rd: 0.5,
    created_at: '2026-01-01T00:00:00.000Z',
    closed_at: partial.closed_at,
    ...partial,
  }
}

{
  assert.equal(isSubSeasonRevealed(sub({ id: '1', status: 'open' })), true)
  assert.equal(
    isSubSeasonRevealed(sub({ id: '2', status: 'closed', closed_at: '2026-04-01T00:00:00.000Z' })),
    true
  )
  assert.equal(isSubSeasonRevealed(sub({ id: '3', status: 'closed' })), false)

  const visible = filterRevealedSubSeasons([
    sub({ id: '1', status: 'open' }),
    sub({ id: '2', status: 'closed' }),
    sub({ id: '3', status: 'closed', closed_at: '2026-04-01T00:00:00.000Z' }),
  ])
  assert.deepEqual(
    visible.map((s) => s.id),
    ['1', '3']
  )
}

{
  const window = { start_date: '2026-01-01', end_date: '2026-03-31' }
  assert.equal(isPlayedAtInSubSeasonWindow('2026-01-01', window), true)
  assert.equal(isPlayedAtInSubSeasonWindow('2026-03-31', window), true)
  assert.equal(isPlayedAtInSubSeasonWindow('2025-12-31', window), false)
  assert.equal(isPlayedAtInSubSeasonWindow('2026-04-01', window), false)
}

{
  const leg = sub({
    id: 'leg-1',
    status: 'open',
    start_date: '2026-01-01',
    end_date: '2026-03-31',
  })
  const rounds = [
    {
      id: 'r1',
      player_id: 'p1',
      sub_season_id: 'leg-1',
      course_name: 'A',
      played_at: '2026-02-01',
      course_handicap: 10,
      gross_score: 80,
      net_score: 70,
      present_player_ids: ['p1'],
      counts_for_ranking: true,
      created_at: '2026-02-01T00:00:00.000Z',
    },
    {
      id: 'r2',
      player_id: 'p1',
      sub_season_id: 'leg-1',
      course_name: 'B',
      played_at: '2026-04-15',
      course_handicap: 10,
      gross_score: 82,
      net_score: 72,
      present_player_ids: ['p1'],
      counts_for_ranking: true,
      created_at: '2026-04-15T00:00:00.000Z',
    },
    {
      id: 'r3',
      player_id: 'p1',
      sub_season_id: 'other',
      course_name: 'C',
      played_at: '2026-02-01',
      course_handicap: 10,
      gross_score: 84,
      net_score: 74,
      present_player_ids: ['p1'],
      counts_for_ranking: true,
      created_at: '2026-02-01T00:00:00.000Z',
    },
  ] satisfies StrokeplayRound[]

  const counting = roundsInSubSeasonWindow(rounds, leg)
  assert.deepEqual(
    counting.map((r) => r.id),
    ['r1']
  )
}

{
  assert.equal(clampDateToRange('2026-02-15', '2026-01-01', '2026-03-31'), '2026-02-15')
  assert.equal(clampDateToRange('2025-12-01', '2026-01-01', '2026-03-31'), '2026-01-01')
  assert.equal(clampDateToRange('2026-05-01', '2026-01-01', '2026-03-31'), '2026-03-31')
}

console.log('sub-season.test.ts: all assertions passed')
