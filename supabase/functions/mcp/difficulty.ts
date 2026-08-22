// Pure difficulty + variant-matching helpers for the MCP, mirroring
// app/lib/format.js on the site. Kept out of tools.ts (which imports
// supabase-js) so it is unit-testable in isolation, and so site/MCP parity is
// guarded by the same set of test cases on both sides (the app/lib/races.js ↔
// grouping.ts parity principle, applied to the difficulty contract).

export interface Dist {
  km: number
  elevationGain?: number | null
}

// km-effort (km-esforç): km + D+/100. Only when BOTH km and D+ are known — never
// substitute zero for a missing climb (that would understate).
export function kmEffort(d: Dist): number | null {
  if (d.km == null || d.elevationGain == null) return null
  return Math.round((d.km + d.elevationGain / 100) * 10) / 10
}

// ITRA Endurance Points (0-6) from km-effort — ITRA's published, verified table
// (itra.run): 0-24→0, 25-44→1, 45-74→2, 75-114→3, 115-154→4, 155-209→5, 210+→6.
export function itraPoints(v: number | null): number | null {
  if (v == null) return null
  if (v < 25) return 0
  if (v < 45) return 1
  if (v < 75) return 2
  if (v < 115) return 3
  if (v < 155) return 4
  if (v < 210) return 5
  return 6
}

// Human 6-level difficulty word, mapped onto ITRA's km-effort boundaries
// (ITRA points 4 and 5 — the big-ultra range — merged into one "Extreme" tier).
export function difficultyLevel(v: number | null): string | null {
  if (v == null) return null
  if (v < 25) return 'Easy'
  if (v < 45) return 'Moderate'
  if (v < 75) return 'Hard'
  if (v < 115) return 'Very hard'
  if (v < 210) return 'Extreme'
  return 'Brutal'
}

// Vertical density: metres of climb per km. Separates a runnable course from a
// mountainous one at the same km-effort. null unless both inputs are known.
export function dPlusPerKm(d: Dist): number | null {
  if (d.km == null || d.km === 0 || d.elevationGain == null) return null
  return Math.round(d.elevationGain / d.km)
}

// Event aggregate = the hardest distance, but ONLY when EVERY distance has a
// known km-effort. A partial max is misleading (an unknown-D+ option silently
// drops out and understates the event), so a partial or empty event returns
// null — meaning "no reliable event maximum", not "zero effort".
export function eventKmEffort(distances: Dist[]): number | null {
  const ds = distances || []
  if (ds.length === 0) return null
  const vals = ds.map(kmEffort)
  if (vals.some((v) => v == null)) return null
  return Math.max(...(vals as number[]))
}

export interface VariantFilter {
  dist_min?: number
  dist_max?: number
  elev_min?: number
  elev_max?: number
}

// A single distance must satisfy ALL supplied distance + elevation predicates —
// same-variant matching, so one distance can't satisfy the km bound while a
// sibling satisfies the D+ bound. An elevation predicate fails a distance with
// unknown D+.
export function distanceMatches(d: Dist, f: VariantFilter): boolean {
  if (f.dist_min != null && !(d.km >= f.dist_min)) return false
  if (f.dist_max != null && !(d.km <= f.dist_max)) return false
  if (f.elev_min != null && (d.elevationGain == null || d.elevationGain < f.elev_min)) return false
  if (f.elev_max != null && (d.elevationGain == null || d.elevationGain > f.elev_max)) return false
  return true
}

export function hasVariantFilter(f: VariantFilter): boolean {
  return f.dist_min != null || f.dist_max != null || f.elev_min != null || f.elev_max != null
}
