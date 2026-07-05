// U4 — change-detection gate (R8, KTD5). A race is re-crawled only when its
// source content meaningfully changed, or its data is missing/stale. The hash
// is over the extraction-relevant text AFTER volatile bits (live clocks,
// view counters, ISO timestamps) are normalized away, so rotating banners and
// per-request tokens don't force needless re-extraction.
//
// SHA-256 (not djb2) for a collision-safe gate across ~300 pages/week.
// Run: deno test supabase/functions/enrich-races/changes_test.ts

// Re-enrich at least this often even if the page is byte-identical, so
// last_checked stays fresh.
export const DEFAULT_MAX_AGE_DAYS = 14

// Strip tokens that change per request but carry no race information. Note we
// only strip clock values WITH seconds (HH:MM:SS — live clocks); a bare HH:MM
// is preserved because that is the start-time fact we extract.
export function normalize(text: string): string {
  return text
    .replace(/\d{4}-\d{2}-\d{2}[ t]\d{2}:\d{2}(:\d{2})?(z|[+-]\d{2}:?\d{2})?/gi, ' ') // ISO datetimes
    .replace(/\b\d{1,2}:\d{2}:\d{2}\b/g, ' ') // HH:MM:SS live clocks
    .replace(/\b(visites|visitas|visits|views|lectures)\b[:\s]*[\d.,]+/gi, ' ') // counters
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export async function contentHash(text: string): Promise<string> {
  const data = new TextEncoder().encode(normalize(text))
  const digest = await crypto.subtle.digest('SHA-256', data)
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return hex.slice(0, 16)
}

export interface ExistingEnrichment {
  content_hash?: string | null
  updated_at?: string | null
}

// True when the race should be (re)enriched: never enriched, content changed,
// or the stored data is older than the max age.
export function shouldEnrich(
  existing: ExistingEnrichment | null | undefined,
  newHash: string,
  opts: { nowMs?: number; maxAgeDays?: number } = {},
): boolean {
  if (!existing || !existing.content_hash) return true
  if (existing.content_hash !== newHash) return true

  // Hash unchanged — only refresh if stale.
  if (!existing.updated_at) return true
  const maxAgeDays = opts.maxAgeDays ?? DEFAULT_MAX_AGE_DAYS
  const now = opts.nowMs ?? Date.now()
  const ageMs = now - new Date(existing.updated_at).getTime()
  return ageMs > maxAgeDays * 86_400_000
}
