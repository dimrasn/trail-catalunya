// U7 — enrich-races orchestrator (R6, R10, R11, KTD2, KTD3). One invocation
// processes ONE bounded chunk of the rolling 3-month window (soonest + never-
// enriched first), then returns; multiple sequential cron fires drain the rest
// (no self-retrigger). A single-flight guard prevents overlapping runs; the
// monthly spend cap is enforced via an atomic RPC. Crawled pages are hostile
// input (see fetch.ts / extract.ts). Reuses the scraper's sendAlert + a
// scrape_runs-style enrichment_runs audit row.
//
// Deployed --no-verify-jwt and gated by x-enrich-secret. Provisioning (deploy):
//   supabase secrets set ANTHROPIC_API_KEY ENRICH_SECRET
//   vault: enrich_secret, enrich_races_url (out-of-band)
//   supabase functions deploy enrich-races --no-verify-jwt

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { sendAlert } from '../_shared/email.ts'
import { classifyUrl, isCrawlable } from './classify.ts'
import { fetchRacePages } from './fetch.ts'
import { contentHash, shouldEnrich } from './changes.ts'
import { extractFacts } from './extract.ts'
import { indexOverrides, loadOverrides, mergeWithOverride } from './overrides.ts'
import { emptyFactSet, eventKey, type FactSet } from './types.ts'
import { estimateCostMicros, monthKey, overCap } from './cost.ts'

const SOURCE = 'ultrescatalunya'
const CHUNK_SIZE = 8 // races per invocation — sized to the ~150s Edge wall clock
const WINDOW_DAYS = 92 // rolling ~3-month horizon (R6)
const SINGLE_FLIGHT_MS = 10 * 60 * 1000 // treat a <10min-old "running" row as in-flight
const OVERRIDE_PATH = 'data/enrichment-overrides.json'

interface EventRow {
  source: string
  race_url: string
  town: string
  date: string | null
}

// Distinct in-window events ordered never-enriched-first, then soonest date.
async function selectChunk(supabase: SupabaseClient, nowMs: number): Promise<EventRow[]> {
  const today = new Date(nowMs).toISOString().slice(0, 10)
  const horizon = new Date(nowMs + WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10)

  const { data: races } = await supabase
    .from('races')
    .select('race_url, town, date')
    .neq('status', 'REMOVED')
    .neq('status', 'SUSPESA')
    .gte('date', today)
    .lte('date', horizon)

  // Collapse per-distance rows to events; require non-empty url+town (KTD1).
  const events = new Map<string, EventRow>()
  for (const r of races ?? []) {
    const key = eventKey(SOURCE, r.race_url, r.town)
    if (!key) continue
    const existing = events.get(key)
    if (!existing || (r.date && existing.date && r.date < existing.date)) {
      events.set(key, { source: SOURCE, race_url: (r.race_url as string).trim(), town: (r.town as string).trim(), date: r.date })
    }
  }

  const { data: enriched } = await supabase.from('race_enrichment').select('source, race_url, town')
  const enrichedKeys = new Set((enriched ?? []).map((e) => eventKey(e.source, e.race_url, e.town)))

  return [...events.entries()]
    .sort((a, b) => {
      const aEnriched = enrichedKeys.has(a[0]) ? 1 : 0
      const bEnriched = enrichedKeys.has(b[0]) ? 1 : 0
      if (aEnriched !== bEnriched) return aEnriched - bEnriched // never-enriched first
      return (a[1].date ?? '9999').localeCompare(b[1].date ?? '9999') // soonest first
    })
    .map(([, ev]) => ev)
    .slice(0, CHUNK_SIZE)
}

