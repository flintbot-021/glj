/**
 * Run with: npx tsx src/lib/scoring.test.ts
 */
import assert from 'node:assert/strict'
import { computeGroupStandings } from './scoring'
import type { MatchplayResult, Profile } from './types'

function fakePlayer(id: string, name: string): Profile {
  return {
    id,
    display_name: name,
    initials: name.slice(0, 2).toUpperCase(),
    email: `${id}@test.local`,
    is_admin: false,
    wallet_balance: 0,
    created_at: '2026-01-01T00:00:00.000Z',
  }
}

function result(
  partial: Pick<MatchplayResult, 'player_a_id' | 'player_b_id' | 'result'>
): MatchplayResult {
  return {
    id: `${partial.player_a_id}-${partial.player_b_id}`,
    season_id: 'season-1',
    group_id: 'group-1',
    margin: '2&1',
    course_name: 'Test',
    played_at: '2026-04-01',
    created_at: '2026-04-01T00:00:00.000Z',
    ...partial,
  }
}

const a = fakePlayer('a', 'Alice')
const b = fakePlayer('b', 'Bob')
const c = fakePlayer('c', 'Cara')
const d = fakePlayer('d', 'Dan')
const players = [a, b, c, d]
// 4-player group → 3 fixtures required

{
  // Mid-schedule: settled grudge banked but not applied; sort ignores banked GP
  const results = [
    result({ player_a_id: 'a', player_b_id: 'b', result: 'win_a' }),
    result({ player_a_id: 'a', player_b_id: 'c', result: 'win_a' }),
    result({ player_a_id: 'b', player_b_id: 'c', result: 'win_a' }),
  ]
  // Alice 2 wins = 6 MP, Bob 1 win = 3 MP, Cara 0, Dan 0
  // Alice has +3 banked grudge but only 2/3 fixtures → pending
  const standings = computeGroupStandings(
    players,
    results,
    {},
    undefined,
    { a: 3, d: 1 },
    4
  )

  const alice = standings.find((s) => s.player.id === 'a')!
  assert.equal(alice.played, 2)
  assert.equal(alice.fixtures_required, 3)
  assert.equal(alice.grudge_points_banked, 3)
  assert.equal(alice.grudge_points, 0)
  assert.equal(alice.grudge_pending, true)
  assert.equal(alice.total_points, 6)

  const dan = standings.find((s) => s.player.id === 'd')!
  assert.equal(dan.played, 0)
  assert.equal(dan.grudge_points_banked, 1)
  assert.equal(dan.grudge_pending, true)
  assert.equal(dan.total_points, 0)

  // Bob (3 MP, no grudge) still ranks above Alice's banked total of 9
  assert.equal(standings[0]!.player.id, 'a')
  assert.equal(standings[1]!.player.id, 'b')
  assert.ok(standings.findIndex((s) => s.player.id === 'd') > standings.findIndex((s) => s.player.id === 'b'))
}

{
  // Fixtures complete: banked GP applies and affects ranking
  const results = [
    result({ player_a_id: 'a', player_b_id: 'b', result: 'win_a' }),
    result({ player_a_id: 'a', player_b_id: 'c', result: 'win_b' }),
    result({ player_a_id: 'a', player_b_id: 'd', result: 'win_a' }),
    result({ player_a_id: 'b', player_b_id: 'c', result: 'win_a' }),
    result({ player_a_id: 'b', player_b_id: 'd', result: 'win_a' }),
    result({ player_a_id: 'c', player_b_id: 'd', result: 'win_a' }),
  ]
  // Alice: W vs B, L vs C, W vs D → 2W 1L = 6 MP
  // Bob: L vs A, W vs C, W vs D → 2W 1L = 6 MP
  // Cara: W vs A, L vs B, W vs D → 2W 1L = 6 MP
  // Dan: 0W = 0 MP
  // Alice +3 grudge → 9 total, should lead
  const standings = computeGroupStandings(
    players,
    results,
    {},
    undefined,
    { a: 3 },
    4
  )

  const alice = standings.find((s) => s.player.id === 'a')!
  assert.equal(alice.played, 3)
  assert.equal(alice.grudge_points_banked, 3)
  assert.equal(alice.grudge_points, 3)
  assert.equal(alice.grudge_pending, false)
  assert.equal(alice.total_points, 9)
  assert.equal(standings[0]!.player.id, 'a')
}

{
  // No banked grudge → not pending even mid-schedule
  const standings = computeGroupStandings(players, [], {}, undefined, {}, 4)
  for (const s of standings) {
    assert.equal(s.grudge_pending, false)
    assert.equal(s.grudge_points, 0)
    assert.equal(s.grudge_points_banked, 0)
    assert.equal(s.fixtures_required, 3)
  }
}

console.log('scoring.test.ts: all assertions passed')
