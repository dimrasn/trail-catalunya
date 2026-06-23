// Tests for the enrichment cost model (R11, KTD3).
// Run: deno test supabase/functions/enrich-races/cost_test.ts

import { assertEquals } from 'jsr:@std/assert@1'
import { estimateCostMicros, monthKey, MONTHLY_CAP_MICROS, overCap } from './cost.ts'

Deno.test('estimateCostMicros weights input and output tokens', () => {
  assertEquals(estimateCostMicros({ input_tokens: 1000, output_tokens: 100 }), 1000 * 1 + 100 * 5)
  assertEquals(estimateCostMicros({ input_tokens: 0, output_tokens: 0 }), 0)
})

Deno.test('monthKey formats UTC year-month', () => {
  assertEquals(monthKey(new Date(Date.UTC(2026, 5, 23))), '2026-06')
  assertEquals(monthKey(new Date(Date.UTC(2026, 0, 1))), '2026-01')
})

Deno.test('overCap triggers at or above the cap', () => {
  assertEquals(overCap(MONTHLY_CAP_MICROS - 1), false)
  assertEquals(overCap(MONTHLY_CAP_MICROS), true)
  assertEquals(overCap(MONTHLY_CAP_MICROS + 1), true)
})
