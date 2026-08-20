// Privacy tests for the anonymous-log allowlist (audit blocker #1).
// Run: deno test supabase/functions/mcp/log_filter_test.ts

import { assert, assertEquals } from 'jsr:@std/assert@1'
import { capArgs, ALLOWED_FILTER_KEYS, MAX_VALUE_CHARS } from './log_filter.ts'

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

Deno.test('caps long string values and drops non-scalars for known keys', () => {
  const out = capArgs({ province: 'x'.repeat(500), drive_max: [1, 2, 3], date_from: '2026-09-01' })
  assertEquals((out.province as string).length, MAX_VALUE_CHARS)
  assert(!('drive_max' in out)) // array for a known key is dropped
  assertEquals(out.date_from, '2026-09-01')
})

Deno.test('every allowlisted key matches a real tool input field', () => {
  // Guard against the allowlist drifting from the schema surface.
  for (const k of ['drive_max', 'province', 'month', 'kids_run', 'id', 'date_from']) {
    assert(ALLOWED_FILTER_KEYS.has(k), `missing ${k}`)
  }
})
