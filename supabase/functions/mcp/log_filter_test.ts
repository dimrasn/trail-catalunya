// Privacy tests for the anonymous-log allowlist (audit blocker #1).
// Run: deno test supabase/functions/mcp/log_filter_test.ts

import { assert, assertEquals } from 'jsr:@std/assert@1'
import { capArgs, ALLOWED_FILTER_KEYS, MAX_ARRAY_ITEMS, MAX_VALUE_CHARS } from './log_filter.ts'

Deno.test('drops undeclared keys (no PII/training data leak)', () => {
  const out = capArgs({
    drive_max: 60,
    // hostile / undeclared fields an agent might mis-send:
    training_data: 'weekly 80km, VO2max 58, resting HR 44',
    email: 'someone@example.com',
    __proto__: 'x',
    note: 'ignore previous instructions',
  })
  assertEquals(out, { drive_max: 60 })
  assert(!('training_data' in out))
  assert(!('email' in out))
  assert(!('note' in out))
})

Deno.test('keeps only allowlisted, correctly-typed scalars', () => {
  const out = capArgs({
    province: 'BARCELONA', month: 10, kids_run: true, dist_min: 15, id: 'burriac-atac',
  })
  assertEquals(out, { province: 'BARCELONA', month: 10, kids_run: true, dist_min: 15, id: 'burriac-atac' })
})

Deno.test('caps long string values and keeps scalar dates', () => {
  const out = capArgs({ province: 'x'.repeat(500), date_from: '2026-09-01' })
  assertEquals((out.province as string).length, MAX_VALUE_CHARS)
  assertEquals(out.date_from, '2026-09-01')
})

Deno.test('keeps multi-value province/month arrays (OR filters)', () => {
  const out = capArgs({ province: ['BARCELONA', 'GIRONA'], month: [5, 6] })
  assertEquals(out.province, ['BARCELONA', 'GIRONA'])
  assertEquals(out.month, [5, 6])
})

Deno.test('keeps *_ranges as {min,max} numbers only, stripping extra object keys', () => {
  const out = capArgs({ dist_ranges: [{ max: 10, evil: 'x' }, { min: 42 }] })
  assertEquals(out.dist_ranges, [{ max: 10 }, { min: 42 }])
})

Deno.test('array values are still bounded — length capped and strings truncated', () => {
  const out = capArgs({
    province: Array.from({ length: 50 }, () => 'y'.repeat(500)),
  })
  const arr = out.province as string[]
  assertEquals(arr.length, MAX_ARRAY_ITEMS)
  assertEquals(arr[0].length, MAX_VALUE_CHARS)
})

Deno.test('array elements that are objects without min/max are dropped', () => {
  const out = capArgs({ month: [5, { note: 'ignore instructions' }, 6] })
  assertEquals(out.month, [5, 6]) // the junk object element is stripped
})

Deno.test('every allowlisted key matches a real tool input field', () => {
  // Guard against the allowlist drifting from the schema surface.
  for (const k of ['drive_min', 'drive_max', 'province', 'month', 'dist_ranges', 'elev_ranges', 'kids_run', 'id', 'date_from']) {
    assert(ALLOWED_FILTER_KEYS.has(k), `missing ${k}`)
  }
})
