// Tests for U10 MCP enrichment shaping (R12, R5, KTD4).
// Run: deno test supabase/functions/mcp/enrichment_view_test.ts

import { assert, assertEquals } from 'jsr:@std/assert@1'
import { enrichedFactsForMcp, factToMcp } from './enrichment_view.ts'

const fact = (value: string | null, confidence: string, extra: Record<string, unknown> = {}) => ({
  value,
  confidence,
  edition: '2026',
  evidence: 'Sortida 08:00',
  source_url: 'https://race.cat/',
  last_checked: '2026-06-23T00:00:00.000Z',
  ...extra,
})

Deno.test('factToMcp maps a value-bearing fact with metadata', () => {
  const m = factToMcp(fact('08:00', 'high'))!
  assertEquals(m.value, '08:00')
  assertEquals(m.confidence, 'high')
  assertEquals(m.edition, '2026')
  assertEquals(m.last_checked, '2026-06-23T00:00:00.000Z')
  assertEquals(m.evidence, 'Sortida 08:00')
})

Deno.test('factToMcp drops unknown-confidence and value-less facts', () => {
  assertEquals(factToMcp(fact(null, 'unknown')), null)
  assertEquals(factToMcp(fact('08:00', 'unknown')), null)
  assertEquals(factToMcp(null), null)
})

Deno.test('factToMcp preserves prior-edition and caps evidence at 300 chars', () => {
  const m = factToMcp(fact('08:00', 'low', { edition: 'previous', evidence: 'x'.repeat(500) }))!
  assertEquals(m.edition, 'previous')
  assertEquals(m.evidence!.length, 300)
})

Deno.test('enrichedFactsForMcp omits unknowns and returns null when empty', () => {
  const row = {
    start_time: fact('08:00', 'high'),
    price: fact(null, 'unknown'),
    confirmed_status: fact('confirmed', 'medium'),
  }
  const out = enrichedFactsForMcp(row)!
  assert(out.start_time)
  assert(out.confirmed_status)
  assertEquals(out.price, undefined)

  assertEquals(enrichedFactsForMcp(null), null)
  assertEquals(enrichedFactsForMcp({ start_time: fact(null, 'unknown') }), null)
})
