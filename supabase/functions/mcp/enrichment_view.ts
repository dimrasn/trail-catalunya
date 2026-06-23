// U10 — pure shaping of stored enrichment facts into the MCP response (R12, R5,
// KTD4). Separate from tools.ts so it can be tested without importing supabase-js.
// Surfaces value-bearing stable facts with their confidence/edition/last_checked
// and a length-capped, untrusted evidence snippet. Unknown facts are omitted.

const MAX_EVIDENCE = 300
const STABLE_KEYS = ['start_time', 'price', 'confirmed_status'] as const
type StableKey = (typeof STABLE_KEYS)[number]

export interface McpFact {
  value: string
  confidence: string
  edition: string
  last_checked: string | null
  evidence: string | null
}

export type EnrichedFacts = Partial<Record<StableKey, McpFact>>

// A stored Fact (race_enrichment JSONB) → MCP shape, or null if not worth
// surfacing (no value, or unknown confidence).
export function factToMcp(raw: unknown): McpFact | null {
  if (!raw || typeof raw !== 'object') return null
  const f = raw as Record<string, unknown>
  const value = typeof f.value === 'string' && f.value.trim() ? f.value.trim() : null
  if (!value || f.confidence === 'unknown') return null
  return {
    value,
    confidence: typeof f.confidence === 'string' ? f.confidence : 'unknown',
    edition: typeof f.edition === 'string' ? f.edition : 'unknown',
    last_checked: typeof f.last_checked === 'string' ? f.last_checked : null,
    evidence: typeof f.evidence === 'string' ? f.evidence.slice(0, MAX_EVIDENCE) : null,
  }
}

// A race_enrichment row → the enriched_facts object, or null if nothing shows.
export function enrichedFactsForMcp(row: Record<string, unknown> | null | undefined): EnrichedFacts | null {
  if (!row) return null
  const out: EnrichedFacts = {}
  for (const key of STABLE_KEYS) {
    const m = factToMcp(row[key])
    if (m) out[key] = m
  }
  return Object.keys(out).length ? out : null
}
