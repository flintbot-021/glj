/**
 * Run with: npx tsx src/lib/tour-preview.test.ts
 */
import assert from 'node:assert/strict'
import { canSeeTour, TOUR_PUBLIC_AT_MS } from './tour-preview'

const before = TOUR_PUBLIC_AT_MS - 1
const after = TOUR_PUBLIC_AT_MS

assert.equal(canSeeTour('kdbar17@gmail.com', before), true)
assert.equal(canSeeTour('KDBAR17@GMAIL.COM', before), true)
assert.equal(canSeeTour('someone@else.com', before), false)
assert.equal(canSeeTour(undefined, before), false)
assert.equal(canSeeTour('someone@else.com', after), true)
assert.equal(canSeeTour(undefined, after), true)
console.log('tour-preview tests passed')
