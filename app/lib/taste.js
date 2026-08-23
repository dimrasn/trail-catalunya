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

// Queryable filter flags for the MCP list projection (dogfood gap #1) so an agent
// can filter on the differentiated axes in one call instead of N get_race's.
// CONSERVATIVE by design: a flag is set ONLY when the taste text clearly states
// it; anything ambiguous stays absent (= unknown, not a claim). Derived-from-text,
// so the agent should treat it as a hint and confirm specifics via get_race.
function bandTechnicality(v) {
  const s = (v || '').toLowerCase()
  if (!s) return undefined
  if (/molt t[eè]cnic|very technical|highly technical|rocky|scrambl|exposed|chain|rope|extrem|steep technical/.test(s)) return 'high'
  if (/baixa|low tech|runnable|non-?technical|smooth|gentle|rolling|poc t[eè]cnic/.test(s)) return 'low'
  if (/mitja|medium|moderate|some technical|partly technical|mixed|t[eè]cnic/.test(s)) return 'moderate'
  return undefined
}
// A flag is a queryable near-fact: only from an ORGANIZER-stated field (not our
// derived/inferred read), and affirmatively true — "no night mention" must never
// set night:true (dogfood audit #6).
const FLAG_ELIGIBLE = new Set(['organizer_fact', 'organizer_pdf'])
export function tasteFlags(profile) {
  if (!profile) return null
  const at = profile.attributes || {}
  const flags = {}
  const nr = at.night_race
  if (nr && FLAG_ELIGIBLE.has(nr.claim_strength)) {
    const v = (nr.value || '').toLowerCase()
    const negated = /^no\b|no night|not a night|day(time)?\b|di[uü]rn/.test(v)
    const affirmed = /^yes\b|nocturn|night (race|trail|start)|headlamp|headtorch/.test(v)
    if (affirmed && !negated) flags.night = true
  }
  const tc = at.technicality
  if (tc && FLAG_ELIGIBLE.has(tc.claim_strength)) {
    const band = bandTechnicality(tc.value)
    if (band) flags.technicality = band
  }
  return Object.keys(flags).length ? flags : null
}

// The one-line summary for the MCP list projection (KTD8): the "special" line,
// or the "in a word" reference. Kept typed with its strength so a list agent
// never reads our judgement as an organizer fact.
export function tasteSummary(profile) {
  if (!profile) return null
  const ed = profile.editorial || {}, at = profile.attributes || {}
  // Fall back so any taste-bearing race yields a one-liner (dogfood gap #2):
  // special → in-a-word → who-it's-for → the-catch → setting.
  for (const src of [ed.unique, ed.reference_point, ed.who, ed.catch, at.setting]) {
    const value = cleanValue(src && src.value)
    if (value) return { value, strength: src.claim_strength, strengthLabel: STRENGTH_LABELS[src.claim_strength] || src.claim_strength }
  }
  return null
}
