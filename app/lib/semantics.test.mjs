import test from 'node:test'
import assert from 'node:assert/strict'
import {
  difficultyToken, driveBand, DRIVE_INK, enumerateDistances, verdictFor, LEVELS, LEVEL_ORDER,
} from './semantics.js'

test('difficultyToken maps all six levels + unrated', () => {
  assert.equal(difficultyToken('Easy').bg, '#ADE3BF')
  assert.equal(difficultyToken('Brutal').ink, '#F3E2E1')
  assert.equal(difficultyToken(null).bg, '#F1F4F6')
  assert.equal(difficultyToken('nonsense').bg, '#F1F4F6')
  assert.equal(LEVEL_ORDER.length, 6)
  assert.equal(Object.keys(LEVELS).length, 6)
})

test('driveBand: green only under 60, ink scale after', () => {
  assert.equal(driveBand(45), 'near')
  assert.equal(driveBand(60), 'near')
  assert.equal(driveBand(61), 'mid')
  assert.equal(driveBand(120), 'mid')
  assert.equal(driveBand(121), 'far')
  assert.equal(driveBand(null), null)
  assert.equal(DRIVE_INK.near, '#04884D')
})

test('enumerateDistances sorts, dedupes, enumerates — never a range', () => {
  assert.equal(enumerateDistances([{ km: 42 }, { km: 5 }, { km: 21 }, { km: 21 }]), '5 · 21 · 42 km')
  assert.equal(enumerateDistances([{ km: 11.5 }]), '11.5 km')
  assert.equal(enumerateDistances([]), null)
  assert.equal(enumerateDistances(null), null)
})

test('verdictFor: editorial when the taste layer has one, null otherwise (no generated prose)', () => {
  const race = { taste: { editorial: [{ key: 'unique', value: 'The benchmark 100k', strengthLabel: 'Our read' }] } }
  assert.deepEqual(verdictFor(race), { text: 'The benchmark 100k', label: 'Our read' })
  assert.equal(verdictFor({ taste: { editorial: [] } }), null)
  assert.equal(verdictFor({}), null)
  assert.equal(verdictFor({ taste: { editorial: [{ key: 'unique', value: '' }] } }), null)
})

test('climbSummary: complete-data-only maximum, partial data says so (Codex P1-1)', async () => {
  const { climbSummary } = await import('./semantics.js')
  assert.equal(climbSummary([{ km: 12, elevationGain: 500 }, { km: 6, elevationGain: 200 }]), 'up to 500 D+')
  assert.equal(climbSummary([{ km: 15, elevationGain: 509 }, { km: 7 }]), 'climb not fully published')
  assert.equal(climbSummary([{ km: 11 }, { km: 6 }]), 'climb not published')
  assert.equal(climbSummary([]), null)
  assert.equal(climbSummary(null), null)
})

test('nextTwoWeekendWindows: Fri–Sun windows, two of them, current weekend included (Codex P2-4)', async () => {
  const { nextTwoWeekendWindows, inAnyWindow } = await import('./semantics.js')
  // 2026-08-25 is a Tuesday → weekends: Fri 28–Sun 30 Aug, Fri 04–Sun 06 Sep
  assert.deepEqual(nextTwoWeekendWindows('2026-08-25'), [
    ['2026-08-28', '2026-08-30'],
    ['2026-09-04', '2026-09-06'],
  ])
  // A Saturday: the in-progress weekend counts as the first window
  assert.deepEqual(nextTwoWeekendWindows('2026-08-29'), [
    ['2026-08-28', '2026-08-30'],
    ['2026-09-04', '2026-09-06'],
  ])
  // A Sunday: still inside weekend 1
  assert.deepEqual(nextTwoWeekendWindows('2026-08-30')[0], ['2026-08-28', '2026-08-30'])
  const windows = nextTwoWeekendWindows('2026-08-25')
  assert.equal(inAnyWindow('2026-08-29', null, windows), true)   // Saturday race
  assert.equal(inAnyWindow('2026-09-04', null, windows), true)   // Friday night race
  assert.equal(inAnyWindow('2026-09-01', null, windows), false)  // Tuesday race
  assert.equal(inAnyWindow('2026-08-25', '2026-08-29', windows), true) // multi-day overlaps
  assert.equal(inAnyWindow(null, null, windows), false)
})
