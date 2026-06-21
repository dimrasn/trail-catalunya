// Tests for the Deno grouping port. These encode the same behaviour as
// app/lib/races.js groupRowsIntoEvents — the guard against the two copies
// drifting until the shared-core refactor unifies them.
//
// Run: deno test supabase/functions/mcp/grouping_test.ts

import { assert, assertEquals } from 'jsr:@std/assert@1'
import { groupRowsIntoEvents, type RaceRow } from './grouping.ts'

Deno.test('collapses multiple distances of one race into one event', () => {
  const rows: RaceRow[] = [
    { race_name: 'Volta a Peramola', race_url: 'http://vp.cat/', town: 'Peramola', province: 'LLEIDA', distance_km: 25, elevation_m: 1600, date: '2026-04-04', status: 'ACTIVA' },
    { race_name: 'Volta a Peramola', race_url: 'http://vp.cat/', town: 'Peramola', province: 'LLEIDA', distance_km: 10, elevation_m: 610, date: '2026-04-04', status: 'ACTIVA' },
    { race_name: 'Volta a Peramola', race_url: 'http://vp.cat/', town: 'Peramola', province: 'LLEIDA', distance_km: 5, elevation_m: 260, date: '2026-04-04', status: 'ACTIVA' },
  ]
  const events = groupRowsIntoEvents(rows)
  assertEquals(events.length, 1)
  assertEquals(events[0].distances.length, 3)
  // sorted longest first
  assertEquals(events[0].distances.map((d) => d.km), [25, 10, 5])
  assertEquals(events[0].id, 'volta-a-peramola')
})

Deno.test('event-level distance filtering keeps all sibling distances', () => {
  // grouping itself never drops a distance; the 35/24/14 race keeps all three.
  const rows: RaceRow[] = [
    { race_name: 'Trail X', race_url: 'http://x.cat/', town: 'Olot', distance_km: 35, elevation_m: 2000, date: '2026-05-01', status: 'ACTIVA' },
    { race_name: 'Trail X', race_url: 'http://x.cat/', town: 'Olot', distance_km: 24, elevation_m: 1370, date: '2026-05-01', status: 'ACTIVA' },
    { race_name: 'Trail X', race_url: 'http://x.cat/', town: 'Olot', distance_km: 14, elevation_m: 780, date: '2026-05-01', status: 'ACTIVA' },
  ]
  const e = groupRowsIntoEvents(rows)[0]
  assertEquals(e.distances.length, 3)
})

Deno.test('detects kids run from a variant row name', () => {
  const rows: RaceRow[] = [
    { race_name: 'Cursa de Tardor', race_url: 'http://t.cat/', town: 'Vic', distance_km: 21, date: '2026-10-04', status: 'ACTIVA' },
    { race_name: 'Cursa de Tardor CADET', race_url: 'http://t.cat/', town: 'Vic', distance_km: 3, date: '2026-10-04', status: 'ACTIVA' },
  ]
  const e = groupRowsIntoEvents(rows)[0]
  assertEquals(e.kidsRun, true)
  assertEquals(e.name, 'Cursa de Tardor') // non-kids row wins the event name
  const variant = e.distances.find((d) => d.km === 3)
  assertEquals(variant?.variantName, 'Cursa de Tardor CADET')
})

Deno.test('marks soldOut from ESGOTADES price', () => {
  const rows: RaceRow[] = [
    { race_name: 'Costa Brava', race_url: 'http://cb.cat/', town: 'Blanes', distance_km: 120, price: 'ESGOTADES', date: '2026-04-17', status: 'ACTIVA' },
  ]
  const e = groupRowsIntoEvents(rows)[0]
  assertEquals(e.soldOut, true)
})

Deno.test('parses multi-day dateEnd', () => {
  const rows: RaceRow[] = [
    { race_name: 'Stage Run', race_url: 'http://s.cat/', town: 'Blanes', distance_km: 80, date: '2026-04-17', date_display: '17-19/04/2026', status: 'ACTIVA' },
  ]
  const e = groupRowsIntoEvents(rows)[0]
  assertEquals(e.date, '2026-04-17')
  assertEquals(e.dateEnd, '2026-04-19')
})

Deno.test('dedups ids across same name in different towns', () => {
  const rows: RaceRow[] = [
    { race_name: 'Ultra Montseny', race_url: 'http://um.cat/a', town: 'Viladrau', distance_km: 70, date: '2026-04-11', status: 'ACTIVA' },
    { race_name: 'Ultra Montseny', race_url: 'http://um.cat/b', town: 'Montseny', distance_km: 34, date: '2026-04-11', status: 'ACTIVA' },
  ]
  const events = groupRowsIntoEvents(rows)
  assertEquals(events.length, 2)
  const ids = events.map((e) => e.id).sort()
  assert(ids.includes('ultra-montseny'))
  assert(ids.some((i) => i.startsWith('ultra-montseny-')))
})

Deno.test('same name + same town + different URL get unique ids', () => {
  const rows: RaceRow[] = [
    { race_name: 'Cursa Local', race_url: 'http://a.cat/', town: 'Berga', distance_km: 10, date: '2026-05-01', status: 'ACTIVA' },
    { race_name: 'Cursa Local', race_url: 'http://b.cat/', town: 'Berga', distance_km: 21, date: '2026-09-01', status: 'ACTIVA' },
  ]
  const events = groupRowsIntoEvents(rows)
  assertEquals(events.length, 2)
  const ids = events.map((e) => e.id)
  assertEquals(new Set(ids).size, 2) // no collision
  assert(ids.includes('cursa-local'))
})

Deno.test('numeric strings from PostgREST parse correctly', () => {
  const rows: RaceRow[] = [
    { race_name: 'Y', race_url: 'http://y.cat/', town: 'Reus', distance_km: '21.5', elevation_m: '1200', date: '2026-06-01', status: 'ACTIVA' },
  ]
  const e = groupRowsIntoEvents(rows)[0]
  assertEquals(e.distances[0].km, 21.5)
  assertEquals(e.distances[0].elevationGain, 1200)
})
