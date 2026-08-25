// Tests for the multi-select filter logic. Covers the URL round-trip (arrays
// serialize/parse and drop junk) and the OR-within-row matchers.
// Run: node --test app/lib/filters.test.mjs

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_FILTERS, toggleValue,
  filtersFromParams, filtersToParams,
  matchesDrive, matchesDistance, matchesElevation, matchesMonth, matchesProvince,
} from './filters.js'

// --- toggleValue ---

test('toggleValue: adds when absent, removes when present', () => {
  assert.deepEqual(toggleValue([], '10-15'), ['10-15'])
  assert.deepEqual(toggleValue(['10-15'], '15-21'), ['10-15', '15-21'])
  assert.deepEqual(toggleValue(['10-15', '15-21'], '10-15'), ['15-21'])
})

test('toggleValue: does not mutate the input array', () => {
  const before = ['10-15']
  toggleValue(before, '15-21')
  assert.deepEqual(before, ['10-15'])
})

// --- URL round-trip ---

const sp = (obj) => new URLSearchParams(obj)

test('filtersFromParams: empty params → all-empty defaults', () => {
  assert.deepEqual(filtersFromParams(sp({})), DEFAULT_FILTERS)
})

test('filtersFromParams: comma list parses to array', () => {
  const f = filtersFromParams(sp({ dist: '10-15,15-21' }))
  assert.deepEqual(f.distance, ['10-15', '15-21'])
})

test('filtersFromParams: invalid buckets are dropped', () => {
  const f = filtersFromParams(sp({ dist: '10-15,bogus,999' }))
  assert.deepEqual(f.distance, ['10-15'])
})

test('filtersFromParams: legacy single-value (no-comma) links still restore', () => {
  // Old single-select URLs predate the comma format — they must keep working.
  const f = filtersFromParams(sp({ dist: '10-15', prov: 'GIRONA', drive: 'u60', month: '05' }))
  assert.deepEqual(f.distance, ['10-15'])
  assert.deepEqual(f.province, ['GIRONA'])
  assert.deepEqual(f.drive, ['u60'])
  assert.deepEqual(f.month, ['05'])
})

test('filtersFromParams: junk-only / whitespace / empty params → empty array', () => {
  assert.deepEqual(filtersFromParams(sp({ dist: 'bogus,999' })).distance, [])
  assert.deepEqual(filtersFromParams(sp({ dist: ',,,' })).distance, [])
  assert.deepEqual(filtersFromParams(sp({ dist: '' })).distance, [])
  assert.deepEqual(filtersFromParams(sp({ dist: ' 10-15 ' })).distance, []) // padded ≠ valid token
})

test('filtersFromParams: order is canonical, not URL order, and deduped', () => {
  const f = filtersFromParams(sp({ dist: '42+,10-15,10-15' }))
  assert.deepEqual(f.distance, ['10-15', '42+'])
})

test('filtersToParams: multi-value row serializes comma-joined', () => {
  const qs = filtersToParams({ ...DEFAULT_FILTERS, distance: ['10-15', '15-21'] })
  assert.equal(qs, 'dist=10-15%2C15-21')
})

test('round-trip: params → filters → params is stable', () => {
  const original = { ...DEFAULT_FILTERS, drive: ['u60'], distance: ['10-15', '21-42'], month: ['05', '06'], kidsRun: true }
  const qs = filtersToParams(original)
  const back = filtersFromParams(new URLSearchParams(qs))
  assert.deepEqual(back, original)
})

test('filtersToParams: all-empty filters → empty query string', () => {
  assert.equal(filtersToParams(DEFAULT_FILTERS), '')
})

test('round-trip: every row + the %2B-encoded 42+ bucket survives a real URL string', () => {
  const original = {
    ...DEFAULT_FILTERS,
    drive: ['u60', '120+'], distance: ['u10', '42+'],
    elevation: ['200-500', '2000+'], month: ['05', '11'],
    province: ['BARCELONA', 'LLEIDA'], showTBD: true, showPast: true, kidsRun: true,
  }
  const qs = filtersToParams(original)
  assert.ok(qs.includes('42%2B'), 'the "+" in 42+ must be percent-encoded, not a literal +')
  const back = filtersFromParams(new URLSearchParams(qs))
  assert.deepEqual(back, original)
})

// --- Matchers: empty selection matches everything ---

test('matchers: empty selection is a pass-through', () => {
  const race = { driveMinutes: 200, distances: [{ km: 5, elevationGain: 100 }], date: '2026-05-01', province: 'GIRONA' }
  assert.equal(matchesDrive(race, []), true)
  assert.equal(matchesDistance(race, []), true)
  assert.equal(matchesElevation(race, []), true)
  assert.equal(matchesMonth(race, []), true)
  assert.equal(matchesProvince(race, []), true)
})

// --- Distance: OR within the row ---

test('matchesDistance: matches when a distance falls in ANY selected bucket', () => {
  const race = { distances: [{ km: 12 }] }
  assert.equal(matchesDistance(race, ['u10']), false)
  assert.equal(matchesDistance(race, ['10-15']), true)
  assert.equal(matchesDistance(race, ['u10', '10-15']), true) // OR
})

