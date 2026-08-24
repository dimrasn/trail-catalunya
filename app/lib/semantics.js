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

// Verdict three-state design; v1 ships states 1 and 3 only: an editorial
// verdict from the taste layer, or NOTHING. No templated prose — the factual
// signals already live in the gate / card signal line (decision log Q7).
export function verdictFor(race) {
  const item = race?.taste?.editorial?.find(e => e.key === 'unique')
  if (!item || !item.value) return null
  return { text: item.value, label: item.strengthLabel || 'Our read' }
}
