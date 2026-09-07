/**
 * Run with: npx tsx src/lib/playoff-draw.test.ts
 */
import assert from 'node:assert/strict'
import {
  drawComplete,
  emptySlots,
  fieldIsValid,
  pickRandom,
  qualifierIdsFromGroupLeaders,
  remainingPlayers,
  type PlayoffEntry,
} from './playoff-draw'

function entry(player: string, slot: PlayoffEntry['slot_key'] = null): PlayoffEntry {
  return {
    id: player,
    draw_id: 'd',
    player_id: player,
    slot_key: slot,
    drawn_at: slot ? 'now' : null,
  }
}

const emptyEight: PlayoffEntry[] = [
  entry('a'),
  entry('b'),
  entry('c'),
  entry('d'),
  entry('e'),
  entry('f'),
  entry('g'),
  entry('h'),
]

assert.equal(fieldIsValid(emptyEight.map((e) => e.player_id)), null)
assert.equal(fieldIsValid(emptyEight.slice(0, 7).map((e) => e.player_id)), 'Pick exactly eight players.')
assert.equal(emptySlots(emptyEight).length, 8)
assert.equal(remainingPlayers(emptyEight).length, 8)

const afterA: PlayoffEntry[] = emptyEight.map((e) =>
  e.player_id === 'a' ? { ...e, slot_key: 'qf1_a' } : e,
)
assert.equal(emptySlots(afterA).length, 7)
assert.ok(!emptySlots(afterA).some((s) => s.key === 'qf1_a'))

assert.equal(pickRandom([1], () => 0), 1)
assert.equal(pickRandom([]), null)
assert.equal(drawComplete(afterA), false)

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function simulateFullDraw(seed: number) {
  const rand = mulberry32(seed)
  let entries = emptyEight.map((e) => ({ ...e }))
  for (let i = 0; i < 8; i++) {
    const rem = remainingPlayers(entries)
    const p = pickRandom(rem, rand)
    assert.ok(p, `no remaining player at ${i} seed ${seed}`)
    const legal = emptySlots(entries)
    assert.ok(legal.length > 0, `deadlock at pick ${i} seed ${seed}`)
    const slot = pickRandom(legal, rand)
    assert.ok(slot)
    entries = entries.map((e) => (e.player_id === p.player_id ? { ...e, slot_key: slot.key } : e))
  }
  assert.equal(drawComplete(entries), true)
}

for (let s = 0; s < 80; s++) simulateFullDraw(s)

assert.deepEqual(
  qualifierIdsFromGroupLeaders([
    { topIds: ['a', 'b'] },
    { topIds: ['c', 'd'] },
    { topIds: ['e', 'f'] },
    { topIds: ['g', 'h'] },
  ]),
  ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
)

console.log('playoff-draw.test.ts ok')
