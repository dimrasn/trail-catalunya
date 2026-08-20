// Pure allowlist filter for the anonymous query log. Kept separate from log.ts
// (which imports supabase-js) so it is testable in isolation, and so the
// zero-user-data enforcement has one small auditable home.
//
// ONLY these declared filter keys are ever persisted. Any other key an agent
// sends — declared or not — is dropped, so a mis-composing agent cannot leak
// training data / PII into the log through an undeclared field. Keep in sync
// with the tool inputSchemas in tools.ts.

export const MAX_VALUE_CHARS = 60

export const ALLOWED_FILTER_KEYS = new Set([
  'drive_max', 'dist_min', 'dist_max', 'elev_min', 'elev_max',
  'province', 'month', 'kids_run', 'date_from', 'date_to', 'limit', 'id',
])

export function capArgs(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of ALLOWED_FILTER_KEYS) {
    if (!(key in args)) continue
    const v = args[key]
    if (typeof v === 'string') out[key] = v.slice(0, MAX_VALUE_CHARS)
    else if (v == null || typeof v === 'number' || typeof v === 'boolean') out[key] = v
    // non-scalar values for a known key are dropped (never expected by schema)
  }
  return out
}
