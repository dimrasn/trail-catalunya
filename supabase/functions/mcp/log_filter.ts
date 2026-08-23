// Pure allowlist filter for the anonymous query log. Kept separate from log.ts
// (which imports supabase-js) so it is testable in isolation, and so the
// zero-user-data enforcement has one small auditable home.
//
// ONLY these declared filter keys are ever persisted. Any other key an agent
// sends — declared or not — is dropped, so a mis-composing agent cannot leak
// training data / PII into the log through an undeclared field. Keep in sync
// with the tool inputSchemas in tools.ts.

export const MAX_VALUE_CHARS = 60
// Cap how many items of a list-valued filter (province[], month[], *_ranges[])
// we persist — bounds log size against a hostile huge array.
export const MAX_ARRAY_ITEMS = 12

export const ALLOWED_FILTER_KEYS = new Set([
  'drive_min', 'drive_max', 'dist_min', 'dist_max', 'elev_min', 'elev_max',
  'dist_ranges', 'elev_ranges',
  'province', 'month', 'kids_run', 'date_from', 'date_to', 'limit', 'id',
])

// Reduce one array element to a known-safe shape: a capped string, a raw
// number/boolean, or a {min,max} numeric range — anything else is dropped, so
// no arbitrary object keys or nested values can reach the log.
function capArrayItem(el: unknown): unknown {
  if (typeof el === 'string') return el.slice(0, MAX_VALUE_CHARS)
  if (typeof el === 'number' || typeof el === 'boolean') return el
  if (el && typeof el === 'object') {
    const src = el as Record<string, unknown>
    const r: Record<string, number> = {}
    if (typeof src.min === 'number') r.min = src.min
    if (typeof src.max === 'number') r.max = src.max
    return Object.keys(r).length ? r : null
  }
  return null
}

export function capArgs(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of ALLOWED_FILTER_KEYS) {
    if (!(key in args)) continue
    const v = args[key]
    if (Array.isArray(v)) {
      const items = v.slice(0, MAX_ARRAY_ITEMS).map(capArrayItem).filter((x) => x != null)
      if (items.length) out[key] = items
    } else if (typeof v === 'string') {
      out[key] = v.slice(0, MAX_VALUE_CHARS)
    } else if (v == null || typeof v === 'number' || typeof v === 'boolean') {
      out[key] = v
    }
    // non-scalar, non-array values for a known key are dropped
  }
  return out
}
