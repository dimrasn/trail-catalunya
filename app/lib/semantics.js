// Full de Ruta semantics for the site. One hue, one meaning: difficulty owns
// the ramp; green appears once more as the celebrated <=60min drive band;
// everything else is ink. Ramp A (equal-lightness pastels) per the decision
// log Q4 — a Ramp-B swap only touches LEVELS here.

export const LEVELS = {
  Easy:        { bg: '#ADE3BF', ink: '#103C28' },
  Moderate:    { bg: '#DFD69D', ink: '#3F380E' },
  Hard:        { bg: '#F9CAA2', ink: '#593215' },
  'Very hard': { bg: '#FFC2BC', ink: '#662F2C' },
  Extreme:     { bg: '#B04A44', ink: '#FDF3F2' },
  Brutal:      { bg: '#4F1F1E', ink: '#F3E2E1' },
}
const UNRATED = { bg: '#F1F4F6', ink: '#5F6469' }
export const LEVEL_ORDER = Object.keys(LEVELS)

export function difficultyToken(levelWord) {
  return LEVELS[levelWord] || UNRATED
}

// Drive bands get the full difficulty treatment (Dima's ruling 2026-08-24,
// specimen option B): banded chips on the warm ramp — near green, mid amber,
// far red — word + time always together. The known trade-off (warm hues also
// mean difficulty) is accepted; the chip's band word disambiguates.
export const DRIVE_INK = { near: '#04884D', mid: '#A85B00', far: '#AC3031' }
export const DRIVE_CHIP = {
  near: { bg: '#ADE3BF', ink: '#103C28', word: 'NEAR' },
  mid:  { bg: '#F9CAA2', ink: '#593215', word: 'MID' },
  far:  { bg: '#B04A44', ink: '#FDF3F2', word: 'FAR' },
}
export function driveBand(minutes) {
  if (minutes == null) return null
  if (minutes <= 60) return 'near'
  if (minutes <= 120) return 'mid'
  return 'far'
}

// "5 · 21 · 42 km" — the menu it actually is. Never a range.
export function enumerateDistances(distances) {
  if (!distances || distances.length === 0) return null
  const kms = [...new Set(distances.map(d => d.km))].sort((a, b) => a - b)
  return `${kms.join(' · ')} km`
}

// Climb aggregate for the card signal line. Complete-data-only (docs/rules.md
// R14, Codex 2026-08-25 P1-1): a partial max would present the largest KNOWN
// figure as the event maximum — a distance with no published climb makes the
// whole aggregate unpublishable, and we say so instead of guessing.
export function climbSummary(distances) {
  if (!distances || distances.length === 0) return null
  const known = distances.filter(d => d.elevationGain != null)
  if (known.length === 0) return 'climb not published'
  if (known.length < distances.length) return 'climb not fully published'
  return `up to ${Math.max(...known.map(d => d.elevationGain))} D+`
}

// "Next two weekends" means actual weekends (Codex P2-4) — a rolling 14-day
// window spans weekdays and, on a Sunday, parts of three weekends, so the
// label would lie. A weekend window is Fri–Sun (Friday-night races are real);
// an in-progress weekend counts as the first window.
function isoShift(iso, days) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

export function nextTwoWeekendWindows(todayIso) {
  const [y, m, d] = todayIso.split('-').map(Number)
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0=Sun … 6=Sat
  // Days until the Sunday closing the current-or-next weekend window.
  const toSunday = dow === 0 ? 0 : 7 - dow
  const sun1 = isoShift(todayIso, toSunday)
  const sun2 = isoShift(sun1, 7)
  return [[isoShift(sun1, -2), sun1], [isoShift(sun2, -2), sun2]]
}

export function inAnyWindow(dateIso, dateEndIso, windows) {
  if (!dateIso) return false
  const end = dateEndIso || dateIso
  return windows.some(([from, to]) => dateIso <= to && end >= from)
}

// Verdict three-state design; v1 ships states 1 and 3 only: an editorial
// verdict from the taste layer, or NOTHING. No templated prose — the factual
// signals already live in the gate / card signal line (decision log Q7).
export function verdictFor(race) {
  const item = race?.taste?.editorial?.find(e => e.key === 'unique')
  if (!item || !item.value) return null
  return { text: item.value, label: item.strengthLabel || 'Our read' }
}
