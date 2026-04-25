// Diff logic for the scraper. Pure functions — no DB, no I/O.
//
// Given:
//   • freshRows  — what the scraper just parsed (deduped, source='ultrescatalunya')
//   • currentRows — what's currently in the DB for the same source
//
// Produce a list of change-event records ready to insert into race_changes.
//
// Rules:
//   • In fresh, not in current                                 → 'added'
//   • In current with status=REMOVED, in fresh as ACTIVA/etc.  → 're_added'
//   • In both, fresh status=REMOVED is impossible (scraper doesn't emit REMOVED)
//   • In both, watched fields differ                           → 'changed'
//   • In current (non-REMOVED), not in fresh                   → 'removed'

import type { Race } from './parser.ts'

// Fields whose value changes count as a 'changed' event. We exclude purely
// derivative or timestamp fields (race_hash, source, scraped_at, last_seen).
const WATCHED_FIELDS = [
  'date',
  'date_display',
  'race_url',
  'distance_km',
  'elevation_m',
  'distance_elevation_raw',
  'price',
  'town',
  'province',
  'status',
] as const

export type ChangeType = 'added' | 'changed' | 'removed' | 're_added'

export interface ChangeEvent {
  race_hash: string
  change_type: ChangeType
  changed_fields: Record<string, { old: unknown; new: unknown }> | null
  before_row: Record<string, unknown> | null
  after_row: Record<string, unknown> | null
}

// Shape of a row coming back from the DB. We accept anything that has the
// fields we read so the caller doesn't have to do strict typing.
export interface DbRaceRow {
  race_hash: string
  status: string
  [key: string]: unknown
}

export function computeChanges(fresh: Race[], current: DbRaceRow[]): ChangeEvent[] {
  const currentByHash = new Map<string, DbRaceRow>()
  for (const r of current) currentByHash.set(r.race_hash, r)

  const freshByHash = new Map<string, Race>()
  for (const r of fresh) freshByHash.set(r.race_hash, r)

  const events: ChangeEvent[] = []

  // Walk fresh rows: detect added / re_added / changed
  for (const fr of fresh) {
    const cur = currentByHash.get(fr.race_hash)

    if (!cur) {
      events.push({
        race_hash: fr.race_hash,
        change_type: 'added',
        changed_fields: null,
        before_row: null,
        after_row: fr as unknown as Record<string, unknown>,
      })
      continue
    }

    if (cur.status === 'REMOVED') {
      events.push({
        race_hash: fr.race_hash,
        change_type: 're_added',
        changed_fields: null,
        before_row: cur,
        after_row: fr as unknown as Record<string, unknown>,
      })
      continue
    }

    // Both exist and the prior status wasn't REMOVED. Diff watched fields.
    const changed: Record<string, { old: unknown; new: unknown }> = {}
    for (const f of WATCHED_FIELDS) {
      const oldVal = cur[f]
      const newVal = (fr as unknown as Record<string, unknown>)[f]
      if (!valuesEqual(oldVal, newVal)) {
        changed[f] = { old: oldVal, new: newVal }
      }
    }
    if (Object.keys(changed).length > 0) {
      events.push({
        race_hash: fr.race_hash,
        change_type: 'changed',
        changed_fields: changed,
        before_row: cur,
        after_row: fr as unknown as Record<string, unknown>,
      })
    }
  }

  // Walk current rows: detect removed (in DB as non-REMOVED, missing from fresh)
  for (const cur of current) {
    if (cur.status === 'REMOVED') continue
    if (freshByHash.has(cur.race_hash)) continue
    events.push({
      race_hash: cur.race_hash,
      change_type: 'removed',
      changed_fields: null,
      before_row: cur,
      after_row: null,
    })
  }

  return events
}

// Loose equality that handles the numeric/string drift between Supabase
// (numerics come back as strings) and freshly-parsed JS numbers.
function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  // Numeric-ish compare: 25 vs "25.0" should be equal.
  const an = Number(a)
  const bn = Number(b)
  if (!Number.isNaN(an) && !Number.isNaN(bn) && String(a).trim() !== '' && String(b).trim() !== '') {
    return an === bn
  }
  return String(a) === String(b)
}

export interface ChangeSummary {
  added: number
  changed: number
  removed: number
  re_added: number
}

export function summarize(events: ChangeEvent[]): ChangeSummary {
  const s: ChangeSummary = { added: 0, changed: 0, removed: 0, re_added: 0 }
  for (const e of events) {
    s[e.change_type]++
  }
  return s
}
