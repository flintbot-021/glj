/**
 * Run with: npx tsx src/lib/bonus-ladder.test.ts
 */
import assert from 'node:assert/strict'
import {
  applyTieOrder,
  buildPodiumPlan,
  groupEligibleByCombinedNet,
  type BonusLegRankRow,
} from './bonus-ladder'
import type { Profile } from './types'

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

function row(
  id: string,
  name: string,
  combined: number,
  best = combined / 2,
  second = combined / 2
): BonusLegRankRow {
  return {
    player: fakePlayer(id, name),
    best_net: best,
    second_net: second,
    combined_net: combined,
  }
}

const PTS: [number, number, number] = [1.5, 1.0, 0.5]

// ─── groupEligibleByCombinedNet ───────────────────────────────────────────────

{
  const ranked = [
    row('a', 'A', 70),
    row('b', 'B', 70),
    row('c', 'C', 72),
    row('d', 'D', Number.POSITIVE_INFINITY),
  ]
  const groups = groupEligibleByCombinedNet(ranked)
  assert.equal(groups.length, 2)
  assert.deepEqual(
    groups[0]!.map((r) => r.player.id),
    ['a', 'b']
  )
  assert.deepEqual(
    groups[1]!.map((r) => r.player.id),
    ['c']
  )
}

// ─── no ties ──────────────────────────────────────────────────────────────────

{
  const ranked = [row('a', 'A', 68), row('b', 'B', 70), row('c', 'C', 72), row('d', 'D', 74)]
  const plan = buildPodiumPlan(ranked, PTS)
  assert.equal(plan.contests.length, 0)
  assert.equal(plan.unresolvedContests.length, 0)
  assert.deepEqual(
    plan.awards.map((a) => [a.position, a.player_id, a.points_awarded]),
    [
      [1, 'a', 1.5],
      [2, 'b', 1.0],
      [3, 'c', 0.5],
    ]
  )
}

// ─── 2-way tie for 1st ────────────────────────────────────────────────────────

{
  const ranked = [row('a', 'A', 70), row('b', 'B', 70), row('c', 'C', 72)]
  const plan = buildPodiumPlan(ranked, PTS)
  assert.equal(plan.contests.length, 1)
  assert.equal(plan.unresolvedContests.length, 1)
  assert.deepEqual(plan.unresolvedContests[0]!.positions, [1, 2])
  assert.deepEqual(
    plan.unresolvedContests[0]!.players.map((p) => p.player.id),
    ['a', 'b']
  )
  // Clear 3rd is already awarded
  assert.deepEqual(
    plan.awards.map((a) => [a.position, a.player_id]),
    [[3, 'c']]
  )

  const contest = plan.contests[0]!
  const resolved = buildPodiumPlan(ranked, PTS, { [contest.id]: ['b', 'a'] })
  assert.equal(resolved.unresolvedContests.length, 0)
  assert.deepEqual(
    resolved.awards.map((a) => [a.position, a.player_id, a.points_awarded]),
    [
      [1, 'b', 1.5],
      [2, 'a', 1.0],
      [3, 'c', 0.5],
    ]
  )
}

// ─── 2-way tie for 2nd (clear 1st) ─────────────────────────────────────────────

{
  const ranked = [row('a', 'A', 68), row('b', 'B', 70), row('c', 'C', 70), row('d', 'D', 74)]
  const plan = buildPodiumPlan(ranked, PTS)
  assert.equal(plan.contests.length, 1)
  assert.deepEqual(plan.contests[0]!.positions, [2, 3])
  assert.deepEqual(
    plan.awards.map((a) => [a.position, a.player_id]),
    [[1, 'a']]
  )

  const contest = plan.contests[0]!
  const resolved = buildPodiumPlan(ranked, PTS, { [contest.id]: ['c', 'b'] })
  assert.deepEqual(
    resolved.awards.map((a) => [a.position, a.player_id]),
    [
      [1, 'a'],
      [2, 'c'],
      [3, 'b'],
    ]
  )
}

// ─── 3-way tie for 1st ─────────────────────────────────────────────────────────

{
  const ranked = [row('a', 'A', 70), row('b', 'B', 70), row('c', 'C', 70), row('d', 'D', 80)]
  const plan = buildPodiumPlan(ranked, PTS)
  assert.equal(plan.contests.length, 1)
  assert.deepEqual(plan.contests[0]!.positions, [1, 2, 3])
  assert.equal(plan.awards.length, 0)

  const contest = plan.contests[0]!
  const awards = applyTieOrder(contest, ['c', 'a', 'b'], PTS)
  assert.deepEqual(
    awards.map((a) => [a.position, a.player_id, a.points_awarded]),
    [
      [1, 'c', 1.5],
      [2, 'a', 1.0],
      [3, 'b', 0.5],
    ]
  )
}

// ─── 4-way tie: only 3 podium slots ───────────────────────────────────────────

{
  const ranked = [
    row('a', 'A', 70),
    row('b', 'B', 70),
    row('c', 'C', 70),
    row('d', 'D', 70),
  ]
  const plan = buildPodiumPlan(ranked, PTS)
  assert.deepEqual(plan.contests[0]!.positions, [1, 2, 3])
  assert.equal(plan.contests[0]!.players.length, 4)

  const contest = plan.contests[0]!
  const awards = applyTieOrder(contest, ['d', 'b', 'a', 'c'], PTS)
  assert.equal(awards.length, 3)
  assert.deepEqual(
    awards.map((a) => a.player_id),
    ['d', 'b', 'a']
  )
}

// ─── 2-way tie for 3rd only ───────────────────────────────────────────────────

{
  const ranked = [row('a', 'A', 68), row('b', 'B', 69), row('c', 'C', 70), row('d', 'D', 70)]
  const plan = buildPodiumPlan(ranked, PTS)
  assert.equal(plan.contests.length, 1)
  assert.deepEqual(plan.contests[0]!.positions, [3])
  assert.deepEqual(
    plan.awards.map((a) => [a.position, a.player_id]),
    [
      [1, 'a'],
      [2, 'b'],
    ]
  )

  const contest = plan.contests[0]!
  const resolved = buildPodiumPlan(ranked, PTS, { [contest.id]: ['d', 'c'] })
  assert.deepEqual(
    resolved.awards.map((a) => [a.position, a.player_id]),
    [
      [1, 'a'],
      [2, 'b'],
      [3, 'd'],
    ]
  )
}

console.log('bonus-ladder.test.ts: all assertions passed')
