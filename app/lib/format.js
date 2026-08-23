// Pure formatting helpers shared by the homepage cards and the per-race
// pages. Kept framework-free (no JSX, no browser APIs) so they run in
// server components and are unit-testable. RaceCard.jsx keeps its own inline
// copies for now; this is the canonical home as more surfaces need them.

export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export const PROVINCE_COLOR = {
  BARCELONA: '#2563eb',
  GIRONA: '#059669',
  TARRAGONA: '#dc2626',
  LLEIDA: '#d97706',
}

export const PROVINCE_TITLE = {
  BARCELONA: 'Barcelona',
  GIRONA: 'Girona',
  TARRAGONA: 'Tarragona',
  LLEIDA: 'Lleida',
}

function parseDateParts(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return { y, m, d }
}

// "Sat 05 Sep 2026"
export function formatDateFull(dateStr) {
  const { y, m, d } = parseDateParts(dateStr)
  const date = new Date(y, m - 1, d)
  return `${WEEKDAYS[date.getDay()]} ${String(d).padStart(2, '0')} ${MONTHS_SHORT[m - 1]} ${y}`
}

// "Sat 05–Sun 06 Sep 2026" / cross-month variant.
export function formatDateRangeFull(dateStr, dateEndStr) {
  const { y, m, d } = parseDateParts(dateStr)
  const start = new Date(y, m - 1, d)
  const { d: dEnd, m: mEnd } = parseDateParts(dateEndStr)
  const end = new Date(y, mEnd - 1, dEnd)
  const dayStart = String(d).padStart(2, '0')
  const dayEnd = String(dEnd).padStart(2, '0')
  if (m === mEnd) {
    return `${WEEKDAYS[start.getDay()]} ${dayStart}–${WEEKDAYS[end.getDay()]} ${dayEnd} ${MONTHS_SHORT[m - 1]} ${y}`
  }
  return `${WEEKDAYS[start.getDay()]} ${dayStart} ${MONTHS_SHORT[m - 1]}–${WEEKDAYS[end.getDay()]} ${dayEnd} ${MONTHS_SHORT[mEnd - 1]} ${y}`
}

export function displayDate(race) {
  if (!race.date) return null
  return race.dateEnd ? formatDateRangeFull(race.date, race.dateEnd) : formatDateFull(race.date)
}

// Drive minutes → "38 min" / "1h 20m".
export function formatDrive(minutes) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// The go / day-trip / commit verdict, encoded as colour.
export function driveColor(minutes) {
  if (minutes <= 60) return '#4ade80'
  if (minutes <= 120) return '#fbbf24'
  return '#888888'
}

// Distances and elevations are DISCRETE options a runner picks between, not a
// continuous span. Rendering them as a range ("18–25 km") asserts that
// everything in between exists — Trail de Monells offers exactly 18 and 25.
// See docs/rules.md R1. Sorted ascending, de-duplicated, comma-joined.
function fmtNumList(values) {
  return [...new Set(values)].sort((a, b) => a - b).join(', ')
}

// "21.4 km" (one distance) or "18, 25 km" (several).
export function distancesSummary(distances) {
  const kms = (distances || []).map(d => d.km).filter(k => k != null)
  if (kms.length === 0) return null
  return `${fmtNumList(kms)} km`
}

// "↑650 m" / "↑650–1090 m" — the event's climb SPAN.
//
// R1 (comma-joined lists) deliberately does NOT apply here. A distance is a
// thing a runner selects; its climb is a property of that selection. Listing
// climbs severs which climb belongs to which distance — a worse distortion than
// the span it would replace. Per-variant D+ stays in the distances table.
//
// Returns null unless EVERY distance has a known climb, mirroring
// eventKmEffort(): a partial maximum silently drops the unknown variants and
// understates the event.
export function elevationSummary(distances) {
  const ds = distances || []
  if (ds.length === 0) return null
  const els = ds.map(d => d.elevationGain)
  if (els.some(e => e == null)) return null
  const min = Math.min(...els)
  const max = Math.max(...els)
  return min === max ? `↑${min} m` : `↑${min}–${max} m`
}

// Max climb across an event, ONLY when every distance has one. Distinct from
// maxElevation(), which maxes whatever is known and is therefore unsafe to
// publish as an event-level aggregate.
export function completeMaxElevation(distances) {
  const ds = distances || []
  if (ds.length === 0) return null
  const els = ds.map(d => d.elevationGain)
  return els.some(e => e == null) ? null : Math.max(...els)
}

// The distance+climb fragment for page titles and meta descriptions.
// NEVER juxtaposes a distance list with a bare maximum climb: Ultra Pirineu's
// title read "5–100 km / 6600 m D+", which describes a 5 km race with 6600 m of
// ascent. With several distances the climb is explicitly marked "up to"; with
// one, the two numbers genuinely belong to each other. See docs/rules.md R2.
export function metadataDistancePart(distances) {
  const ds = distances || []
  const dist = distancesSummary(ds)
  if (!dist) return null
  // Complete data only: "up to 6600 m D+" beside a distance list implies the
  // whole list is covered. On a partially-known event it is not.
  const maxEl = completeMaxElevation(ds)
  if (maxEl == null) return dist
  const distinctKms = new Set(ds.map(d => d.km).filter(k => k != null))
  return distinctKms.size === 1 ? `${dist} / ${maxEl} m D+` : `${dist} · up to ${maxEl} m D+`
}

// A race whose exact date is unpublished but whose month we know: "August 2026".
// This is an EXPECTED month, never a confirmed date — callers must present it
// as such and must not emit it as a date in structured data.
export function expectedDateLabel(monthNum, year) {
  if (monthNum == null || year == null) return null
  if (!(monthNum >= 1 && monthNum <= 12)) return null
  return `${MONTHS_LONG[monthNum - 1]} ${year}`
}

export function maxElevation(distances) {
  const els = distances.map(d => d.elevationGain).filter(e => e != null)
  return els.length ? Math.max(...els) : null
}

export function yearOf(dateStr) {
  return dateStr ? dateStr.slice(0, 4) : null
}

// km-effort (km-esforç): the native FEEC/ITRA difficulty metric — flat km plus
// ~1 flat km per 100 m of climb. One number that compares a flat-fast 30k
// against a brutal 18k. Only computed when both km and D+ are known, so it never
// understates a race whose elevation we don't have. v1 heuristic.
export function kmEffort(distance) {
  if (!distance || distance.km == null || distance.elevationGain == null) return null
  return Math.round((distance.km + distance.elevationGain / 100) * 10) / 10
}

// The headline km-effort for an event = the hardest of its distances — but ONLY
// when EVERY distance has a known km-effort. A partial max is misleading (a 42 km
// option with unknown D+ would silently drop out and understate the event), so a
// partial or empty event returns null. Known per-distance values stay available.
export function eventKmEffort(distances) {
  const ds = distances || []
  if (ds.length === 0) return null
  const vals = ds.map(kmEffort)
  if (vals.some((v) => v == null)) return null
  return Math.max(...vals)
}

// ITRA Endurance Points (0-6) from km-effort — ITRA's published, verified table
// (itra.run): 0-24→0, 25-44→1, 45-74→2, 75-114→3, 115-154→4, 155-209→5, 210+→6.
export function itraPoints(v) {
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
export function difficultyLevel(v) {
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
export function dPlusPerKm(distance) {
  if (!distance || distance.km == null || distance.km === 0 || distance.elevationGain == null) return null
  return Math.round(distance.elevationGain / distance.km)
}
