// Pure, framework-free filter logic for the race list. Multi-select by design:
// each bucketed filter (drive / distance / elevation / month / province) holds
// an ARRAY of selected bucket values. Empty array = "Any" (no constraint).
// Semantics: OR within a row (a race matches if it falls in ANY selected
// bucket), AND across rows (every active row must match). Kept out of the
// client component so the round-trip and matching logic is unit-testable —
// mirrors app/lib/format.js. Run: node --test app/lib/filters.test.mjs

// Allowed bucket values per row — the source of truth for URL validation.
// The FilterBar owns the labels; these are just the values a URL may carry.
export const DRIVE_VALUES = ['u60', '60-120', '120+']
export const DISTANCE_VALUES = ['u10', '10-15', '15-21', '21-42', '42+']
export const ELEVATION_VALUES = ['u200', '200-500', '500-1000', '1000-2000', '2000+']
// Accept any calendar month — visible chips are derived from the data, but a
// shared URL may carry any month, so validate against all 12.
export const MONTH_VALUES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
export const PROVINCE_VALUES = ['BARCELONA', 'GIRONA', 'TARRAGONA', 'LLEIDA']

export const DEFAULT_FILTERS = {
  drive: [],
  distance: [],
  elevation: [],
  month: [],
  province: [],
  showTBD: false,
  showPast: false,
  kidsRun: false,
}

// Toggle a value in/out of a selection array (immutably). Used by the chips.
export function toggleValue(selected, value) {
  return selected.includes(value)
    ? selected.filter(v => v !== value)
    : [...selected, value]
}

// --- URL <-> filters ---

// Parse a comma-separated param into a deduped, validated array, preserving
// the canonical order in `allowed` so shared URLs are stable regardless of
// the order the user clicked the chips.
function parseMulti(raw, allowed) {
  if (!raw) return []
  const picked = new Set(raw.split(','))
  return allowed.filter(v => picked.has(v))
}

export function filtersFromParams(sp) {
  return {
    drive: parseMulti(sp.get('drive'), DRIVE_VALUES),
    distance: parseMulti(sp.get('dist'), DISTANCE_VALUES),
    elevation: parseMulti(sp.get('elev'), ELEVATION_VALUES),
    month: parseMulti(sp.get('month'), MONTH_VALUES),
    province: parseMulti(sp.get('prov'), PROVINCE_VALUES),
    showTBD: sp.get('tbd') === '1',
    showPast: sp.get('past') === '1',
    kidsRun: sp.get('kids') === '1',
  }
}

export function filtersToParams(filters) {
  const p = new URLSearchParams()
  if (filters.drive.length) p.set('drive', filters.drive.join(','))
  if (filters.distance.length) p.set('dist', filters.distance.join(','))
  if (filters.elevation.length) p.set('elev', filters.elevation.join(','))
  if (filters.month.length) p.set('month', filters.month.join(','))
  if (filters.province.length) p.set('prov', filters.province.join(','))
  if (filters.showTBD) p.set('tbd', '1')
  if (filters.showPast) p.set('past', '1')
  if (filters.kidsRun) p.set('kids', '1')
  return p.toString()
}

// --- Matchers (OR within a row; empty selection matches everything) ---

export function matchesDrive(race, selected) {
  if (!selected.length) return true
  // Unknown drive time never filters a race out (matches the single-select
  // behaviour that treated null as "can't exclude").
  if (race.driveMinutes == null) return true
  const m = race.driveMinutes
  return selected.some(f => {
    if (f === 'u60') return m < 60
    if (f === '60-120') return m >= 60 && m <= 120
    if (f === '120+') return m > 120
    return false
  })
}

export function matchesDistance(race, selected) {
  if (!selected.length) return true
  if (!race.distances.length) return true
  return race.distances.some(d => {
    const km = d.km
    return selected.some(f => {
      if (f === 'u10') return km < 10
      if (f === '10-15') return km >= 10 && km <= 15
      if (f === '15-21') return km > 15 && km <= 21
      if (f === '21-42') return km > 21 && km <= 42
      if (f === '42+') return km > 42
      return false
    })
  })
}

export function matchesElevation(race, selected) {
  if (!selected.length) return true
  if (!race.distances.length) return true
  const hasAnyElev = race.distances.some(d => d.elevationGain != null)
  if (!hasAnyElev) return true
  return race.distances.some(d => {
    const e = d.elevationGain
    if (e == null) return false
    return selected.some(f => {
      if (f === 'u200') return e < 200
      if (f === '200-500') return e >= 200 && e < 500
      if (f === '500-1000') return e >= 500 && e < 1000
      if (f === '1000-2000') return e >= 1000 && e < 2000
      if (f === '2000+') return e >= 2000
      return false
    })
  })
}

export function matchesMonth(race, selected) {
  if (!selected.length) return true
  // A race whose month is known but whose exact day is not (expectedMonth)
  // still belongs in that month — otherwise the source-dated events are
  // invisible to every month filter. The card labels it "(expected)".
  if (!race.date) {
    return race.expectedMonth != null &&
      selected.includes(String(race.expectedMonth).padStart(2, '0'))
  }
  return selected.includes(race.date.slice(5, 7))
}

export function matchesProvince(race, selected) {
  if (!selected.length) return true
  return selected.includes(race.province)
}
