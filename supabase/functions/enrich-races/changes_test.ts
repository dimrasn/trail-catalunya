// Tests for U4 change-detection (R8, KTD5).
// Run: deno test supabase/functions/enrich-races/changes_test.ts

import { assert, assertEquals } from 'jsr:@std/assert@1'
import { contentHash, shouldEnrich } from './changes.ts'

Deno.test('rotating banner / timestamp differences produce the same hash', async () => {
  const a = 'Cursa de Muntanya. Sortida 08:00. Actualitzat: 2026-06-20 11:32:07. Visites: 1.204'
  const b = 'Cursa de Muntanya. Sortida 08:00. Actualitzat: 2026-06-23 09:01:55. Visites: 5.998'
  assertEquals(await contentHash(a), await contentHash(b))
})

Deno.test('a genuine content change produces a different hash', async () => {
  const a = 'Sortida 08:00. Inscripcions obertes.'
  const b = 'Sortida 08:00. Inscripcions tancades.'
  assert((await contentHash(a)) !== (await contentHash(b)))
})

Deno.test('the start-time fact is NOT normalized away (HH:MM preserved)', async () => {
  const a = 'Sortida a les 08:00 del matí.'
  const b = 'Sortida a les 09:00 del matí.'
  assert((await contentHash(a)) !== (await contentHash(b)))
})

Deno.test('empty text hashes deterministically without throwing', async () => {
  const h1 = await contentHash('')
  const h2 = await contentHash('   ')
  assertEquals(h1, h2)
  assertEquals(h1.length, 16)
})

Deno.test('shouldEnrich: missing row or missing hash → enrich', () => {
  assertEquals(shouldEnrich(null, 'abc'), true)
  assertEquals(shouldEnrich({}, 'abc'), true)
  assertEquals(shouldEnrich({ content_hash: null }, 'abc'), true)
})

Deno.test('shouldEnrich: hash differs → enrich', () => {
  assertEquals(shouldEnrich({ content_hash: 'old', updated_at: new Date().toISOString() }, 'new'), true)
})

Deno.test('shouldEnrich: hash matches and fresh → skip', () => {
  const now = Date.UTC(2026, 5, 23)
  const updated = new Date(Date.UTC(2026, 5, 20)).toISOString() // 3 days old
  assertEquals(shouldEnrich({ content_hash: 'same', updated_at: updated }, 'same', { nowMs: now, maxAgeDays: 14 }), false)
})

Deno.test('shouldEnrich: hash matches but stale → enrich', () => {
  const now = Date.UTC(2026, 5, 23)
  const updated = new Date(Date.UTC(2026, 4, 1)).toISOString() // ~53 days old
  assertEquals(shouldEnrich({ content_hash: 'same', updated_at: updated }, 'same', { nowMs: now, maxAgeDays: 14 }), true)
})