Deno.serve(async (req) => {
  const startedAtMs = Date.now()

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }, 500)
  }

  // Auth gate (function is --no-verify-jwt). Applies to cron fires too.
  const expectedSecret = Deno.env.get('ENRICH_SECRET')
  if (!expectedSecret) return json({ error: 'ENRICH_SECRET not configured' }, 503)
  if (req.headers.get('x-enrich-secret') !== expectedSecret) return json({ error: 'forbidden' }, 403)

  const supabase = createClient(supabaseUrl, serviceKey)

  // Single-flight: skip if another run is already in flight.
  const inFlightCutoff = new Date(startedAtMs - SINGLE_FLIGHT_MS).toISOString()
  const { data: running } = await supabase
    .from('enrichment_runs')
    .select('id')
    .eq('status', 'running')
    .gte('run_at', inFlightCutoff)
    .limit(1)
  if (running && running.length > 0) return json({ status: 'skipped', reason: 'in_flight' }, 200)

  const { data: runRow } = await supabase
    .from('enrichment_runs')
    .insert({ status: 'running' })
    .select('id')
    .single()
  const runId = runRow?.id

  const mk = monthKey(new Date(startedAtMs))
  let counts = { enriched: 0, skipped: 0, unknown: 0 }
  let costMicros = 0
  let status: 'success' | 'paused' | 'error' = 'success'

  try {
    // Current month spend (cap check is before each paid call).
    const { data: spendRow } = await supabase
      .from('enrichment_spend').select('spent_micros').eq('month_key', mk).maybeSingle()
    let spent = spendRow?.spent_micros ?? 0

    const overrides = indexOverrides(await loadOverrides(OVERRIDE_PATH), SOURCE)
    const chunk = await selectChunk(supabase, startedAtMs)
    const nowIso = new Date(startedAtMs).toISOString()

    for (const ev of chunk) {
      const key = eventKey(ev.source, ev.race_url, ev.town)!
      const override = overrides.get(key)
      if (override?.skip) {
        await upsert(supabase, ev, emptyFactSet(), null, 'crawl', nowIso)
        counts.unknown++
        continue
      }

      // Non-crawlable URL → unknown facts (still recorded for coverage, AE7).
      const cls = classifyUrl(ev.race_url)
      if (!isCrawlable(cls)) {
        const merged = mergeWithOverride(emptyFactSet(), override, nowIso)
        await upsert(supabase, ev, merged.facts, null, merged.origin, nowIso)
        counts.unknown++
        continue
      }

      const pages = await fetchRacePages(ev.race_url)
      if (pages.length === 0) {
        const merged = mergeWithOverride(emptyFactSet(), override, nowIso)
        await upsert(supabase, ev, merged.facts, null, merged.origin, nowIso)
        counts.unknown++
        continue
      }

      const hash = await contentHash(pages.map((p) => p.text).join('\n'))
      const { data: existing } = await supabase
        .from('race_enrichment').select('content_hash, updated_at')
        .eq('source', ev.source).eq('race_url', ev.race_url).eq('town', ev.town).maybeSingle()
      if (!shouldEnrich(existing, hash)) {
        counts.skipped++
        continue
      }

      // Cost cap (R11): stop before incurring spend we can't afford.
      if (overCap(spent)) {
        status = 'paused'
        await sendAlert('enrichment paused: monthly cap reached', `Spent ${spent} micros for ${mk}; stored facts keep serving.`)
        break
      }

      const { facts, usage } = await extractFacts(pages, { sourceUrl: ev.race_url, nowIso })
      const merged = mergeWithOverride(facts, override, nowIso)
      await upsert(supabase, ev, merged.facts, hash, merged.origin, nowIso)

      const cost = estimateCostMicros(usage)
      costMicros += cost
      const { data: newTotal } = await supabase.rpc('bump_enrichment_spend', { p_month: mk, p_delta: cost })
      spent = typeof newTotal === 'number' ? newTotal : spent + cost
      counts.enriched++
    }
  } catch (err) {
    status = 'error'
    await sendAlert('enrichment run errored', String(err))
  }

  if (runId != null) {
    await supabase.from('enrichment_runs').update({
      status,
      enriched: counts.enriched,
      skipped: counts.skipped,
      unknown: counts.unknown,
      cost_micros: costMicros,
      duration_ms: Date.now() - startedAtMs,
    }).eq('id', runId)
  }

  return json({ status, ...counts, cost_micros: costMicros }, 200)
})

function upsert(
  supabase: SupabaseClient,
  ev: EventRow,
  facts: FactSet,
  hash: string | null,
  origin: 'crawl' | 'override',
  nowIso: string,
) {
  return supabase.from('race_enrichment').upsert({
    source: ev.source,
    race_url: ev.race_url,
    town: ev.town,
    start_time: facts.start_time,
    price: facts.price,
    confirmed_status: facts.confirmed_status,
    content_hash: hash,
    origin,
    updated_at: nowIso,
  }, { onConflict: 'source,race_url,town' })
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
