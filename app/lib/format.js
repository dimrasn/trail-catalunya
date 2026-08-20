// Pure formatting helpers shared by the homepage cards and the per-race
// pages. Kept framework-free (no JSX, no browser APIs) so they run in
// server components and are unit-testable. RaceCard.jsx keeps its own inline
// copies for now; this is the canonical home as more surfaces need them.

export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

function fmtKm(km) {
  return km % 1 === 0 ? String(km) : String(km)
}

// "21.4 km" (one distance) or "15.7–21.4 km" (range).
export function distancesSummary(distances) {
  const kms = distances.map(d => d.km).filter(k => k != null)
  if (kms.length === 0) return null
  const min = Math.min(...kms)
  const max = Math.max(...kms)
  return min === max ? `${fmtKm(min)} km` : `${fmtKm(min)}–${fmtKm(max)} km`
}

// "↑650–1090 m" across the distances that have elevation, or null.
export function elevationSummary(distances) {
  const els = distances.map(d => d.elevationGain).filter(e => e != null)
  if (els.length === 0) return null
  const min = Math.min(...els)
  const max = Math.max(...els)
  return min === max ? `↑${min} m` : `↑${min}–${max} m`
}

export function maxElevation(distances) {
  const els = distances.map(d => d.elevationGain).filter(e => e != null)
  return els.length ? Math.max(...els) : null
}

export function yearOf(dateStr) {
  return dateStr ? dateStr.slice(0, 4) : null
}