test('matchesDistance: a multi-distance race matches if ANY distance qualifies', () => {
  const race = { distances: [{ km: 8 }, { km: 45 }] }
  assert.equal(matchesDistance(race, ['42+']), true)
  assert.equal(matchesDistance(race, ['15-21']), false)
})

test('matchesDistance: no distances → not excluded', () => {
  assert.equal(matchesDistance({ distances: [] }, ['10-15']), true)
})

test('matchers: an unrecognized bucket matches nothing (contract when called directly)', () => {
  // filtersFromParams drops invalid buckets before they reach a matcher, but the
  // exported matchers can be called with unvalidated arrays — pin the fallback so
  // a bogus token never silently matches everything.
  assert.equal(matchesDistance({ distances: [{ km: 12 }] }, ['bogus']), false)
  assert.equal(matchesDrive({ driveMinutes: 30 }, ['bogus']), false)
  assert.equal(matchesElevation({ distances: [{ km: 1, elevationGain: 100 }] }, ['bogus']), false)
})

// --- Drive ---

test('matchesDrive: bucket boundaries and OR', () => {
  assert.equal(matchesDrive({ driveMinutes: 59 }, ['u60']), true)
  assert.equal(matchesDrive({ driveMinutes: 60 }, ['u60']), false)
  assert.equal(matchesDrive({ driveMinutes: 60 }, ['60-120']), true)
  assert.equal(matchesDrive({ driveMinutes: 200 }, ['u60', '120+']), true) // OR
})

test('matchesDrive: unknown drive time is never excluded', () => {
  assert.equal(matchesDrive({ driveMinutes: null }, ['u60']), true)
})

// --- Elevation ---

test('matchesElevation: OR across selected bands', () => {
  const race = { distances: [{ km: 20, elevationGain: 1500 }] }
  assert.equal(matchesElevation(race, ['u200']), false)
  assert.equal(matchesElevation(race, ['1000-2000']), true)
  assert.equal(matchesElevation(race, ['u200', '1000-2000']), true)
})

test('matchesElevation: race with no elevation data is never excluded', () => {
  const race = { distances: [{ km: 20, elevationGain: null }] }
  assert.equal(matchesElevation(race, ['2000+']), true)
})

// --- Month / Province ---

test('matchesMonth: OR across months; undated excluded when a month is active', () => {
  assert.equal(matchesMonth({ date: '2026-05-10' }, ['05']), true)
  assert.equal(matchesMonth({ date: '2026-05-10' }, ['06', '07']), false)
  assert.equal(matchesMonth({ date: '2026-05-10' }, ['05', '06']), true)
  assert.equal(matchesMonth({ date: null }, ['05']), false)
  // A source-published month (expectedMonth) matches; a mismatching one does not.
  assert.equal(matchesMonth({ date: null, expectedMonth: 5 }, ['05']), true)
  assert.equal(matchesMonth({ date: null, expectedMonth: 5 }, ['06', '07']), false)
  assert.equal(matchesMonth({ date: null, expectedMonth: 12 }, ['12']), true)
})

test('matchesProvince: OR across provinces', () => {
  assert.equal(matchesProvince({ province: 'GIRONA' }, ['GIRONA']), true)
  assert.equal(matchesProvince({ province: 'GIRONA' }, ['BARCELONA']), false)
  assert.equal(matchesProvince({ province: 'GIRONA' }, ['BARCELONA', 'GIRONA']), true)
})

// --- difficulty filter (FdR redesign) ---
import { DIFFICULTY_VALUES, matchesDifficulty } from './filters.js'

test('difficulty: empty selection matches everything, unrated fails any active selection', () => {
  assert.equal(matchesDifficulty({}, [], null), true)
  assert.equal(matchesDifficulty({}, ['easy'], null), false)
})

test('difficulty: each band matches its slug; vh+ covers Very hard, Extreme, Brutal', () => {
  assert.equal(matchesDifficulty({}, ['easy'], 'Easy'), true)
  assert.equal(matchesDifficulty({}, ['moderate'], 'Moderate'), true)
  assert.equal(matchesDifficulty({}, ['hard'], 'Hard'), true)
  assert.equal(matchesDifficulty({}, ['vh+'], 'Very hard'), true)
  assert.equal(matchesDifficulty({}, ['vh+'], 'Extreme'), true)
  assert.equal(matchesDifficulty({}, ['vh+'], 'Brutal'), true)
  assert.equal(matchesDifficulty({}, ['easy'], 'Hard'), false)
  assert.equal(matchesDifficulty({}, ['easy', 'hard'], 'Hard'), true)
})

test('difficulty: URL round-trip via dif param', () => {
  const filters = { ...DEFAULT_FILTERS, difficulty: ['hard', 'vh+'] }
  const qs = filtersToParams(filters)
  assert.match(qs, /dif=hard%2Cvh%2B|dif=hard,vh\+/)
  const back = filtersFromParams(new URLSearchParams(qs))
  assert.deepEqual(back.difficulty, ['hard', 'vh+'])
  assert.equal(DIFFICULTY_VALUES.length, 4)
})
