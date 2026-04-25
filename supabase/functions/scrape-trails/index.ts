// Edge Function: scrape-trails
//
// Fetches the ultrescatalunya.com calendar, parses it into race rows via
// ./parser.ts, and upserts them into the `races` table on Supabase. Logs
// the run to `scrape_runs`. Port of /scrape_trails.py — keep in sync.
//
// Invoked by pg_cron weekly (Mon 05:00 UTC) and manually via
// `supabase functions invoke scrape-trails`.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { CALENDAR_URL, parseCalendar, type Race } from './parser.ts'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const REQUEST_TIMEOUT_MS = 30_000
const UPSERT_BATCH_SIZE = 100

// Minimum gap between successful runs. Cron fires weekly, so 30 minutes is
// enough to absorb any duplicate-fire / manual-poke accidents without
// blocking the user's ability to retry within a single session. Override
// with body { "force": true } when you really want to re-run.
const MIN_RERUN_GAP_MS = 30 * 60 * 1000

interface ScrapeRunRow {
  id: number
}

async function fetchPage(url: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ca,en;q=0.9',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

function dedupeRaces(races: Race[]): { deduped: Race[]; dupeCount: number } {
  // The source page contains legitimate duplicate rows (same race on
  // multiple dates, or literal repeats). The race_hash schema doesn't
  // include date, so these collapse to the same key. Postgres can't do
  // an upsert with two input rows mapping to the same conflict target,
  // so we collapse duplicates here. Policy: last occurrence wins, but
  // if the later row has a null date and an earlier row had a real date,
  // prefer the dated row.
  const byHash = new Map<string, Race>()
  for (const r of races) {
    const prev = byHash.get(r.race_hash)
    if (!prev) {
      byHash.set(r.race_hash, r)
      continue
    }
    // Prefer the row with a non-null date.
    if (prev.date != null && r.date == null) continue
    byHash.set(r.race_hash, r)
  }
  return { deduped: [...byHash.values()], dupeCount: races.length - byHash.size }
}

async function upsertRaces(
  supabase: ReturnType<typeof createClient>,
  races: Race[],
  runStartedAt: string,
): Promise<number> {
  const { deduped } = dedupeRaces(races)
  let upserted = 0
  for (let i = 0; i < deduped.length; i += UPSERT_BATCH_SIZE) {
    const batch = deduped.slice(i, i + UPSERT_BATCH_SIZE).map((r) => ({
      ...r,
      last_seen: runStartedAt,
      scraped_at: runStartedAt,
    }))
    const { error } = await supabase
      .from('races')
      .upsert(batch, { onConflict: 'race_hash' })
    if (error) {
      throw new Error(`Upsert batch ${i}-${i + batch.length}: ${error.message}`)
    }
    upserted += batch.length
  }
  return upserted
}

async function markRemoved(
  supabase: ReturnType<typeof createClient>,
  runStartedAt: string,
): Promise<number> {
  // Mark any ACTIVA/SUSPESA/SOLD_OUT rows that weren't touched this run.
  // (last_seen < runStartedAt, for the same source)
  const { data, error } = await supabase
    .from('races')
    .update({ status: 'REMOVED' })
    .eq('source', 'ultrescatalunya')
    .neq('status', 'REMOVED')
    .or(`last_seen.is.null,last_seen.lt.${runStartedAt}`)
    .select('race_hash')
  if (error) throw new Error(`Mark removed: ${error.message}`)
  return data?.length || 0
}

Deno.serve(async (req) => {
  const startedAtMs = Date.now()
  const runStartedAt = new Date(startedAtMs).toISOString()

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Parse body for optional { force: true } override.
  let force = false
  try {
    const body = await req.json()
    force = body && body.force === true
  } catch {
    // No body / not JSON — treat as default (no force)
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Recent-success guard. Prevents thundering-herd / accidental double-fire
  // from the cron and from random unauthenticated pokes (verify_jwt=false).
  if (!force) {
    const cutoff = new Date(startedAtMs - MIN_RERUN_GAP_MS).toISOString()
    const { data: recent } = await supabase
      .from('scrape_runs')
      .select('id, run_at')
      .eq('source', 'ultrescatalunya')
      .eq('status', 'success')
      .gte('run_at', cutoff)
      .order('run_at', { ascending: false })
      .limit(1)

    if (recent && recent.length > 0) {
      return new Response(
        JSON.stringify({
          status: 'skipped',
          reason: 'recent_success',
          last_run_id: recent[0].id,
          last_run_at: recent[0].run_at,
          min_gap_minutes: MIN_RERUN_GAP_MS / 60000,
          hint: 'POST body { "force": true } to override',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }
  }

  // Insert a scrape_runs row in 'running' state. We only have the status
  // values the schema allows ('success', 'error'); we use 'running' as an
  // intermediate value that gets overwritten on completion.
  const { data: runRow, error: runInsertErr } = await supabase
    .from('scrape_runs')
    .insert({
      source: 'ultrescatalunya',
      run_at: runStartedAt,
      status: 'running',
    })
    .select('id')
    .single<ScrapeRunRow>()

  if (runInsertErr || !runRow) {
    return new Response(
      JSON.stringify({ error: `Failed to create scrape_runs row: ${runInsertErr?.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const runId = runRow.id
  let rowsParsed = 0
  let rowsUpserted = 0
  let rowsRemoved = 0

  try {
    // 1. Fetch
    const html = await fetchPage(CALENDAR_URL)

    // 2. Parse
    const races = await parseCalendar(html)
    rowsParsed = races.length
    if (rowsParsed === 0) {
      throw new Error('Parser returned 0 rows — possible HTML structure change')
    }

    // 3. Upsert (using same timestamp for last_seen so we can detect stragglers)
    rowsUpserted = await upsertRaces(supabase, races, runStartedAt)

    // 4. Mark removed: rows we didn't touch this run
    rowsRemoved = await markRemoved(supabase, runStartedAt)

    // 5. Success — update scrape_runs row
    const durationMs = Date.now() - startedAtMs
    await supabase
      .from('scrape_runs')
      .update({
        status: 'success',
        total_races: rowsParsed,
        added: null, // we upsert blindly; a proper "added" count would need a pre-fetch
        removed: rowsRemoved,
        changed: null,
        duration_ms: durationMs,
      })
      .eq('id', runId)

    return new Response(
      JSON.stringify({
        run_id: runId,
        rows_parsed: rowsParsed,
        rows_upserted: rowsUpserted,
        rows_removed: rowsRemoved,
        status: 'success',
        duration_ms: durationMs,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err)
    const durationMs = Date.now() - startedAtMs

    await supabase
      .from('scrape_runs')
      .update({
        status: 'error',
        error_message: errMessage.slice(0, 2000),
        total_races: rowsParsed,
        duration_ms: durationMs,
      })
      .eq('id', runId)

    return new Response(
      JSON.stringify({
        run_id: runId,
        rows_parsed: rowsParsed,
        status: 'error',
        error: errMessage,
        duration_ms: durationMs,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
