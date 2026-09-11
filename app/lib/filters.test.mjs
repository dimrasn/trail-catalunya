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
  assert.deepEqual(toggleValue([], '10-21'), ['10-21'])
  assert.deepEqual(toggleValue(['10-21'], '21-42'), ['10-21', '21-42'])
  assert.deepEqual(toggleValue(['10-21', '21-42'], '10-21'), ['21-42'])
})

test('toggleValue: does not mutate the input array', () => {
  const before = ['10-21']
  toggleValue(before, '21-42')
  assert.deepEqual(before, ['10-21'])
})

// --- URL round-trip ---

const sp = (obj) => new URLSearchParams(obj)

test('filtersFromParams: empty params → all-empty defaults', () => {
  assert.deepEqual(filtersFromParams(sp({})), DEFAULT_FILTERS)
})

test('filtersFromParams: comma list parses to array', () => {
  const f = filtersFromParams(sp({ dist: '10-21,21-42' }))
  assert.deepEqual(f.distance, ['10-21', '21-42'])
})

test('filtersFromParams: invalid buckets are dropped', () => {
  const f = filtersFromParams(sp({ dist: '10-21,bogus,999' }))
  assert.deepEqual(f.distance, ['10-21'])
})

test('filtersFromParams: legacy single-value (no-comma) links still restore', () => {
  // Old single-select URLs predate the comma format — they must keep working.
  const f = filtersFromParams(sp({ dist: '10-21', prov: 'GIRONA', drive: 'u60', month: '05' }))
  assert.deepEqual(f.distance, ['10-21'])
  assert.deepEqual(f.province, ['GIRONA'])
  assert.deepEqual(f.drive, ['u60'])
  assert.deepEqual(f.month, ['05'])
})

test('filtersFromParams: junk-only / whitespace / empty params → empty array', () => {
  assert.deepEqual(filtersFromParams(sp({ dist: 'bogus,999' })).distance, [])
  assert.deepEqual(filtersFromParams(sp({ dist: ',,,' })).distance, [])
  assert.deepEqual(filtersFromParams(sp({ dist: '' })).distance, [])
  assert.deepEqual(filtersFromParams(sp({ dist: ' 10-21 ' })).distance, []) // padded ≠ valid token
})

test('filtersFromParams: order is canonical, not URL order, and deduped', () => {
  const f = filtersFromParams(sp({ dist: '42+,10-21,10-21' }))
  assert.deepEqual(f.distance, ['10-21', '42+'])
})

test('filtersToParams: multi-value row serializes comma-joined', () => {
  const qs = filtersToParams({ ...DEFAULT_FILTERS, distance: ['10-21', '21-42'] })
  assert.equal(qs, 'dist=10-21%2C21-42')
})

test('round-trip: params → filters → params is stable', () => {
  const original = { ...DEFAULT_FILTERS, drive: ['u60'], distance: ['10-21', '21-42'], month: ['05', '06'], kidsRun: true }
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
  assert.equal(matchesDistance(race, ['10-21']), true)
  assert.equal(matchesDistance(race, ['u10', '10-21']), true) // OR
})

test('matchesDistance: a multi-distance race matches if ANY distance qualifies', () => {
  const race = { distances: [{ km: 8 }, { km: 45 }] }
  assert.equal(matchesDistance(race, ['42+']), true)
  assert.equal(matchesDistance(race, ['10-21']), false)
})

test('matchesDistance: no distances → not excluded', () => {
  assert.equal(matchesDistance({ distances: [] }, ['10-21']), true)
})

test('matchesDistance: the merged 10–21 band is closed at both ends, and the seam is exact', () => {
  // The old 10-15 / 15-21 boundary sat at 15 (<=15 vs >15). Merging must not
  // open a hole at the seam, nor move the outer edges: 10 is in, 21 is in,
  // 9.9 and 21.1 are not.
  assert.equal(matchesDistance({ distances: [{ km: 9.9 }] }, ['10-21']), false)
  assert.equal(matchesDistance({ distances: [{ km: 10 }] }, ['10-21']), true)
  assert.equal(matchesDistance({ distances: [{ km: 15 }] }, ['10-21']), true)
  assert.equal(matchesDistance({ distances: [{ km: 15.5 }] }, ['10-21']), true)
  assert.equal(matchesDistance({ distances: [{ km: 21 }] }, ['10-21']), true)
  assert.equal(matchesDistance({ distances: [{ km: 21.1 }] }, ['10-21']), false)
  // and 21.1 lands in the next bucket up rather than nowhere
  assert.equal(matchesDistance({ distances: [{ km: 21.1 }] }, ['21-42']), true)
})

