// Pure taste-layer display gate (plan v3, KTD6). Turns a parsed taste profile
// (parsed/taste.json, keyed by race_url::town) into the render-ready sections,
// applying the Slice-1 field policy + the honesty labels. Framework-free +
// unit-tested (taste.test.mjs); mirrored by mcp/taste_view.ts (the parity guard).
//
// SLICE 1 (2026-08-22): editorial + clean character attributes only. Operational
// facts (start_time/cutoffs/logistics) are DEFERRED to Slice 2 — they garble on
// multi-distance "compound" bullets and carry the prior-edition staleness risk,
// so they need hand-splitting + the edition gate before they publish. Character
// is evergreen, so Slice 1 sidesteps the prior-edition P0 entirely.

const SLICE1_ATTRIBUTES = [
  'setting', 'course_topology', 'night_race', 'technicality', 'championship',
  'feec_gate', 'tradition_editions', 'aid_stations', 'food', 'kids_race', 'season_heat',
]

const ATTR_LABELS = {
  setting: 'Setting', course_topology: 'Course', night_race: 'Night race',
  technicality: 'Technicality', championship: 'Championship', feec_gate: 'FEEC / licence',
  tradition_editions: 'Tradition', aid_stations: 'Aid', food: 'Food',
  kids_race: 'Kids race', season_heat: 'Season & heat',
}

// Editorial in reading order (page contract): special → catch → who → extras.
const EDITORIAL_ORDER = ['unique', 'catch', 'who', 'cool', 'reference_point']
const EDITORIAL_LABELS = {
  unique: 'What makes it special', catch: 'The catch', who: "Who it's for",
  cool: 'Also nice', reference_point: 'In a word',
}

// Plain user-facing provenance label per claim strength (never colour-only).
export const STRENGTH_LABELS = {
  organizer_fact: 'Organizer', organizer_pdf: 'Organizer', derived: 'Derived',
  our_read: 'Our read', inference: 'Our guess', dima_firsthand: 'Dima',
}

// A value survives the gate if it isn't empty/garble after trimming dangling
// separators (the compound-bullet residue). Short/empty → hidden, not shown broken.
function cleanValue(v) {
  if (v == null) return null
  const c = String(v).replace(/\s*[;.,:–—-]+\s*$/, '').replace(/\s+/g, ' ').trim()
  return c.length >= 3 ? c : null
}

function shape(key, label, f) {
  const value = cleanValue(f && f.value)
  if (!value) return null
  return {
    key,
    label,
    value,
    strength: f.claim_strength,
    strengthLabel: STRENGTH_LABELS[f.claim_strength] || f.claim_strength,
    evidence: f.evidence || null,
  }
}

// Returns { editorial:[], character:[] } for a race page, or null if nothing
// survives. `profile` is one entry from taste.json (or null when no taste row).
export function tasteForDisplay(profile) {
  if (!profile) return null
  const editorial = []
  for (const k of EDITORIAL_ORDER) {
    const s = shape(k, EDITORIAL_LABELS[k], profile.editorial && profile.editorial[k])
    if (s) editorial.push(s)
  }
  const character = []
  for (const k of SLICE1_ATTRIBUTES) {
    const s = shape(k, ATTR_LABELS[k], profile.attributes && profile.attributes[k])
    if (s) character.push(s)
  }
  if (!editorial.length && !character.length) return null
  return { editorial, character }
}

// The one-line summary for the MCP list projection (KTD8): the "special" line,
// or the "in a word" reference. Kept typed with its strength so a list agent
// never reads our judgement as an organizer fact.
export function tasteSummary(profile) {
  if (!profile) return null
  const src = (profile.editorial && (profile.editorial.unique || profile.editorial.reference_point)) || null
  const value = cleanValue(src && src.value)
  if (!value) return null
  return { value, strength: src.claim_strength, strengthLabel: STRENGTH_LABELS[src.claim_strength] || src.claim_strength }
}
