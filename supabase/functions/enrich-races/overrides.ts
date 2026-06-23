// U6 — admin override layer (R15, KTD6). A committed JSON file lets the
// maintainer correct or set any stable fact; overrides beat crawled values and
// carry a note. Access control is git/branch permissions + a CODEOWNERS entry;
// integrity is this loader's strict schema validation (unknown keys / bad enums
// fail loudly, never a partial apply). It can also mark a URL skip/un-crawlable.
//
// Run: deno test supabase/functions/enrich-races/overrides.ts (see overrides_test.ts)

import {
  type Confidence,
  type Edition,
  type Fact,
  type FactSet,
  STABLE_FACT_KEYS,
  type StableFactKey,
  eventKey,
} from './types.ts'

const RECORD_KEYS = new Set(['source', 'race_url', 'town', 'skip', 'facts'])
const FACT_INPUT_KEYS = new Set(['value', 'note', 'confidence', 'edition'])
const VALID_CONFIDENCE = new Set(['high', 'medium', 'low', 'unknown'])
const VALID_EDITION = new Set(['2026', 'previous', 'unknown'])

export interface OverrideFactInput {
  value: string | null
  note?: string
  confidence?: Confidence
  edition?: Edition
}

export interface OverrideRecord {
  source?: string
  race_url: string
  town: string
  skip?: boolean
  facts?: Partial<Record<StableFactKey, OverrideFactInput>>
}

function fail(msg: string): never {
  throw new Error(`enrichment-overrides: ${msg}`)
}

// Strict validation. Throws on any unexpected shape so a malformed or
// semantically-bad file is caught at load, not silently half-applied.
export function parseOverrides(json: unknown): OverrideRecord[] {
  if (json == null) return []
  if (!Array.isArray(json)) fail('top level must be an array')
  return json.map((raw, i) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail(`record ${i} must be an object`)
    const rec = raw as Record<string, unknown>
    for (const k of Object.keys(rec)) {
      if (!RECORD_KEYS.has(k)) fail(`record ${i} has unknown key "${k}"`)
    }
    if (typeof rec.race_url !== 'string' || !rec.race_url.trim()) fail(`record ${i} missing race_url`)
    if (typeof rec.town !== 'string' || !rec.town.trim()) fail(`record ${i} missing town`)
    if ('skip' in rec && typeof rec.skip !== 'boolean') fail(`record ${i} skip must be boolean`)

    const facts: Partial<Record<StableFactKey, OverrideFactInput>> = {}
    if ('facts' in rec && rec.facts != null) {
      if (typeof rec.facts !== 'object' || Array.isArray(rec.facts)) fail(`record ${i} facts must be an object`)
      for (const [k, v] of Object.entries(rec.facts as Record<string, unknown>)) {
        if (!STABLE_FACT_KEYS.includes(k as StableFactKey)) fail(`record ${i} unknown fact "${k}"`)
        if (!v || typeof v !== 'object') fail(`record ${i} fact "${k}" must be an object`)
        const fv = v as Record<string, unknown>
        for (const fk of Object.keys(fv)) {
          if (!FACT_INPUT_KEYS.has(fk)) fail(`record ${i} fact "${k}" has unknown key "${fk}"`)
        }
        if (!('value' in fv) || (fv.value !== null && typeof fv.value !== 'string')) {
          fail(`record ${i} fact "${k}" needs a string|null value`)
        }
        if ('confidence' in fv && !VALID_CONFIDENCE.has(fv.confidence as string)) fail(`record ${i} fact "${k}" bad confidence`)
        if ('edition' in fv && !VALID_EDITION.has(fv.edition as string)) fail(`record ${i} fact "${k}" bad edition`)
        if ('note' in fv && typeof fv.note !== 'string') fail(`record ${i} fact "${k}" note must be a string`)
        facts[k as StableFactKey] = fv as unknown as OverrideFactInput
      }
    }
    return {
      source: typeof rec.source === 'string' ? rec.source : undefined,
      race_url: (rec.race_url as string).trim(),
      town: (rec.town as string).trim(),
      skip: rec.skip === true,
      facts,
    }
  })
}

export async function loadOverrides(path: string | URL): Promise<OverrideRecord[]> {
  let text: string
  try {
    text = await Deno.readTextFile(path)
  } catch {
    return [] // no file yet → no overrides
  }
  if (!text.trim()) return []
  return parseOverrides(JSON.parse(text))
}

// Index overrides by event key for O(1) lookup in the orchestrator.
export function indexOverrides(records: OverrideRecord[], defaultSource: string): Map<string, OverrideRecord> {
  const map = new Map<string, OverrideRecord>()
  for (const rec of records) {
    const key = eventKey(rec.source ?? defaultSource, rec.race_url, rec.town)
    if (key) map.set(key, rec)
  }
  return map
}

// Overlay an override onto crawled facts. Each overridden fact wins, defaults to
// high confidence / 2026 edition, and records the note as evidence. Returns the
// merged facts and the resulting origin ('override' if anything applied).
export function mergeWithOverride(
  crawled: FactSet,
  rec: OverrideRecord | undefined,
  nowIso: string,
): { facts: FactSet; origin: 'crawl' | 'override' } {
  if (!rec || !rec.facts || Object.keys(rec.facts).length === 0) {
    return { facts: crawled, origin: 'crawl' }
  }
  const facts: FactSet = { ...crawled }
  for (const key of STABLE_FACT_KEYS) {
    const input = rec.facts[key]
    if (!input) continue
    const fact: Fact = {
      value: input.value,
      confidence: input.value ? (input.confidence ?? 'high') : 'unknown',
      edition: input.edition ?? '2026',
      evidence: input.note ?? null,
      source_url: null,
      last_checked: nowIso,
    }
    facts[key] = fact
  }
  return { facts, origin: 'override' }
}