test('distance: R9 — shared ?dist=10-15 and ?dist=15-21 links still resolve', () => {
  // Both retired values expand to the band that swallowed them, and a link
  // carrying both collapses to one bucket rather than duplicating it.
  assert.deepEqual(filtersFromParams(new URLSearchParams('dist=10-15')).distance, ['10-21'])
  assert.deepEqual(filtersFromParams(new URLSearchParams('dist=15-21')).distance, ['10-21'])
  assert.deepEqual(filtersFromParams(new URLSearchParams('dist=10-15,15-21')).distance, ['10-21'])
  // mixed legacy + current, re-emitted in DISTANCE_VALUES order
  assert.deepEqual(
    filtersFromParams(new URLSearchParams('dist=42%2B,10-15')).distance,
    ['10-21', '42+'],
  )
  // a 14 km race was found by the old link and is still found by it
  const back = filtersFromParams(new URLSearchParams('dist=10-15'))
  assert.equal(matchesDistance({ distances: [{ km: 14 }] }, back.distance), true)
  // ...and so is an 18 km race, which the old 10-15 link did NOT match. Widening
  // what a shared link returns is the accepted cost of the merge: R9 protects the
  // link from breaking, not from returning more.
  assert.equal(matchesDistance({ distances: [{ km: 18 }] }, back.distance), true)
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
import { DIFFICULTY_VALUES, DIFFICULTY_SLUG, matchesDifficulty } from './filters.js'

test('difficulty: empty selection matches everything, unrated fails any active selection', () => {
  assert.equal(matchesDifficulty({}, [], null), true)
  assert.equal(matchesDifficulty({}, ['easy'], null), false)
})

test('difficulty: one value per ITRA level, each matching only its own', () => {
  assert.equal(DIFFICULTY_VALUES.length, 6)
  const LEVELS = ['Easy', 'Moderate', 'Hard', 'Very hard', 'Extreme', 'Brutal']
  // every level has a slug, every slug is a declared value, and the mapping is 1:1
  assert.deepEqual(LEVELS.map(w => DIFFICULTY_SLUG[w]), DIFFICULTY_VALUES)
  for (const word of LEVELS) {
    const slug = DIFFICULTY_SLUG[word]
    assert.equal(matchesDifficulty({}, [slug], word), true, `${slug} should match ${word}`)
    for (const other of LEVELS.filter(w => w !== word)) {
      assert.equal(matchesDifficulty({}, [slug], other), false,
        `${slug} must NOT match ${other} — the top three used to collapse together`)
    }
  }
  assert.equal(matchesDifficulty({}, ['easy', 'brutal'], 'Brutal'), true) // OR within the row
})

test('difficulty: an unknown level word matches nothing, rather than falling into the hardest bucket', () => {
  // it used to default to 'vh+', so a typo or a newly added level word would have
  // been silently filed as Very-hard-or-worse — a wrong positive, not a visible gap
  assert.equal(matchesDifficulty({}, ['brutal'], 'Apocalyptic'), false)
  assert.equal(matchesDifficulty({}, DIFFICULTY_VALUES, 'Apocalyptic'), false)
})

test('difficulty: URL round-trip via dif param, canonical order', () => {
  const filters = { ...DEFAULT_FILTERS, difficulty: ['brutal', 'hard'] }
  const qs = filtersToParams(filters)
  const back = filtersFromParams(new URLSearchParams(qs))
  // re-emitted in DIFFICULTY_VALUES order, not click order
  assert.deepEqual(back.difficulty, ['hard', 'brutal'])
})

test('difficulty: R9 — a shared ?dif=vh+ link still means the top three levels', () => {
  const back = filtersFromParams(new URLSearchParams('dif=vh%2B'))
  assert.deepEqual(back.difficulty, ['very-hard', 'extreme', 'brutal'])
  // and it still selects exactly the races it used to
  assert.equal(matchesDifficulty({}, back.difficulty, 'Very hard'), true)
  assert.equal(matchesDifficulty({}, back.difficulty, 'Extreme'), true)
  assert.equal(matchesDifficulty({}, back.difficulty, 'Brutal'), true)
  assert.equal(matchesDifficulty({}, back.difficulty, 'Hard'), false)
  // mixed legacy + new in one link
  const mixed = filtersFromParams(new URLSearchParams('dif=easy,vh%2B'))
  assert.deepEqual(mixed.difficulty, ['easy', 'very-hard', 'extreme', 'brutal'])
})
