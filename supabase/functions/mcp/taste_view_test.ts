// Tests for the MCP taste gate. Mirrors app/lib/taste.test.mjs case-for-case
// (the parity guard — same Slice-1 policy + honesty logic on both runtimes;
// field names differ by convention: snake_case here, camelCase on the site).
// Run: deno test supabase/functions/mcp/taste_view_test.ts

import { assert, assertEquals } from 'jsr:@std/assert@1'
import { tasteFlags, tasteForDisplay, tasteSummary } from './taste_view.ts'

Deno.test('null / empty profile → null', () => {
  assertEquals(tasteForDisplay(null), null)
  assertEquals(tasteSummary(null), null)
  assertEquals(tasteForDisplay({}), null)
})

Deno.test('editorial is our_read-labelled; Slice-1 excludes operational fields', () => {
  const p = {
    attributes: {
      setting: { value: 'coastal forest ridge', claim_strength: 'organizer_fact' },
      start_time: { value: '21:00', claim_strength: 'organizer_fact' }, // operational → deferred
    },
    editorial: { unique: { value: 'a night point-to-point to the beach', claim_strength: 'our_read' } },
  }
  const d = tasteForDisplay(p)!
  assertEquals(d.editorial[0].label, 'What makes it special')
  assertEquals(d.editorial[0].strength_label, 'Our read')
  assertEquals(d.character.map((c) => c.key), ['setting']) // start_time NOT in Slice 1
})

Deno.test('garble / too-short values are hidden (whole taste → null if nothing survives)', () => {
  const p = {
    attributes: { setting: { value: '; .', claim_strength: 'organizer_fact' }, food: { value: 'ok', claim_strength: 'organizer_fact' } },
    editorial: {},
  }
  assertEquals(tasteForDisplay(p), null)
})

Deno.test('tasteSummary picks unique and keeps its claim strength', () => {
  assertEquals(
    tasteSummary({ editorial: { unique: { value: 'Catalonia benchmark 100k', claim_strength: 'our_read' } } }),
    { value: 'Catalonia benchmark 100k', strength: 'our_read', strength_label: 'Our read' },
  )
})

Deno.test('tasteSummary falls back (who → setting) when no unique/reference', () => {
  assertEquals(
    tasteSummary({ attributes: { setting: { value: 'forested coastal hills', claim_strength: 'organizer_fact' } }, editorial: {} })?.value,
    'forested coastal hills',
  )
})

Deno.test('tasteFlags: conservative — set only when stated, absent = unknown', () => {
  assertEquals(tasteFlags(null), null)
  assertEquals(tasteFlags({ attributes: { night_race: { value: 'Yes', claim_strength: 'organizer_fact' } }, editorial: {} }), { night: true })
  assertEquals(tasteFlags({ attributes: { technicality: { value: 'some technical sections', claim_strength: 'organizer_fact' } }, editorial: {} }), { technicality: 'moderate' })
  assertEquals(tasteFlags({ attributes: { technicality: { value: 'molt tècnica, rocky descents', claim_strength: 'organizer_fact' } }, editorial: {} }), { technicality: 'high' })
  assertEquals(tasteFlags({ attributes: { technicality: { value: 'runnable, low tech', claim_strength: 'organizer_fact' } }, editorial: {} }), { technicality: 'low' })
  // a race that states nothing technical/night → no flags asserted (not "low", not "not-night")
  assertEquals(tasteFlags({ attributes: { setting: { value: 'coastal forest', claim_strength: 'our_read' } }, editorial: {} }), null)
})

Deno.test('tasteFlags: negation never sets night; non-organizer provenance is ineligible (audit #6)', () => {
  // "no night mention" must NOT become night:true
  assertEquals(tasteFlags({ attributes: { night_race: { value: 'No. (day marxa, no night mention)', claim_strength: 'organizer_fact' } }, editorial: {} }), null)
  // an inferred/our-read technicality is NOT a queryable flag
  assertEquals(tasteFlags({ attributes: { technicality: { value: 'rocky, technical', claim_strength: 'inference' } }, editorial: {} }), null)
  assertEquals(tasteFlags({ attributes: { night_race: { value: 'Yes — nocturna', claim_strength: 'our_read' } }, editorial: {} }), null)
})

Deno.test('inference stays inference, not upgraded to fact', () => {
  const d = tasteForDisplay({ editorial: { who: { value: 'strong night runners', claim_strength: 'inference' } } })!
  assertEquals(d.editorial[0].strength_label, 'Our guess')
})
