/**
 * Run with: npx tsx src/lib/tour-scrapbook.test.ts
 */
import assert from 'node:assert/strict'
import { promptForHole, scrapPromptPlan } from './tour-scrapbook'

const plan = scrapPromptPlan('80a2b861-86b8-4380-b37a-8e180a189f24')
assert.equal(plan.length, 3)
assert.equal(plan[0]!.source, 'people')
assert.equal(plan[1]!.source, 'scene')
assert.equal(plan[2]!.source, 'detail')
assert.ok(plan[0]!.hole >= 1 && plan[0]!.hole <= 6)
assert.ok(plan[1]!.hole >= 7 && plan[1]!.hole <= 12)
assert.ok(plan[2]!.hole >= 13 && plan[2]!.hole <= 18)
assert.equal(scrapPromptPlan('80a2b861-86b8-4380-b37a-8e180a189f24')[1]!.hole, plan[1]!.hole)
assert.equal(promptForHole(plan, plan[1]!.hole)?.source, 'scene')
assert.equal(promptForHole(plan, 99), null)

const other = scrapPromptPlan('match-other')
assert.equal(new Set(other.map((p) => p.hole)).size, 3)

console.log('tour-scrapbook.test.ts ok')
