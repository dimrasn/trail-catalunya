// Pure event-level filtering + input normalization for the MCP tools. Kept out
// of tools.ts (which imports supabase-js) so it is unit-testable in isolation —
// the same rationale as difficulty.ts. Multi-value by design: province/month are
// OR-matched lists, distance/elevation support disjoint OR-ed bands (via
// difficulty.ts), and drive_min/drive_max form a band. Different filters AND
// together. Run: deno test --allow-read --no-check supabase/functions/mcp/tools_filter_test.ts

import { type Dist, distanceMatches, hasVariantFilter, type Range } from './difficulty.ts'

export interface Filters {
  drive_min?: number
  drive_max?: number
  dist_min?: number
  dist_max?: number
  elev_min?: number
  elev_max?: number
  dist_ranges?: Range[]
  elev_ranges?: Range[]
  // province and month are OR-matched lists (a single value is a 1-element list).
  province?: string[]
  month?: number[]
  kids_run?: boolean
  date_from?: string
  date_to?: string
}

// The minimal event shape the filter reads — applyFilters stays decoupled from
// the fuller EnrichedEvent in tools.ts and is generic over it.
export interface FilterableEvent {
  drive_minutes_from_barcelona: number | null
  province: string
  kidsRun: boolean
  distances: Dist[]
  date: string | null
  dateEnd?: string | null
}

// Returns { kept, tbdExcluded }. A date/month filter excludes null-date (TBD)
// races; we count them so the agent knows the window result isn't exhaustive.
export function applyFilters<T extends FilterableEvent>(
  events: T[],
  f: Filters,
): { kept: T[]; tbdExcluded: number } {
  const dateFiltering = (f.month != null && f.month.length > 0) || f.date_from != null || f.date_to != null
  const variantFiltering = hasVariantFilter(f)
  let tbdExcluded = 0

  const provinceSet = f.province?.length
    ? new Set(f.province.map((p) => p.toUpperCase()))
    : null

  const kept = events.filter((e) => {
    // Drive band: unknown drive time is excluded once any drive bound is set
    // (matches the pre-band behaviour of drive_max).
    if (f.drive_min != null || f.drive_max != null) {
      const dm = e.drive_minutes_from_barcelona
      if (dm == null) return false
      if (f.drive_min != null && dm < f.drive_min) return false
      if (f.drive_max != null && dm > f.drive_max) return false
    }
    if (provinceSet && !provinceSet.has(e.province.toUpperCase())) return false
    if (f.kids_run && !e.kidsRun) return false

    // A distance/elevation filter keeps the event only if at least one distance
    // satisfies ALL supplied predicates together (same variant, never split
    // across siblings). Within a dimension, bands are OR-ed (see difficulty.ts).
    if (variantFiltering && !e.distances.some((d) => distanceMatches(d, f))) return false

    if (dateFiltering) {
      if (!e.date) { tbdExcluded++; return false }
      // Multi-day races span [date, dateEnd]; match on range overlap so a
      // Fri–Sun race is found by a Saturday query (and a cross-month race by
      // either month).
      const start = e.date
      const end = e.dateEnd || e.date
      if (f.month?.length) {
        const sM = parseInt(start.slice(5, 7))
        const eM = parseInt(end.slice(5, 7))
        // OR across selected months: keep if ANY falls in the race's [sM, eM].
        if (!f.month.some((m) => m >= sM && m <= eM)) return false
      }
      if (f.date_from && end < f.date_from) return false
      if (f.date_to && start > f.date_to) return false
    }

    return true
  })

  // When the caller filtered by distance/elevation, attach the matching
  // variant(s) so the agent knows WHICH distance qualified. The event's
  // difficulty stays the full-event max (scope: event_max) — it never shifts
  // with the filter.
  const withMatches = variantFiltering
    ? kept.map((e) => ({ ...e, matched_distances: e.distances.filter((d) => distanceMatches(d, f)) }))
    : kept

  return { kept: withMatches as T[], tbdExcluded }
}

// --- Input normalizers: accept a scalar, an array, or a comma-separated string
// so both legacy single-value callers and new multi-value callers work. ---

export const MAX_VALUE_CHARS_HINT = 60

function num(v: unknown): number | undefined {
  if (v == null) return undefined
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isNaN(n) ? undefined : n
}

export function strList(v: unknown): string[] | undefined {
  if (v == null) return undefined
  const arr = Array.isArray(v) ? v : String(v).split(',')
  const out = arr.map((x) => String(x).trim()).filter(Boolean)
  return out.length ? out : undefined
}

export function numList(v: unknown): number[] | undefined {
  if (v == null) return undefined
  const arr = Array.isArray(v) ? v : String(v).split(',')
  const out = arr.map((x) => num(x)).filter((n): n is number => n != null)
  return out.length ? out : undefined
}

// Sanitize an array of {min,max} bands, dropping empties and non-numeric bounds.
export function rangeList(v: unknown): Range[] | undefined {
  if (!Array.isArray(v)) return undefined
  const out: Range[] = []
  for (const r of v) {
    if (r == null || typeof r !== 'object') continue
    const min = num((r as Record<string, unknown>).min)
    const max = num((r as Record<string, unknown>).max)
    if (min == null && max == null) continue
    out.push({ min, max })
  }
  return out.length ? out : undefined
}
