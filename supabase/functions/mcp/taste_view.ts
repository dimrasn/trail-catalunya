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
  if (/molt t[eè]cnic|very technical|highly technical|rocky|scrambl|exposed|chain|rope|extrem|steep technical/.test(s)) return 'high'
  if (/baixa|low tech|runnable|non-?technical|smooth|gentle|rolling|poc t[eè]cnic/.test(s)) return 'low'
  if (/mitja|medium|moderate|some technical|partly technical|mixed|t[eè]cnic/.test(s)) return 'moderate'
  return undefined
}
export function tasteFlags(profile?: TasteProfile | null): { night?: boolean; technicality?: string } | null {
  if (!profile) return null
  const at = profile.attributes || {}
  const flags: { night?: boolean; technicality?: string } = {}
  const night = ((at.night_race && at.night_race.value) || '').toLowerCase()
  if (/\byes\b|night|nocturn|\bnit\b/.test(night)) flags.night = true
  const tech = bandTechnicality(at.technicality && at.technicality.value)
  if (tech) flags.technicality = tech
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
