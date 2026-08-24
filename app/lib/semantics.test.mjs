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
