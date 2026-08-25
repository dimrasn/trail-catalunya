// Tests for the MCP event-level filtering: multi-value OR (province[], month[]),
// the drive band (drive_min/drive_max), and the scalar/array/comma input
// normalizers. distanceMatches' range OR is covered in difficulty_test.ts.
// Run: deno test --allow-read --no-check supabase/functions/mcp/filters_core_test.ts

import { assert, assertEquals } from 'jsr:@std/assert@1'
import { applyFilters, numList, rangeList, strList } from './filters_core.ts'

// Minimal event shape applyFilters reads — cast through unknown so we don't have
// to build a full EnrichedEvent.
function ev(o: Record<string, unknown>) {
  return {
    province: 'BARCELONA', kidsRun: false, distances: [], date: null, dateEnd: null,
    drive_minutes_from_barcelona: null, ...o,
    // deno-lint-ignore no-explicit-any
  } as any
}

const EVENTS = [
  ev({ id: 'bcn-near', province: 'BARCELONA', drive_minutes_from_barcelona: 40, date: '2026-05-10', distances: [{ km: 12, elevationGain: 600 }] }),
  ev({ id: 'gir-mid', province: 'GIRONA', drive_minutes_from_barcelona: 90, date: '2026-06-14', distances: [{ km: 22, elevationGain: 1400 }] }),
  ev({ id: 'tar-far', province: 'TARRAGONA', drive_minutes_from_barcelona: 150, date: '2026-09-01', distances: [{ km: 8, elevationGain: 150 }] }),
  ev({ id: 'lle-ultra', province: 'LLEIDA', drive_minutes_from_barcelona: 200, date: '2026-06-20', distances: [{ km: 100, elevationGain: 6000 }] }),
]

// kept is unknown[] because FilterableEvent (applyFilters' constraint) carries
// no id — test events add one, so the helper casts per element instead of
// demanding a property the type can't promise.
const ids = (r: { kept: unknown[] }) => r.kept.map((e) => (e as { id?: string }).id).sort()

Deno.test('province[]: OR across provinces', () => {
  assertEquals(ids(applyFilters(EVENTS, { province: ['BARCELONA', 'GIRONA'] })), ['bcn-near', 'gir-mid'])
})

Deno.test('province[]: single-element array behaves like the old scalar', () => {
  assertEquals(ids(applyFilters(EVENTS, { province: ['LLEIDA'] })), ['lle-ultra'])
})

Deno.test('month[]: a source-published month (expectedMonth) matches; a precise date window does not', () => {
  const withExpected = [
    { id: 'exp-oct', date: null, expectedMonth: 10, province: 'GIRONA', kidsRun: false, distances: [{ km: 20 }], drive_minutes_from_barcelona: 60 },
    { id: 'truly-tbd', date: null, province: 'GIRONA', kidsRun: false, distances: [{ km: 20 }], drive_minutes_from_barcelona: 60 },
  ] as unknown as Parameters<typeof applyFilters>[0]
  // month filter includes the expected-month event; the fully-undated one is excluded + counted
  const r = applyFilters(withExpected, { month: [10] })
  assertEquals(ids(r), ['exp-oct'])
  assertEquals(r.tbdExcluded, 1)
  // a different month excludes both — but only the truly-undated race counts
  // as a TBD exclusion; the known-October race is a plain non-match (P2-7)
  const miss = applyFilters(withExpected, { month: [11] })
  assertEquals(ids(miss), [])
  assertEquals(miss.tbdExcluded, 1)
  // a precise date window can't place ANY dayless race → both excluded + counted
  const win = applyFilters(withExpected, { date_from: '2026-10-01', date_to: '2026-10-31' })
  assertEquals(ids(win), [])
  assertEquals(win.tbdExcluded, 2)
})

Deno.test('month[]: OR across months', () => {
  assertEquals(ids(applyFilters(EVENTS, { month: [6] })).length, 2) // gir-mid + lle-ultra
  assertEquals(ids(applyFilters(EVENTS, { month: [5, 9] })), ['bcn-near', 'tar-far'])
})

Deno.test('drive band: drive_min + drive_max keeps only the middle', () => {
  assertEquals(ids(applyFilters(EVENTS, { drive_min: 60, drive_max: 120 })), ['gir-mid'])
})

Deno.test('drive band: unknown drive time is excluded once a bound is set', () => {
  const withNull = [...EVENTS, ev({ id: 'no-drive', drive_minutes_from_barcelona: null })]
  assert(!ids(applyFilters(withNull, { drive_max: 300 })).includes('no-drive'))
})

Deno.test('AND across filters: province[] AND a distance band', () => {
  // GIRONA or LLEIDA, but only distances >= 42 km → just the ultra.
  const r = applyFilters(EVENTS, { province: ['GIRONA', 'LLEIDA'], dist_min: 42 })
  assertEquals(ids(r), ['lle-ultra'])
})

Deno.test('disjoint dist_ranges: "short OR ultra" across the event set', () => {
  const r = applyFilters(EVENTS, { dist_ranges: [{ max: 10 }, { min: 42 }] })
  assertEquals(ids(r), ['lle-ultra', 'tar-far'])
})

Deno.test('empty filters keep everything', () => {
  assertEquals(applyFilters(EVENTS, {}).kept.length, 4)
})

// --- input normalizers (accept scalar | array | comma-separated) ---

Deno.test('strList: scalar, array, and comma-string all normalize to string[]', () => {
  assertEquals(strList('GIRONA'), ['GIRONA'])
  assertEquals(strList(['BARCELONA', 'GIRONA']), ['BARCELONA', 'GIRONA'])
  assertEquals(strList('BARCELONA, GIRONA'), ['BARCELONA', 'GIRONA'])
  assertEquals(strList(''), undefined)
  assertEquals(strList(null), undefined)
})

Deno.test('numList: scalar, array, and comma-string all normalize to number[]', () => {
  assertEquals(numList(5), [5])
  assertEquals(numList([5, 6]), [5, 6])
  assertEquals(numList('5,6'), [5, 6])
  assertEquals(numList('5,bad,6'), [5, 6])
  assertEquals(numList(null), undefined)
})

Deno.test('rangeList: keeps numeric {min,max}, drops empties and junk', () => {
  assertEquals(rangeList([{ max: 10 }, { min: 42 }]), [{ min: undefined, max: 10 }, { min: 42, max: undefined }])
  assertEquals(rangeList([{}, { min: 'x' }]), undefined)
  assertEquals(rangeList('nope'), undefined)
})
