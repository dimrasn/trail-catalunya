// Unit tests for the diff logic. Pure functions, no DB.
//
// Run: deno test --allow-read supabase/functions/scrape-trails/diff_test.ts

import { assert, assertEquals } from 'jsr:@std/assert@1'
import { computeChanges, summarize, type DbRaceRow } from './diff.ts'
import type { Race } from './parser.ts'

function race(overrides: Partial<Race> = {}): Race {
  return {
    race_hash: 'aaa',
    source: 'ultrescatalunya',
    month: 'Abril 2026',
    month_num: 4,
    year: 2026,
    date: '2026-04-12',
    date_display: '12/04/2026',
    race_name: 'Trail X',
    race_url: 'https://example.com',
    distance_km: 21,
    elevation_m: 1000,
    distance_elevation_raw: '21km D+1000m',
    price: '20€',
    town: 'Barcelona',
    province: 'BARCELONA',
    status: 'ACTIVA',
    ...overrides,
  }
}

function dbRow(overrides: Partial<DbRaceRow> = {}): DbRaceRow {
  return {
    race_hash: 'aaa',
    source: 'ultrescatalunya',
    month: 'Abril 2026',
    month_num: 4,
    year: 2026,
    date: '2026-04-12',
    date_display: '12/04/2026',
    race_name: 'Trail X',
    race_url: 'https://example.com',
    distance_km: '21.0', // Supabase NUMERIC comes back as string
    elevation_m: '1000',
    distance_elevation_raw: '21km D+1000m',
    price: '20€',
    town: 'Barcelona',
    province: 'BARCELONA',
    status: 'ACTIVA',
    ...overrides,
  }
}

Deno.test('detects added rows', () => {
  const events = computeChanges([race()], [])
  assertEquals(events.length, 1)
  assertEquals(events[0].change_type, 'added')
  assertEquals(events[0].race_hash, 'aaa')
})

Deno.test('detects removed rows', () => {
  const events = computeChanges([], [dbRow()])
  assertEquals(events.length, 1)
  assertEquals(events[0].change_type, 'removed')
})

Deno.test('removed status in DB is ignored as removal source', () => {
  const events = computeChanges([], [dbRow({ status: 'REMOVED' })])
  assertEquals(events.length, 0)
})

Deno.test('detects re_added when status was REMOVED', () => {
  const events = computeChanges([race()], [dbRow({ status: 'REMOVED' })])
  assertEquals(events.length, 1)
  assertEquals(events[0].change_type, 're_added')
})

Deno.test('no change when fresh and DB match', () => {
  const events = computeChanges([race()], [dbRow()])
  assertEquals(events.length, 0)
})

Deno.test('numeric drift between DB string "21.0" and JS number 21 is NOT a change', () => {
  // Supabase returns NUMERIC as strings; the parser produces numbers.
  // Without numeric-aware compare we'd flood race_changes every run.
  const events = computeChanges(
    [race({ distance_km: 21 })],
    [dbRow({ distance_km: '21.0' })],
  )
  assertEquals(events.length, 0)
})

Deno.test('detects price change', () => {
  const events = computeChanges(
    [race({ price: '25€' })],
    [dbRow({ price: '20€' })],
  )
  assertEquals(events.length, 1)
  assertEquals(events[0].change_type, 'changed')
  assert(events[0].changed_fields?.price)
  assertEquals(events[0].changed_fields!.price.old, '20€')
  assertEquals(events[0].changed_fields!.price.new, '25€')
})

Deno.test('detects status change ACTIVA → SOLD_OUT', () => {
  const events = computeChanges(
    [race({ status: 'SOLD_OUT' })],
    [dbRow({ status: 'ACTIVA' })],
  )
  assertEquals(events.length, 1)
  assertEquals(events[0].change_type, 'changed')
  assertEquals(events[0].changed_fields!.status.new, 'SOLD_OUT')
})

Deno.test('summary counts each type', () => {
  const events = computeChanges(
    [race({ race_hash: 'a' }), race({ race_hash: 'b', price: 'NEW' })],
    [
      dbRow({ race_hash: 'b', price: 'OLD' }),
      dbRow({ race_hash: 'c' }), // will be removed
      dbRow({ race_hash: 'd', status: 'REMOVED' }), // ignored
    ],
  )
  const sum = summarize(events)
  assertEquals(sum.added, 1) // a
  assertEquals(sum.changed, 1) // b
  assertEquals(sum.removed, 1) // c
  assertEquals(sum.re_added, 0)
})

Deno.test('mixed re_added and changed', () => {
  const events = computeChanges(
    [
      race({ race_hash: 'a' }), // re_added
      race({ race_hash: 'b', price: 'NEW' }), // changed
      race({ race_hash: 'c' }), // unchanged
    ],
    [
      dbRow({ race_hash: 'a', status: 'REMOVED' }),
      dbRow({ race_hash: 'b', price: 'OLD' }),
      dbRow({ race_hash: 'c' }),
    ],
  )
  const sum = summarize(events)
  assertEquals(sum.re_added, 1)
  assertEquals(sum.changed, 1)
  assertEquals(sum.added, 0)
  assertEquals(sum.removed, 0)
})
