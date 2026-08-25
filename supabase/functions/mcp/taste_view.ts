// Pure taste-layer display gate for the MCP (plan v3, KTD6/KTD8). Mirrors
// app/lib/taste.js case-for-case (the parity guard) — same Slice-1 field policy,
// same honesty labels. Turns a parsed taste profile into the full render (for
// get_race) or a compact typed summary (for the list tools). Kept free of
// supabase-js so it is unit-testable in isolation.

export interface TasteRawField {
  value: string
  claim_strength: string
  evidence?: string | null
}
export interface TasteProfile {
  url?: string | null
  town?: string | null
  attributes?: Record<string, TasteRawField>
  editorial?: Record<string, TasteRawField>
}
export interface TasteField {
  key: string
  label: string
  value: string
  strength: string
  strength_label: string
  evidence?: string | null
}

const SLICE1_ATTRIBUTES = [
  'setting', 'course_topology', 'night_race', 'technicality', 'championship',
  'feec_gate', 'tradition_editions', 'aid_stations', 'food', 'kids_race', 'season_heat',
]
const ATTR_LABELS: Record<string, string> = {
  setting: 'Setting', course_topology: 'Course', night_race: 'Night race',
  technicality: 'Technicality', championship: 'Championship', feec_gate: 'FEEC / licence',
  tradition_editions: 'Tradition', aid_stations: 'Aid', food: 'Food',
  kids_race: 'Kids race', season_heat: 'Season & heat',
}
const EDITORIAL_ORDER = ['unique', 'catch', 'who', 'cool', 'reference_point']
const EDITORIAL_LABELS: Record<string, string> = {
  unique: 'What makes it special', catch: 'The catch', who: "Who it's for",
  cool: 'Also nice', reference_point: 'In a word',
}
export const STRENGTH_LABELS: Record<string, string> = {
  organizer_fact: 'Organizer', organizer_pdf: 'Organizer', derived: 'Derived',
  our_read: 'Our read', inference: 'Our guess', dima_firsthand: 'Dima',
}

function cleanValue(v: unknown): string | null {
  if (v == null) return null
  const c = String(v).replace(/\s*[;.,:–—-]+\s*$/, '').replace(/\s+/g, ' ').trim()
  return c.length >= 3 ? c : null
}
function shape(key: string, label: string, f?: TasteRawField): TasteField | null {
  const value = cleanValue(f && f.value)
  if (!value || !f) return null
  return {
    key, label, value,
    strength: f.claim_strength,
    strength_label: STRENGTH_LABELS[f.claim_strength] || f.claim_strength,
    evidence: f.evidence || null,
  }
}

export function tasteForDisplay(profile?: TasteProfile | null): { editorial: TasteField[]; character: TasteField[] } | null {
  if (!profile) return null
  const editorial: TasteField[] = []
  for (const k of EDITORIAL_ORDER) {
    const s = shape(k, EDITORIAL_LABELS[k], profile.editorial && profile.editorial[k])
    if (s) editorial.push(s)
  }
  const character: TasteField[] = []
  for (const k of SLICE1_ATTRIBUTES) {
    const s = shape(k, ATTR_LABELS[k], profile.attributes && profile.attributes[k])
    if (s) character.push(s)
  }
  if (!editorial.length && !character.length) return null
  return { editorial, character }
}

// Queryable filter flags for the list projection (dogfood gap #1) so an agent can
// filter on the differentiated axes in one call. CONSERVATIVE: a flag is set only
// when the taste text clearly states it; ambiguous → absent (unknown, not a
// claim). Derived-from-text — a hint to confirm via get_race, never an assertion.
function bandTechnicality(v?: string): string | undefined {
  const s = (v || '').toLowerCase()
  if (!s) return undefined
  // Word-boundaried: short tokens must not match inside larger words — e.g.
  // Catalan "baixada" (a DESCENT) must not read as "baixa" (low), and "Europe"
  // must not read as "rope". This matters now that we band from the organizer's
  // evidence quote, which is dense with such words (review #1 follow-up).
  if (/molt t[eè]cnic|very technical|highly technical|\brocky\b|scrambl|\bexposed\b|\bchain|\brope|\bextrem|steep technical/.test(s)) return 'high'
  if (/\bbaixa\b|low tech|\brunnable\b|non-?technical|\bsmooth\b|\bgentle\b|\brolling\b|poc t[eè]cnic/.test(s)) return 'low'
  if (/\bmitja\b|\bmedium\b|\bmoderate\b|some technical|partly technical|\bmixed\b|t[eè]cnic/.test(s)) return 'moderate'
  return undefined
}
// A flag is a queryable near-fact, so it may only come from an ORGANIZER-stated
// field (not our derived/inferred read) AND must be affirmatively true — a
// negation like "no night mention" must never set night:true (dogfood audit #6).
const FLAG_ELIGIBLE = new Set(['organizer_fact', 'organizer_pdf'])
export function tasteFlags(profile?: TasteProfile | null): { night?: boolean; technicality?: string } | null {
  if (!profile) return null
  const at = profile.attributes || {}
  const flags: { night?: boolean; technicality?: string } = {}
  const nr = at.night_race
  if (nr && FLAG_ELIGIBLE.has(nr.claim_strength)) {
    const v = (nr.value || '').toLowerCase()
    const negated = /^no\b|no night|not a night|day(time)?\b|di[uü]rn/.test(v)
    const affirmed = /^yes\b|nocturn|night (race|trail|start)|headlamp|headtorch/.test(v)
    if (affirmed && !negated) flags.night = true
  }
  const tc = at.technicality
  if (tc && FLAG_ELIGIBLE.has(tc.claim_strength)) {
    // Band from the ORGANIZER'S OWN WORDS (the evidence quote), never our `value`
    // prose. An organizer_fact `value` routinely blends the organizer quote with
    // our editorial caution — e.g. `"accessible" ... treat with caution given
    // 3470 m D+ on rocky Montsant conglomerate` (evidence: "accessible"). Banding
    // the whole string turned our word "rocky" into a false organizer `high` flag
    // (external review #1). Evidence carries only the organizer's phrasing, so a
    // "high" flag now means the organizer said something high-technical, not us.
    // (night stays on `value` above: its affirmations ARE the organizer's own
    // phrasing there, guarded by the negation check, and often lack an evidence
    // quote — moving it here would drop true night races like "YES — nocturna".)
    const band = bandTechnicality(tc.evidence ?? undefined)
    if (band) flags.technicality = band
  }
  return Object.keys(flags).length ? flags : null
}

// Compact, typed one-liner for the list projection (KTD8): keeps its claim
// strength so a list agent never reads our judgement as an organizer fact.
export function tasteSummary(profile?: TasteProfile | null): { value: string; strength: string; strength_label: string } | null {
  if (!profile) return null
  const ed = profile.editorial || {}, at = profile.attributes || {}
  // Fall back so any taste-bearing race yields a one-liner (dogfood gap #2):
  // special → in-a-word → who-it's-for → the-catch → setting.
  for (const src of [ed.unique, ed.reference_point, ed.who, ed.catch, at.setting]) {
    const value = cleanValue(src && src.value)
    if (value && src) return { value, strength: src.claim_strength, strength_label: STRENGTH_LABELS[src.claim_strength] || src.claim_strength }
  }
  return null
}
