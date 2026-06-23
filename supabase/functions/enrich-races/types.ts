// Shared types for the race-enrichment pipeline (Phase 2a — stable facts).
//
// One enrichment record is keyed at the EVENT grain (source, race_url, town) —
// the same key app/lib/races.js and mcp/grouping.ts group on — NOT the
// per-distance grain of the `races` table. See the plan: KTD1.

export type Confidence = 'high' | 'medium' | 'low' | 'unknown'
export type Edition = '2026' | 'previous' | 'unknown'

// One enriched fact carries its value plus the trust metadata that lets the
// site and MCP be honest about uncertainty (R1). `value` is null when the
// pipeline found no evidence (R3 — "unknown", never a guess).
export interface Fact {
  value: string | null
  confidence: Confidence
  evidence: string | null
  source_url: string | null
  edition: Edition
  last_checked: string | null // ISO timestamp
}

export const UNKNOWN_FACT: Fact = {
  value: null,
  confidence: 'unknown',
  evidence: null,
  source_url: null,
  edition: 'unknown',
  last_checked: null,
}

// Phase 2a stable fact set (R2 stable half). Volatile registration/sold-out
// are Phase 2b and intentionally absent here.
export interface FactSet {
  start_time: Fact
  price: Fact
  confirmed_status: Fact // value: 'confirmed' | 'cancelled' | null
}

export const STABLE_FACT_KEYS = ['start_time', 'price', 'confirmed_status'] as const
export type StableFactKey = (typeof STABLE_FACT_KEYS)[number]

// Facts whose wrong value is worse than absence (R4 blast-radius axis). These
// always carry last_checked + a "verify at URL" posture, and revert to
// "check site" past the staleness ceiling even though they change rarely.
export const HIGH_BLAST_KEYS: StableFactKey[] = ['start_time', 'confirmed_status']

export function emptyFactSet(): FactSet {
  return {
    start_time: { ...UNKNOWN_FACT },
    price: { ...UNKNOWN_FACT },
    confirmed_status: { ...UNKNOWN_FACT },
  }
}

// A persisted enrichment row (mirrors the race_enrichment table, U1).
export interface EnrichmentRecord {
  source: string
  race_url: string
  town: string
  facts: FactSet
  content_hash: string | null
  origin: 'crawl' | 'override'
  updated_at: string | null
}
