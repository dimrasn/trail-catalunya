// U9 — pure display logic for enriched stable facts (R12 site half, R13, R14,
// R14a high-blast half, R4, KTD7). Decides which enriched facts a race card
// shows and how, applying the confidence display gate, the prior-edition
// caveat, and the staleness ceiling. Pure + tested (enrichment.test.mjs) so the
// rules are verifiable without a running site.

const HIGH_BLAST = new Set(['start_time', 'confirmed_status'])

// Generous staleness ceilings for stable high-blast facts (R14a, stable half):
// past these, a fact reverts to "check site" rather than showing a stale value.
// The tight volatile ceiling is Phase 2b.
const STALE_CEILING_DAYS = {
  start_time: 90,
  confirmed_status: 90,
  price: 365,
}

const DAY_MS = 86_400_000

function ageDays(lastChecked, nowMs) {
  if (!lastChecked) return null
  const t = Date.parse(lastChecked)
  if (Number.isNaN(t)) return null
  return (nowMs - t) / DAY_MS
}

// Returns a display descriptor for one fact, or null if it shouldn't render.
// Shape: { key, value, confidence, edition, lastChecked, highBlast,
//          likelyPrevious, stale }. When `stale` is true the card shows
// "check site" instead of the value.
export function factForDisplay(key, fact, nowMs) {
  if (!fact || !fact.value) return null
  const high = fact.confidence === 'high' || fact.confidence === 'medium'
  const highBlast = HIGH_BLAST.has(key)

  if (highBlast) {
    if (!high) return null // hidden at low confidence
    const age = ageDays(fact.last_checked, nowMs)
    const ceiling = STALE_CEILING_DAYS[key]
    if (age != null && ceiling != null && age > ceiling) {
      return { key, stale: true, highBlast }
    }
    return descriptor(key, fact, highBlast, false)
  }

  // Low-blast (price): show at high/medium; at low show with a "likely
  // (previous edition)" caveat; hide at unknown.
  if (high) return descriptor(key, fact, highBlast, false)
  if (fact.confidence === 'low') return descriptor(key, fact, highBlast, true)
  return null
}

function descriptor(key, fact, highBlast, forceLikely) {
  return {
    key,
    value: fact.value,
    confidence: fact.confidence,
    edition: fact.edition,
    lastChecked: fact.last_checked,
    highBlast,
    likelyPrevious: forceLikely || fact.edition === 'previous',
    stale: false,
  }
}

// Build the display set for a race_enrichment row. Returns null if nothing
// shows. `nowMs` is injectable for testing.
export function enrichmentForDisplay(row, nowMs = Date.now()) {
  if (!row) return null
  const out = {}
  for (const key of ['start_time', 'confirmed_status', 'price']) {
    const d = factForDisplay(key, row[key], nowMs)
    if (d) out[key] = d
  }
  return Object.keys(out).length ? out : null
}
