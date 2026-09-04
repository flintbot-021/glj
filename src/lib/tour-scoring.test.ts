/**
 * Run with: npx tsx src/lib/tour-scoring.test.ts
 */
import assert from 'node:assert/strict'
import {
  aggregationFromFormat,
  champsEntryPoints,
  canFillRankBudget,
  champsRankSum,
  computeMatchPlay,
  holeWinner,
  matchFormatFromRules,
  sideStableford,
} from './tour-scoring'
import type { TourHoleScore } from './types'

function score(player: string, hole: number, pts: number, net = 4): TourHoleScore {
  return {
    id: `${player}-${hole}`,
    match_id: 'm1',
    tour_player_id: player,
    hole_number: hole,
    gross_score: 4,
    net_score: net,
    stableford_points: pts,
    created_at: '2026-09-04T00:00:00.000Z',
  }
}

assert.equal(sideStableford([3, 1], 'better_ball'), 3)
assert.equal(sideStableford([2, 2], 'individual'), 4)
assert.equal(holeWinner(3, 2), 'a')
assert.equal(holeWinner(2, 2), 'half')
assert.equal(aggregationFromFormat({ scoring_rules: { preset: 'singles_stableford' } }), 'individual')
assert.equal(matchFormatFromRules({ preset: 'mixed_par_stableford' }).agg, 'by_par')
assert.equal(matchFormatFromRules({ preset: 'singles_matchplay' }).compare, 'lower_net')
assert.equal(holeWinner(3, 5, 'lower_net'), 'a')

const betterBall = matchFormatFromRules({ preset: 'better_ball_stableford' })
const mixedPar = matchFormatFromRules({ preset: 'mixed_par_stableford' })
const singlesMp = matchFormatFromRules({ preset: 'singles_matchplay' })

{
  // 93s (a0,a1) vs 91s (b0) — better ball, 93s win hole 1, 91s hole 2, half hole 3
  const scores = [
    score('a0', 1, 3),
    score('a1', 1, 1),
    score('b0', 1, 2),
    score('a0', 2, 1),
    score('a1', 2, 1),
    score('b0', 2, 3),
    score('a0', 3, 2),
    score('a1', 3, 2),
    score('b0', 3, 2),
  ]
  const m = computeMatchPlay(scores, ['a0', 'a1'], ['b0'], '93s', '91s', betterBall)
  assert.equal(m.holes[0]!.winnerTeam, '93s')
  assert.equal(m.holes[1]!.winnerTeam, '91s')
  assert.equal(m.holes[2]!.winnerTeam, 'half')
  assert.equal(m.aWins, 1)
  assert.equal(m.bWins, 1)
  assert.equal(m.statusLabel, 'AS')
  assert.equal(m.closed, false)
  assert.equal(m.points93, 0)
}

{
  // Close it: 93s win holes 1–10, 91s none → 10&8
  const scores: TourHoleScore[] = []
  for (let h = 1; h <= 10; h++) {
    scores.push(score('a0', h, 3), score('b0', h, 1))
  }
  const m = computeMatchPlay(scores, ['a0'], ['b0'], '93s', '91s', matchFormatFromRules({ preset: 'singles_stableford' }))
  assert.equal(m.closed, true)
  assert.equal(m.points93, 1)
  assert.equal(m.points91, 0)
  assert.equal(m.statusLabel, '93s 10&8')
}

{
  // Mixed par: hole 1 par 5 product 2×3=6 vs 4×1=4 → 93s; hole 2 par 3 sum 1+1=2 vs 2+2=4 → 91s; hole 3 par 4 better ball 3 vs 3 half
  const scores = [
    score('a0', 1, 2),
    score('a1', 1, 3),
    score('b0', 1, 4),
    score('b1', 1, 1),
    score('a0', 2, 1),
    score('a1', 2, 1),
    score('b0', 2, 2),
    score('b1', 2, 2),
    score('a0', 3, 3),
    score('a1', 3, 1),
    score('b0', 3, 2),
    score('b1', 3, 3),
  ]
  const pars = [
    { hole_number: 1, par: 5 },
    { hole_number: 2, par: 3 },
    { hole_number: 3, par: 4 },
  ]
  const m = computeMatchPlay(scores, ['a0', 'a1'], ['b0', 'b1'], '93s', '91s', mixedPar, pars)
  assert.equal(m.holes[0]!.aPoints, 6)
  assert.equal(m.holes[0]!.winnerTeam, '93s')
  assert.equal(m.holes[1]!.bPoints, 4)
  assert.equal(m.holes[1]!.winnerTeam, '91s')
  assert.equal(m.holes[2]!.aPoints, 3)
  assert.equal(m.holes[2]!.winnerTeam, 'half')
}

{
  // Singles matchplay: lower net wins. a net 3 vs b net 5 on hole 1
  const scores = [score('a0', 1, 2, 3), score('b0', 1, 4, 5)]
  const m = computeMatchPlay(scores, ['a0'], ['b0'], '93s', '91s', singlesMp)
  assert.equal(m.holes[0]!.aPoints, 3)
  assert.equal(m.holes[0]!.winnerTeam, '93s')
}

{
  const byDay = new Map<string, number>([
    ['p1:1', 10],
    ['p1:2', 8],
    ['p2:1', 5],
    ['p3:1', 4],
    ['p4:1', 3],
  ])
  // four picks, captain p1 day 1 → 10+8+5+4+3 + extra 10
  assert.equal(champsEntryPoints(['p1', 'p2', 'p3', 'p4'], 'p1', 1, byDay), 40)
}

{
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
  assert.equal(canFillRankBudget([], pool), true)
  assert.equal(champsRankSum([1, 8, 9, 14]), 32)
  assert.equal(canFillRankBudget([1, 8, 9], pool.filter((n) => ![1, 8, 9].includes(n))), true)
  assert.equal(canFillRankBudget([1, 2, 3], pool.filter((n) => ![1, 2, 3].includes(n))), false)
  assert.equal(canFillRankBudget([16], pool.filter((n) => n !== 16)), true)
  assert.equal(canFillRankBudget([1, 8, 9, 14], []), true)
  assert.equal(canFillRankBudget([1, 8, 9, 15], []), true)
  assert.equal(canFillRankBudget([1, 2, 3, 16], []), false)
}

console.log('tour-scoring.test.ts ok')
