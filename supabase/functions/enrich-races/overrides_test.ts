// Tests for U6 override layer (R15, AE5, KTD6).
// Run: deno test supabase/functions/enrich-races/overrides_test.ts

import { assert, assertEquals, assertThrows } from 'jsr:@std/assert@1'
import { indexOverrides, mergeWithOverride, parseOverrides } from './overrides.ts'
import { emptyFactSet, eventKey } from './types.ts'

const NOW = '2026-06-23T00:00:00.000Z'

Deno.test('parses a valid override file', () => {
  const recs = parseOverrides([
    { source: 'ultrescatalunya', race_url: 'https://race.cat/', town: 'Olot', facts: { price: { value: '30€', note: 'maintainer confirmed' } } },
  ])
  assertEquals(recs.length, 1)
  assertEquals(recs[0].facts!.price!.value, '30€')
})

Deno.test('AE5: override replaces the crawled value, marks origin override, keeps the note', () => {
  const crawled = emptyFactSet()
  crawled.price = { value: '99€', confidence: 'medium', evidence: 'wrong', source_url: 'x', edition: '2026', last_checked: NOW }
  const rec = parseOverrides([{ race_url: 'https://race.cat/', town: 'Olot', facts: { price: { value: '25€', note: 'corrected from flyer' } } }])[0]
  const { facts, origin } = mergeWithOverride(crawled, rec, NOW)
  assertEquals(origin, 'override')
  assertEquals(facts.price.value, '25€')
  assertEquals(facts.price.confidence, 'high')
  assertEquals(facts.price.evidence, 'corrected from flyer')
})

Deno.test('merge with no override facts leaves crawled facts and origin crawl', () => {
  const crawled = emptyFactSet()
  const { facts, origin } = mergeWithOverride(crawled, undefined, NOW)
  assertEquals(origin, 'crawl')
  assertEquals(facts, crawled)
})

Deno.test('indexOverrides keys by event identity', () => {
  const recs = parseOverrides([{ race_url: 'https://race.cat/', town: 'Olot', facts: { price: { value: '1€' } } }])
  const idx = indexOverrides(recs, 'ultrescatalunya')
  const key = eventKey('ultrescatalunya', 'https://race.cat/', 'Olot')!
  assert(idx.has(key))
})

Deno.test('skip record is parsed', () => {
  const recs = parseOverrides([{ race_url: 'https://race.cat/', town: 'Olot', skip: true }])
  assertEquals(recs[0].skip, true)
})

Deno.test('empty / null input → no records', () => {
  assertEquals(parseOverrides(null), [])
  assertEquals(parseOverrides([]), [])
})

Deno.test('malformed files fail loudly', () => {
  assertThrows(() => parseOverrides({} as unknown), Error, 'array')
  assertThrows(() => parseOverrides([{ race_url: 'x', town: 'y', bogus: 1 }]), Error, 'unknown key')
  assertThrows(() => parseOverrides([{ race_url: 'x', town: 'y', facts: { registration_status: { value: 'open' } } }]), Error, 'unknown fact')
  assertThrows(() => parseOverrides([{ race_url: 'x', town: 'y', facts: { price: { value: '1', confidence: 'super' } } }]), Error, 'bad confidence')
  assertThrows(() => parseOverrides([{ town: 'y' }]), Error, 'race_url')
  assertThrows(() => parseOverrides([{ race_url: 'x' }]), Error, 'town')
})
